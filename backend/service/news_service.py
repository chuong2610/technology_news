"""
News Service

This module provides functionality to:
1. Fetch news from News API
2. Extract full article content using newspaper3k
3. Paraphrase content using OpenAI API
"""

import asyncio
from email.mime import image
import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from newsapi import NewsApiClient
from newspaper import Article
from openai import AsyncAzureOpenAI
import requests
from backend.config.settings import SETTINGS

import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context



# Initialize News API client
newsapi_client = NewsApiClient(api_key=SETTINGS.newsapi_key) if SETTINGS.newsapi_key else None

# Initialize Azure OpenAI client (same as QA service)
def _init_openai_client():
    """Initialize Azure OpenAI client using same pattern as QA service"""
    try:
        if not SETTINGS.azure_openai_key or not SETTINGS.azure_openai_endpoint:
            print("Warning: Azure OpenAI credentials not configured")
            return None
            
        kwargs = {
            "api_key": SETTINGS.azure_openai_key,
            "api_version": SETTINGS.azure_openai_api_version,
            "azure_deployment": "gpt-4o-mini",
            "azure_endpoint": SETTINGS.azure_openai_endpoint
        }
        
        client = AsyncAzureOpenAI(**kwargs)
        print("Info: Azure OpenAI client initialized for news service")
        return client
        
    except Exception as e:
        print(f"Error: Failed to initialize Azure OpenAI client: {e}")
        return None

openai_client = _init_openai_client()

def fetch_news_from_newsapi() -> List[Dict[str, Any]]:
    # Improved query focused on AI and IT topics
    query = "(\"artificial intelligence\" OR \"machine learning\" OR \"deep learning\" OR \"AI technology\" OR \"software development\" OR \"programming\" OR \"computer science\" OR \"data science\" OR \"cybersecurity\" OR \"cloud computing\" OR \"blockchain\" OR \"robotics\" OR \"automation\" OR \"tech startup\" OR \"digital transformation\")"
    language = "en"
    sort_by = "publishedAt"
    page_size = 20  # Get more articles to filter
    
    # Preferred tech news sources
    tech_sources = [
        'techcrunch.com', 'arstechnica.com', 'wired.com', 'theverge.com',
        'engadget.com', 'venturebeat.com', 'zdnet.com', 'cnet.com',
        'reuters.com', 'bloomberg.com', 'cnbc.com', 'techradar.com',
        'spectrum.ieee.org', 'nature.com', 'science.org'
    ]
    
    if not newsapi_client:
        print("Error: News API key not configured")
        return []
    
    try:
        # Remove date restriction to get recent articles
        response = newsapi_client.get_everything(
            q=query,
            language=language,
            sort_by=sort_by,
            page_size=page_size
        )
        
        if response['status'] == 'ok':
            articles = response.get('articles', [])
            
            # Filter articles to focus on tech topics
            filtered_articles = []
            for article in articles:
                # Check if article is from tech sources or has tech keywords in title
                url = article.get('url', '').lower()
                title = article.get('title', '').lower()
                description = article.get('description', '').lower()
                
                # Tech keywords to look for
                tech_keywords = [
                    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
                    'software', 'programming', 'coding', 'developer', 'tech', 'technology',
                    'computer', 'digital', 'data science', 'algorithm', 'startup',
                    'cybersecurity', 'blockchain', 'cloud', 'automation', 'robot'
                ]
                
                # Skip architecture, art, design articles
                skip_keywords = [
                    'architecture', 'museum', 'art gallery', 'exhibition', 'design festival',
                    'building', 'construction', 'placemaking', 'urban planning'
                ]
                
                # Check if article should be skipped
                should_skip = any(skip_word in title or skip_word in description 
                                for skip_word in skip_keywords)
                
                if should_skip:
                    continue
                
                # Check if article is tech-related
                is_tech_source = any(source in url for source in tech_sources)
                has_tech_keywords = any(keyword in title or keyword in description 
                                      for keyword in tech_keywords)
                
                if is_tech_source or has_tech_keywords:
                    filtered_articles.append(article)
            
            # Limit to 10 most relevant articles
            filtered_articles = filtered_articles[:10]
            
            print(f"Info: Fetched {len(filtered_articles)} tech articles from News API (filtered from {len(articles)} total)")
            return filtered_articles
            
        else:
            print(f"Error: News API error: {response}")
            return []
            
    except Exception as e:
        print(f"Error: Error fetching news from API: {str(e)}")
        return []


async def extract_article_content(url: str) -> Optional[Dict[str, Any]]:
    try:
        article = Article(url)
        article.download()
        article.parse()
        article.nlp()
        
        extracted_data = {
            'url': url,
            'title': article.title,
            'text': article.text,
            'summary': article.summary,
            'authors': article.authors,
            'publish_date': article.publish_date.isoformat() if article.publish_date else None,
            'top_image': article.top_image,
            'keywords': article.keywords,
            'meta_keywords': article.meta_keywords,
            'meta_description': article.meta_description,
            'word_count': len(article.text.split()) if article.text else 0
        }
        
        print(f"Info: Successfully extracted content from {url}")
        return extracted_data
        
    except Exception as e:
        print(f"Error: Error extracting content from {url}: {str(e)}")
        return None


async def paraphrase_article(title: str, abstract: str, content: str, keywords: List[str], source_name: str, source_url: str, max_tokens: int = 3000) -> Optional[Dict[str, Any]]:
    if not openai_client:
        print("Warning: Azure OpenAI client not configured - skipping paraphrasing")
        return None
        
    try:
        # Check if we have enough content to paraphrase
        if not content or len(content.strip()) < 100:
            print("Warning: Content too short or empty for paraphrasing")
            return None
        
        # Use description as abstract if abstract is empty
        
        # Log what we're sending to AI for debugging

        prompt = f"""
You are a professional journalist and experienced editor. Your task is to paraphrase the given article while maintaining accuracy and adapting it for readers.

PARAPHRASING PRINCIPLES:
- Maintain the accuracy and objectivity of the original information
- Use the SAME LANGUAGE as the input article (English → English, Vietnamese → Vietnamese)
- Preserve proper names, company names, numbers, and technical terms
- Create well-structured HTML content with appropriate formatting tags
- Return the exact JSON format as required

ORIGINAL ARTICLE:
Title: {title}
Abstract: {abstract}
Content: {content}
Original Keywords: {keywords}

TAG GENERATION GUIDELINES:
- Create 3-7 relevant tags that match the content topic
- Tags are 1-3 words maximum
- Use lowercase with hyphens between words (e.g., "machine-learning", "data-science", "ai")
- Are relevant to the content topic
- Complement the existing tags (avoid duplicates)
- Are useful for article categorization
- Follow format: single-word OR word-word OR word-word-word
- Examples: "artificial-intelligence", "blockchain", "startup", "healthcare", "education", "fintech"

REQUIRED JSON FORMAT (MANDATORY):
{{
  "title": "Concise and engaging title in the same language as input (max 80 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "abstract": "Brief 2-3 sentence summary in the same language as input, highlighting key points",
  "content": "<p>Engaging opening paragraph introducing the topic...</p><h3>Subheading if needed</h3><p>Detailed content completely paraphrased in the same language as input, using HTML tags like <strong>, <em>, <h3> for formatting. Split into multiple <p> paragraphs for readability.</p><p><strong>Source:</strong> <a href=\\"{source_url}\\" target=\\"_blank\\">{source_name}</a></p>"
}}
"""
        
        # Use same model as QA service
        response = await openai_client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a professional journalist and senior editor with deep expertise in multilingual content adaptation. Always strictly adhere to the required JSON format. Never add markdown, comments, or any text other than standard JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.3  # Lower temperature for more consistent output
        )
        
        paraphrased_response = response.choices[0].message.content.strip()
        return json.loads(paraphrased_response)

    except Exception as e:
        print(f"Warning: Error paraphrasing content: {str(e)} - continuing without paraphrasing")
        return None


async def process_single_article(article_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    url = article_data.get('url')
    if not url:
        return None
    
    extracted_content = await extract_article_content(url)

    if not extracted_content or not extracted_content.get('text'):
        print(f"Warning: Could not extract content from {url}")
        return None
    
    # Get source information
    source_name = article_data.get('source', {}).get('name', 'Unknown Source')
    source_url = url
    image = article_data.get('urlToImage')
    
    # Prepare data for paraphrasing
    title = article_data.get('title', '')
    abstract = extracted_content.get('summary') or article_data.get('description', '')
    content = extracted_content.get('text', '')
    keywords = extracted_content.get('keywords', []) or []
    
    # Paraphrase the article
    paraphrased_data = await paraphrase_article(
        title=title,
        abstract=abstract, 
        content=content,
        keywords=keywords,
        source_name=source_name,
        source_url=source_url,
    )

    if paraphrased_data:
        # Return the paraphrased JSON with image
        result = {
            "title": paraphrased_data.get('title', title),
            "tags": paraphrased_data.get('tags', keywords),
            "abstract": paraphrased_data.get('abstract', abstract),
            "content": paraphrased_data.get('content', content),
            "image": image,
        }
        return result
    else:
        return None

 
async def fetch_and_process_news() -> List[Dict[str, Any]]:

    try:
        articles = fetch_news_from_newsapi()
        if not articles:
            print("Warning: No articles fetched from News API")
            return []
        
        print(f"Info: Processing {len(articles)} articles")
        
        semaphore = asyncio.Semaphore(5)
        
        async def process_with_semaphore(article):
            async with semaphore:
                return await process_single_article(article)
        
        tasks = [process_with_semaphore(article) for article in articles]
        processed_articles = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful_articles = [
            article for article in processed_articles 
            if article is not None and not isinstance(article, Exception)
        ]
        
        print(f"Info: Successfully processed {len(successful_articles)} out of {len(articles)} articles")
        return successful_articles
        
    except Exception as e:
        print(f"Error: Error in fetch_and_process_news: {str(e)}")
        return []


