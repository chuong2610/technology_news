import os
from dotenv import load_dotenv
from azure.cosmos import PartitionKey
from azure.cosmos.aio import CosmosClient

load_dotenv()

ENDPOINT = os.getenv("COSMOS_ENDPOINT")
KEY = os.getenv("COSMOS_KEY")
DATABASE_NAME = os.getenv("COSMOS_DB")
QAS_CONTAINER = os.getenv("COSMOS_QAS")
QAS_RESULT_CONTAINER = os.getenv("COSMOS_QA_RESULT")

# Debug: Print environment variables (remove in production)
print(f"🔍 Cosmos Config: ENDPOINT={ENDPOINT}, DB={DATABASE_NAME}, QUESTIONS={QAS_CONTAINER}, ANSWERS={QAS_RESULT_CONTAINER}")

# Cosmos client and container references are kept in module-level globals
# so they can be lazily initialized and reused across requests. These are
# asynchronous clients from azure.cosmos.aio.
client: CosmosClient = None
database = None
questions = None


async def connect_cosmos():
    """Create the CosmosClient and container references.

    This is called during app startup (see `backend.main`) and will
    create the database and containers if they do not exist.
    """
    global client, database, questions, answers

    # Validate required environment variables
    if not all([ENDPOINT, KEY, DATABASE_NAME, QAS_CONTAINER, QAS_RESULT_CONTAINER]):
        missing = []
        if not ENDPOINT: missing.append("COSMOS_ENDPOINT")
        if not KEY: missing.append("COSMOS_KEY") 
        if not DATABASE_NAME: missing.append("COSMOS_DB")
        if not QAS_CONTAINER: missing.append("COSMOS_QA")
        if not QAS_RESULT_CONTAINER: missing.append("COSMOS_QA_RESULT")
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    if client is None:
        client = CosmosClient(ENDPOINT, credential=KEY)
        database = await client.create_database_if_not_exists(DATABASE_NAME)

        questions = await database.create_container_if_not_exists(
            id=QAS_CONTAINER,
            partition_key=PartitionKey(path="/id")
        )

        answers = await database.create_container_if_not_exists(
            id=QAS_RESULT_CONTAINER,
            partition_key=PartitionKey(path="/id")
        )

        print("✅ Connected to Azure Cosmos DB")


async def close_cosmos():
    """Close the Cosmos async client and clear module references.

    Properly awaiting client.close() prevents unclosed aiohttp sessions
    and related warnings during application shutdown.
    """
    global client, database, questions, answers
    try:
        if client:
            # Azure Cosmos async client exposes an async close
            await client.close()
    except Exception as e:
        print(f"Error closing Cosmos client: {e}")
    finally:
        client = None
        database = None
        questions = None
        answers = None
        print("🛑 Cosmos DB connection closed")


async def get_qas_container():
    if questions is None:
        await connect_cosmos()
    return questions


async def get_qas_result_container():
    if answers is None:
        await connect_cosmos()
    return answers
