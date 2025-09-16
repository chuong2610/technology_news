"""
Article Generation Service using LLM with robust error handling
Generates high-quality articles based on user input (query, text, or content)
"""

import asyncio
import json
import os
import re
import uuid
from typing import List, Dict, Any, Optional
from openai import AsyncAzureOpenAI

from backend.config.settings import SETTINGS

# Article Generation Configuration
ARTICLE_GENERATION_CONFIG = {
    "default_article_length": "medium",  # short, medium, long
    "max_content_length": 10000,
    "max_query_length": 1000,
    "max_input_text_length": 5000,
    "article_types": ["informative", "tutorial", "opinion", "review", "news"],
    "output_formats": ["markdown", "html"],
    "tone_options": ["professional", "casual", "academic", "conversational", "technical"]
}

ARTICLE_GENERATION_PROMPT = """
You are an expert content writer. Generate a high-quality English article based on the user's requirements.

**INPUT:**
Topic/Query: {query}
Additional Content: {input_text}
Article Type: {article_type}
Length: {length}
Tone: {tone}
Format: {output_format}

**TASK:** Create a well-structured article with the following requirements:

**LENGTH GUIDELINES:**
- Short: 500-800 words
- Medium: 1000-1500 words  
- Long: 2000-3000 words

**TONE GUIDELINES:**
- Professional: Formal, authoritative
- Academic: Scholarly, research-focused
- Casual: Friendly, conversational
- Conversational: Personal, engaging
- Formal: Official, structured
- Authoritative: Expert, confident

**OUTPUT:** Return ONLY a valid JSON object with this exact structure:
{{
  "title": "Engaging article title",
  "abstract": "Brief 2-3 sentence summary of the article",
  "content": "Full article content in {output_format} format with proper headings and structure",
  "tags": ["relevant", "topic", "tags"]
}}

**IMPORTANT:** 
- Return ONLY valid JSON, no additional text
- Content should be original, well-structured, and engaging
- Use proper {output_format} formatting for content
- Include relevant headings and subheadings in the content
- Generate 3-5 relevant tags based on the content
- Ensure the abstract is compelling and summarizes the key points


**RULES:**
- Do NOT include any text outside the JSON.
- Do NOT use backslashes (`\`) in the JSON (avoid `\n`, `\t`, etc.).
- Ensure all quotation marks inside values are properly escaped or replaced.
- Article must be original, structured, and engaging.
- Use appropriate {output_format} formatting for the "content".
- Abstract must be 2–3 sentences.
- Tags should be 3–5 relevant keywords.

Generate the article now:
"""

class ArticleGenerationService:
    def __init__(self):
        """Initialize the Article Generation Service"""
        self.client = AsyncAzureOpenAI(
            api_key=SETTINGS.azure_openai_key,
            api_version=SETTINGS.azure_openai_api_version,
            azure_endpoint=SETTINGS.azure_openai_endpoint
        )
        self.deployment_name = SETTINGS.azure_openai_deployment

    async def generate_article(
        self,
        query: str,
        input_text: str = "",
        article_type: str = "informative",
        length: str = "medium",
        tone: str = "professional",
        output_format: str = "markdown"
    ) -> Dict[str, Any]:
        """
        Generate an article based on the provided parameters
        
        Args:
            query: Main topic or query for the article
            input_text: Additional text content to base the article on
            article_type: Type of article (informative, tutorial, opinion, etc.)
            length: Desired length (short, medium, long)
            tone: Writing tone (professional, casual, academic, etc.)
            output_format: Output format (markdown, html)
            
        Returns:
            Dict containing the generated article and metadata
        """
        try:
            # Validate inputs
            if not query or len(query.strip()) == 0:
                raise ValueError("Query/topic is required")
                
            if len(query) > ARTICLE_GENERATION_CONFIG["max_query_length"]:
                query = query[:ARTICLE_GENERATION_CONFIG["max_query_length"]]
                
            if len(input_text) > ARTICLE_GENERATION_CONFIG["max_input_text_length"]:
                input_text = input_text[:ARTICLE_GENERATION_CONFIG["max_input_text_length"]]
            
            # Validate parameters
            if article_type not in ARTICLE_GENERATION_CONFIG["article_types"]:
                article_type = "informative"
            
            if length not in ["short", "medium", "long"]:
                length = "medium"
                
            if tone not in ARTICLE_GENERATION_CONFIG["tone_options"]:
                tone = "professional"
                
            if output_format not in ARTICLE_GENERATION_CONFIG["output_formats"]:
                output_format = "markdown"

            print(f"🔧 Article generation parameters:")
            print(f"🔧 Query: {query[:100]}...")
            print(f"🔧 Input text length: {len(input_text)}")
            print(f"🔧 Article type: {article_type}")
            print(f"🔧 Length: {length}")
            print(f"🔧 Tone: {tone}")
            print(f"🔧 Output format: {output_format}")

            # Prepare the prompt
            prompt = ARTICLE_GENERATION_PROMPT.format(
                query=query,
                input_text=input_text,
                article_type=article_type,
                length=length,
                tone=tone,
                output_format=output_format
            )

            print(f"🔧 Prompt length: {len(prompt)}")
            print(f"🔧 Making API call to Azure OpenAI...")

            # Generate the article using Azure OpenAI
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert content creator. Generate high-quality articles based on user input. Always return valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=4000,
                top_p=0.9,
                frequency_penalty=0.3,
                presence_penalty=0.3
            )

            print(f"🔧 API call successful!")

            # Extract and parse the response
            content = response.choices[0].message.content.strip()
            print(f"🔧 Response content length: {len(content)}")
            print(f"🔧 Response preview: {content[:200]}...")
            
            # Clean the response to ensure it's valid JSON
            content = self._clean_json_response(content)
            print(f"🔧 Cleaned content length: {len(content)}")
            
            # Parse the JSON
            article_data = json.loads(content)
            print(f"🔧 JSON parsed successfully!")
            print(f"🔧 Article data keys: {list(article_data.keys())}")
            
            # Validate the response structure - only essential fields
            required_fields = ["title", "abstract", "content", "tags"]
            for field in required_fields:
                if field not in article_data:
                    print(f"❌ Missing required field: {field}")
                    raise ValueError(f"Missing required field: {field}")
                else:
                    print(f"✅ Found field: {field}")
            
            # Ensure tags is a list
            if not isinstance(article_data["tags"], list):
                print(f"🔧 Converting tags to list from: {type(article_data['tags'])}")
                article_data["tags"] = []
            
            print(f"🔧 About to return successful response...")
            result = {
                "success": True,
                "title": article_data["title"],
                "abstract": article_data["abstract"], 
                "content": article_data["content"],
                "tags": article_data["tags"],
                "message": "Article generated successfully"
            }
            print(f"🔧 Returning result with keys: {list(result.keys())}")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "message": f"Invalid JSON response from AI: {str(e)}"
            }
        except Exception as e:
            print(f"❌ General exception: {str(e)}")
            print(f"❌ Exception type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": "Article generation failed",
                "message": str(e)
            }

    def _clean_json_response(self, content: str) -> str:
        """Clean the AI response to ensure it's valid JSON"""
        # Remove any text before the first {
        start = content.find('{')
        if start != -1:
            content = content[start:]
        
        # Remove any text after the last }
        end = content.rfind('}')
        if end != -1:
            content = content[:end + 1]
        
        # Remove any markdown code block markers
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        content = re.sub(r'^```\s*', '', content)
        
        return content.strip()

    async def get_article_suggestions(self, query: str) -> Dict[str, Any]:
        """
        Get article topic suggestions based on a query
        
        Args:
            query: Base query to generate suggestions from
            
        Returns:
            Dict containing suggested topics and article types
        """
        try:
            if not query or len(query.strip()) == 0:
                raise ValueError("Query is required for suggestions")

            prompt = f"""
            Based on the topic: "{query}"
            
            Generate 5 related article suggestions with different angles and approaches.
            
            Return ONLY a valid JSON object with this structure:
            {{
                "suggestions": [
                    {{
                        "title": "Suggested Article Title",
                        "description": "Brief description of the article approach",
                        "article_type": "informative|tutorial|opinion|review|news",
                        "estimated_length": "short|medium|long",
                        "target_audience": "Brief description of target readers"
                    }}
                ]
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a content strategy expert. Generate diverse article suggestions. Always return valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=1000
            )

            content = response.choices[0].message.content.strip()
            content = self._clean_json_response(content)
            suggestions_data = json.loads(content)
            
            return {
                "success": True,
                "data": suggestions_data,
                "message": "Article suggestions generated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Failed to generate suggestions",
                "message": str(e)
            }


# Create a global instance
article_generation_service = ArticleGenerationService()


# Async functions for use in routes
async def generate_article_from_input(
    query: str,
    input_text: str = "",
    article_type: str = "informative",
    length: str = "medium",
    tone: str = "professional",
    output_format: str = "markdown"
) -> Dict[str, Any]:
    """Generate an article from user input"""
    return await article_generation_service.generate_article(
        query=query,
        input_text=input_text,
        article_type=article_type,
        length=length,
        tone=tone,
        output_format=output_format
    )


async def get_article_suggestions_from_query(query: str) -> Dict[str, Any]:
    """Get article suggestions based on a query"""
    return await article_generation_service.get_article_suggestions(query)
