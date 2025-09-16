"""
QA Test Generation Service for articles using LLM with robust error handling
Generates multiple-choice questions with explanations based on article content
"""

import asyncio
import json
import os
import re
import uuid
from typing import List, Dict, Any, Optional
from openai import AsyncAzureOpenAI

from backend.config.settings import SETTINGS

# QA Generation Configuration
QA_GENERATION_CONFIG = {
    "default_questions_count": 5,
    "min_questions_count": 3,
    "max_questions_count": 100,
    "max_content_length": 8000,
    "max_title_length": 1000,
    "max_abstract_length": 4000,
    "time_per_question_seconds": 5,
    "difficulty_levels": ["easy", "medium", "hard"],
    "question_types": ["factual", "conceptual", "analytical"]
}

QA_GENERATION_PROMPT = """
You are an expert educational content creator. Generate high-quality multiple-choice questions based on the provided article content.

**ARTICLE INFORMATION:**
Title: {title}
Abstract: {abstract}
Content: {content}

**TASK:** Create {num_questions} multiple-choice questions that test comprehension of this article.

**CHAIN OF THOUGHT APPROACH:**
1. **Content Analysis**: Identify key concepts, main ideas, specific facts, and important details
2. **Question Planning**: Determine what aspects to test (facts, concepts, analysis, application)
3. **Question Creation**: Craft clear, unambiguous questions with appropriate difficulty
4. **Answer Development**: Create one correct answer and three plausible distractors
5. **Explanation Writing**: Provide clear explanations for why the correct answer is right

**REQUIREMENTS:**
- Questions should cover different aspects of the article (main ideas, specific details, implications)
- Each question must have exactly 4 answer options (A, B, C, D)
- Only ONE answer should be definitively correct
- Distractors should be plausible but clearly wrong to someone who understood the content
- Questions should be clear, specific, and unambiguous
- Avoid trick questions or overly complex wording
- Mix difficulty levels (some easy, some medium, some challenging)
- Include explanations that help learners understand the concept

**EXAMPLES OF GOOD QUESTIONS:**

Example 1 (Factual):
Question: "According to the article, what is the primary benefit of machine learning in healthcare?"
A) Reducing hospital costs
B) Improving diagnostic accuracy
C) Eliminating human doctors
D) Speeding up patient registration
Explanation: "The article specifically states that machine learning's main advantage in healthcare is its ability to analyze medical images and data more accurately than traditional methods, leading to better diagnostic outcomes."

Example 2 (Conceptual):
Question: "What concept does the author use to explain why neural networks are effective?"
A) They mimic the structure of the human brain
B) They use quantum computing principles
C) They rely on statistical averages
D) They follow traditional programming logic
Explanation: "The author draws a parallel between neural networks and biological brain structure, explaining that the interconnected nodes process information similarly to neurons."

Example 3 (Analytical):
Question: "Based on the article's discussion, what would be the most likely consequence of implementing the proposed solution?"
A) Immediate cost reduction
B) Better user engagement and retention
C) Complete elimination of existing problems
D) Simplified technical requirements
Explanation: "The article presents evidence that user-centered design improvements typically lead to higher satisfaction and continued usage, which aligns with the proposed solution's goals."

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:

{{
  "questions": [
    {{
      "question_id": "uuid-string",
      "question": "Clear, specific question text",
      "answer_a": "First option",
      "answer_b": "Second option", 
      "answer_c": "Third option",
      "answer_d": "Fourth option",
      "correct_answer": "answer_a|answer_b|answer_c|answer_d",
      "explanation": "Clear explanation of why the correct answer is right and how it relates to the article content"
    }}
  ]
}}

**IMPORTANT:** 
- Generate exactly {num_questions} questions
- Ensure JSON is valid and properly formatted
- Each question must test understanding of the article content
- Explanations should reference specific parts of the article
- Avoid questions that can be answered without reading the article
- DO NOT include any hints, checkmarks, asterisks, or indicators showing which answer is correct
- All answer options should appear neutral without any visual cues
- Questions should be fair tests of knowledge without giving away the answer
"""

class QAGenerationService:
    """Service for generating QA tests from article content using Azure OpenAI"""
    
    def __init__(self):
        self.llm_client = None
        self._init_llm()
    
    def _init_llm(self):
        """Initialize Azure OpenAI client"""
        try:
            kwargs = {
                "api_key": SETTINGS.azure_openai_key,
                "api_version": SETTINGS.azure_openai_api_version,
                "azure_deployment": "gpt-4o-mini",
                "azure_endpoint": SETTINGS.azure_openai_endpoint
            }
            print(f"🌐 QA Service: Using Azure OpenAI endpoint: {SETTINGS.azure_openai_endpoint}")
            
            self.llm_client = AsyncAzureOpenAI(**kwargs)
            print("🤖 QA Service: Azure OpenAI client initialized")
        except Exception as e:
            print(f"⚠️ QA Service: Failed to initialize LLM client: {e}")
            self.llm_client = None
    
    def _clean_text_for_qa(self, text: str, max_length: int) -> str:
        """Clean and prepare text for QA generation"""
        if not text:
            return ""
        
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', text)
        # Remove extra whitespace and normalize
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        # Remove special characters that might interfere with JSON
        clean_text = re.sub(r'[^\w\s.,!?;:()\-\'\"]+', ' ', clean_text)
        # Limit length
        return clean_text[:max_length]
    
    def _validate_qa_structure(self, qa_data: Dict[str, Any]) -> bool:
        """Validate the structure of generated QA data"""
        try:
            if not isinstance(qa_data, dict) or "questions" not in qa_data:
                return False
            
            questions = qa_data["questions"]
            if not isinstance(questions, list) or len(questions) == 0:
                return False
            
            required_fields = [
                "question_id", "question", "answer_a", "answer_b", 
                "answer_c", "answer_d", "correct_answer", "explanation"
            ]
            
            for question in questions:
                if not isinstance(question, dict):
                    return False
                
                # Check required fields
                for field in required_fields:
                    if field not in question or not question[field]:
                        return False
                
                # Validate correct_answer format
                correct_answer = question["correct_answer"].lower()
                if correct_answer not in ["a", "b", "c", "d", "answer_a", "answer_b", "answer_c", "answer_d"]:
                    return False
                
                # Check minimum content length
                if len(question["question"].strip()) < 10:
                    return False
                
                if len(question["explanation"].strip()) < 20:
                    return False
            
            return True
            
        except Exception as e:
            print(f"❌ QA Service: Validation error: {e}")
            return False
    
    def _normalize_correct_answer(self, correct_answer: str) -> str:
        """Normalize correct_answer to answer_x format"""
        correct_answer = correct_answer.lower().strip()
        
        # If already in answer_x format, return as is
        if correct_answer in ["answer_a", "answer_b", "answer_c", "answer_d"]:
            return correct_answer
        
        # Convert single letter to answer_x format
        mapping = {
            "a": "answer_a",
            "b": "answer_b", 
            "c": "answer_c",
            "d": "answer_d"
        }
        
        return mapping.get(correct_answer, "answer_a")  # Default to answer_a if invalid
    
    def _enhance_qa_data(self, qa_data: Dict[str, Any], article_id: str) -> Dict[str, Any]:
        """Enhance QA data with additional metadata and ensure proper IDs"""
        try:
            enhanced_data = {
                "article_id": article_id,  # Reference to the article
                "created_at": "",  # Will be set by backend
                "updated_at": "",  # Will be set by backend
                "questions": []
            }
            
            for question in qa_data["questions"]:
                enhanced_question = {
                    "question_id": str(uuid.uuid4()),  # Generate unique ID for each question
                    "question": question["question"].strip(),
                    "answer_a": question["answer_a"].strip(),
                    "answer_b": question["answer_b"].strip(),
                    "answer_c": question["answer_c"].strip(),
                    "answer_d": question["answer_d"].strip(),
                    "correct_answer": self._normalize_correct_answer(question["correct_answer"]),
                    "explanation": question["explanation"].strip(),
                    "difficulty": question.get("difficulty", "medium"),
                    "question_type": question.get("question_type", "conceptual")
                }
                enhanced_data["questions"].append(enhanced_question)
            
            return enhanced_data
            
        except Exception as e:
            print(f"❌ QA Service: Enhancement error: {e}")
            raise
    
    def _create_fallback_qa(self, article_id: str, title: str, content: str, num_questions: int = 3) -> Dict[str, Any]:
        """Create basic QA questions when LLM fails"""
        print("🔄 QA Service: Creating fallback questions")
        
        fallback_questions = [
            {
                "question_id": str(uuid.uuid4()),
                "question": f"What is the main topic discussed in '{title[:50]}...'?",
                "answer_a": "Technology and innovation",
                "answer_b": "Historical events",
                "answer_c": "Scientific research",
                "answer_d": "Personal opinions",
                "correct_answer": "answer_a",
                "explanation": "Based on the article title and content, this appears to be the primary focus.",
                "difficulty": "easy",
                "question_type": "factual"
            },
            {
                "question_id": str(uuid.uuid4()),
                "question": f"According to the article, what approach does the author take?",
                "answer_a": "Theoretical analysis",
                "answer_b": "Practical application",
                "answer_c": "Critical evaluation", 
                "answer_d": "Historical comparison",
                "correct_answer": "answer_b",
                "explanation": "The article appears to focus on practical applications and real-world scenarios.",
                "difficulty": "medium",
                "question_type": "conceptual"
            },
            {
                "question_id": str(uuid.uuid4()),
                "question": f"What can be inferred from the article's conclusion?",
                "answer_a": "More research is needed",
                "answer_b": "The topic is well-established",
                "answer_c": "Practical implementation is key",
                "answer_d": "Further discussion is required",
                "correct_answer": "answer_c",
                "explanation": "Based on the overall tone and content, practical implementation appears to be emphasized.",
                "difficulty": "medium",
                "question_type": "analytical"
            }
        ]
        
        return {
            "article_id": article_id,
            "questions": fallback_questions[:num_questions]
        }
    
    async def generate_qa_test(self, 
                              article_id: str,
                              title: str = "", 
                              abstract: str = "", 
                              content: str = "",
                              num_questions: int = 5) -> Dict[str, Any]:
        """
        Generate QA test for an article
        
        Args:
            article_id: Unique identifier for the article
            title: Article title
            abstract: Article abstract/summary
            content: Full article content
            num_questions: Number of questions to generate (3-10)
            
        Returns:
            Dict with QA test data ready for storage
        """
        
        if not self.llm_client:
            print("⚠️ QA Service: LLM client not available, using fallback")
            return self._create_fallback_qa(article_id, title, content, min(num_questions, 3))
        
        # Validate and normalize inputs
        if not article_id or not title:
            raise ValueError("Article ID and title are required")
        
        # Normalize number of questions
        num_questions = max(
            QA_GENERATION_CONFIG["min_questions_count"],
            min(num_questions, QA_GENERATION_CONFIG["max_questions_count"])
        )
        
        # Clean and prepare content
        clean_title = self._clean_text_for_qa(title, QA_GENERATION_CONFIG["max_title_length"])
        clean_abstract = self._clean_text_for_qa(abstract, QA_GENERATION_CONFIG["max_abstract_length"])
        clean_content = self._clean_text_for_qa(content, QA_GENERATION_CONFIG["max_content_length"])
        
        if not clean_title and not clean_content:
            raise ValueError("Insufficient content to generate questions")
        
        # Create the prompt
        prompt = QA_GENERATION_PROMPT.format(
            title=clean_title,
            abstract=clean_abstract,
            content=clean_content,
            num_questions=num_questions
        )
        
        try:
            # Call Azure OpenAI
            print(f"🤖 QA Service: Generating {num_questions} questions for article '{clean_title[:50]}...'")
            
            response = await self.llm_client.chat.completions.create(
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=8000,
                temperature=0.3
            )
            
            generated_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                qa_data = json.loads(generated_text)
            except json.JSONDecodeError as e:
                print(f"⚠️ QA Service: JSON parsing failed: {e}")
                print(f"Raw response: {generated_text[:500]}...")
                raise Exception("Failed to parse LLM response as JSON")
            
            # Validate structure
            if not self._validate_qa_structure(qa_data):
                raise Exception("Generated QA data failed validation")
            
            # Enhance and finalize data
            enhanced_qa = self._enhance_qa_data(qa_data, article_id)
            
            print(f"✅ QA Service: Successfully generated {len(enhanced_qa['questions'])} questions")
            
            return {
                "success": True,
                "data": enhanced_qa,
                "questions_count": len(enhanced_qa['questions']),
                "estimated_time_minutes": len(enhanced_qa['questions']) * QA_GENERATION_CONFIG["time_per_question_seconds"] / 60,
                "method_used": "llm"
            }
            
        except Exception as e:
            print(f"❌ QA Service: LLM generation failed: {e}")
            
            # Fallback to basic questions
            try:
                fallback_qa = self._create_fallback_qa(article_id, clean_title, clean_content, 3)
                
                return {
                    "success": True,
                    "data": fallback_qa,
                    "questions_count": len(fallback_qa['questions']),
                    "estimated_time_minutes": len(fallback_qa['questions']) * QA_GENERATION_CONFIG["time_per_question_seconds"] / 60,
                    "method_used": "fallback",
                    "warning": "Used fallback questions due to LLM failure"
                }
                
            except Exception as fallback_error:
                print(f"❌ QA Service: Even fallback failed: {fallback_error}")
                
                return {
                    "success": False,
                    "error": f"QA generation failed: {str(e)}",
                    "fallback_error": str(fallback_error)
                }
    
# Global service instance
qa_generation_service = QAGenerationService()

