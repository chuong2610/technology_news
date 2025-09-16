import uuid

from backend.database.cosmos import get_qas_result_container
from azure.cosmos.exceptions import CosmosResourceNotFoundError


async def create_qa_result(qa_result: dict) -> dict:
    container = await get_qas_result_container()
    await container.create_item(body=qa_result)
    return qa_result


async def find_qa_result_by_id(qa_result_id: str) -> dict:
    try:
        container = await get_qas_result_container()
        
        item = await container.read_item(
            item=qa_result_id,
            partition_key=qa_result_id
        )
        return item
        
    except CosmosResourceNotFoundError:
        return None
async def find_all_qa_results() -> list:
    container = await get_qas_result_container()
    query = "SELECT * FROM c ORDER BY c.created_at DESC"

    items = []
    async for item in container.query_items(query=query):
        items.append(item)
        
    return items   

async def find_all_qa_results_by_user(user_id: str) -> list:
    container = await get_qas_result_container()
    query = "SELECT * FROM c WHERE c.user_id=@user_id ORDER BY c.created_at DESC"
    parameters = [
        {"name": "@user_id", "value": user_id}
    ]

    items = []
    async for item in container.query_items(query=query, parameters=parameters):
        items.append(item)

    return items

async def find_all_qa_results_by_user_and_qa(user_id: str, qa_id: str) -> list:
    container = await get_qas_result_container()
    query = "SELECT * FROM c WHERE c.user_id=@user_id AND c.qa_id=@qa_id ORDER BY c.created_at DESC"
    parameters = [
        {"name": "@user_id", "value": user_id},
        {"name": "@qa_id", "value": qa_id}
    ]

    items = []
    async for item in container.query_items(query=query, parameters=parameters):
        items.append(item)

    return items
