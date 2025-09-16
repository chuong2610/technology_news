import uuid
from datetime import datetime
from backend.repository import qa_repo
from backend.repository.qa_repo import find_by_id
from backend.repository.qa_result_repo import create_qa_result, find_all_qa_results, find_all_qa_results_by_user, find_all_qa_results_by_user_and_qa, find_qa_result_by_id
from backend.routes import qa


async def create_qa_result_service(qa_id: str, user_id: str, qa: dict) -> dict:
    existing_qa = await find_by_id(qa_id)
    if not existing_qa:
        return None
    
    correct_answers = 0
    questions=[]
    for q in existing_qa.get('questions', []):
        if q.get('correct_answer') == qa.get(q.get('question_id')):
            correct_answers += 1
            is_correct = True
        else:
            is_correct = False
        question_result = {
            "question_id": q.get('question_id'),
            "question": q.get('question'),
            "answer_a": q.get('answer_a'),
            "answer_b": q.get('answer_b'),
            "answer_c": q.get('answer_c'),
            "answer_d": q.get('answer_d'),
            "correct_answer": q.get('correct_answer'),
            "selected_answer": qa.get(q.get('question_id')),
            "is_correct": is_correct,
            "explanation": q.get('explanation', '')
        }
        questions.append(question_result)
    score = correct_answers / len(existing_qa.get('questions', [])) * 100
    qa_result = {
        "id": str(uuid.uuid4()),
        "qa_id": qa_id,  # Add qa_id field that was missing
        "user_id": user_id,
        "questions": questions,
        "score": score,
        "created_at": datetime.utcnow().isoformat()  # Fix datetime call
    }
    await create_qa_result(qa_result)
    return convert_qa_detail_to_dto(qa_result)

async def get_all_qa_results_service() -> list:
    qa_results = await find_all_qa_results()
    return qa_results

async def get_all_qa_results_by_user_service(user_id: str) -> list:
    qa_results = await find_all_qa_results_by_user(user_id)
    return [convert_to_qa_result_dto(result) for result in qa_results]

async def get_all_qa_results_by_user_and_qa_service(user_id: str, qa_id: str) -> list:
    qa_results = await find_all_qa_results_by_user_and_qa(user_id, qa_id)
    return [convert_to_qa_result_dto(result) for result in qa_results]

async def get_qa_result_by_id_service(qa_result_id: str) -> dict:
    qa_result = await find_qa_result_by_id(qa_result_id)
    return convert_qa_detail_to_dto(qa_result)

def convert_qa_detail_to_dto(qa: dict) -> dict:
    if not qa:
        return None
    return {
        "questions": qa.get("questions", []),
        "score": qa.get("score"),
        "created_at": qa.get("created_at")
    }
def convert_to_qa_result_dto(qa_result: dict) -> dict:
    if not qa_result:
        return None
    
    # Calculate additional fields from questions array
    questions = qa_result.get("questions", [])
    total_questions = len(questions)
    correct_answers = sum(1 for q in questions if q.get("is_correct", False))
    
    return {
        "id": qa_result.get("id"),
        "score": qa_result.get("score"),
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "created_at": qa_result.get("created_at"),
        "completed_at": qa_result.get("created_at"),  # Use created_at as completed_at for compatibility
        "time_taken": 0  # Default to 0 since we don't track time yet
    }