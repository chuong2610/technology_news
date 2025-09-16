# repository/question_repo.py
# Data Access Layer cho Question operations
# Chứa các operations low-level với database

from typing import List, Optional, Dict, Any
from azure.cosmos.exceptions import CosmosResourceNotFoundError, CosmosResourceExistsError
from backend.database.cosmos import get_qas_container

async def find_all() -> List[Dict[str, Any]]:
    container = await get_qas_container()
    
    # Query tất cả documents
    query = "SELECT * FROM c ORDER BY c.created_at DESC"

    items = []
    # Với async client, cross-partition query được enable tự động
    async for item in container.query_items(query=query):
        items.append(item)
        
    return items
    
async def find_by_id(question_id: str) -> Optional[Dict[str, Any]]:
    try:
        container = await get_qas_container()
        
        # Đọc document trực tiếp bằng ID và partition key
        item = await container.read_item(
            item=question_id,
            partition_key=question_id
        )
        return item
        
    except CosmosResourceNotFoundError:
        # Document không tồn tại
        return None

async def create(question_data: Dict[str, Any]) -> Dict[str, Any]:
    container = await get_qas_container()
    
    # Tạo document mới trong container
    # create_item sẽ raise error nếu ID đã tồn tại
    response = await container.create_item(body=question_data)
    return response

async def update(question_id: str, question_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        container = await get_qas_container()
        
        # Replace toàn bộ document với dữ liệu mới
        response = await container.replace_item(
            item=question_id,
            body=question_data
        )
        return response
        
    except CosmosResourceNotFoundError:
        # Document không tồn tại
        return None

async def delete(question_id: str) -> bool:
    try:
        container = await get_qas_container()
        
        await container.delete_item(
            item=question_id,
            partition_key=question_id
        )
        return True
        
    except CosmosResourceNotFoundError:
        return False


async def get_qa_by_article_id(article_id: str) -> Optional[List[Dict]]:
    container = await get_qas_container()
    query = "SELECT * FROM c WHERE c.article_id=@article_id"
    parameters = [
        {"name": "@article_id", "value": article_id}
    ]

    items = []
    async for item in container.query_items(query=query, parameters=parameters):
        items.append(item)
    return items 