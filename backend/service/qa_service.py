# service/qa_service.py
# Business logic layer cho Question operations
# Tách biệt logic nghiệp vụ khỏi controller (routes)

from typing import List, Optional
import uuid
from backend.repository.qa_repo import create, delete, find_all, find_by_id, get_qa_by_article_id, update

    
async def get_all_qa() -> List[dict]:
    raw_qas = await find_all()
    # Convert each QA to DTO format to include total_questions
    return [convert_qa_detail_to_dto(qa) for qa in raw_qas]

async def get_qa_by_id(question_id: str) -> Optional[dict]:
    qa = await find_by_id(question_id)
    return convert_qa_detail_to_dto(qa) if qa else None

async def create_question(question_data: dict) -> dict:
    # Generate unique IDs for questions
    for q in question_data.get("questions", []):
        q["question_id"] = str(uuid.uuid4())
    
    # Add timestamps
    from datetime import datetime
    current_time = datetime.utcnow().isoformat()
    question_data["created_at"] = current_time
    question_data["updated_at"] = current_time
    
    return await create(question_data)

async def update_qa(question_id: str, update_data: dict) -> Optional[dict]:
    # Lấy dữ liệu gốc từ database (không qua DTO)
    existing_qa = await find_by_id(question_id)
    if not existing_qa:
        return None
    
    # Handle update logic
    for key, value in update_data.items():
        
        if key == "questions" and isinstance(value, list):
            # Special handling for questions array - merge individual questions
            existing_questions = existing_qa.get("questions", [])
            
            # Create a map of existing questions by question_id for quick lookup
            existing_questions_map = {
                q.get("question_id"): q for q in existing_questions
            }
            
            # Update or add questions
            updated_questions = []
            for new_question in value:
                question_id_key = new_question.get("question_id")
                
                if question_id_key and question_id_key in existing_questions_map:
                    # Question exists - merge fields
                    existing_question = existing_questions_map[question_id_key].copy()
                    
                    # Update only non-null and non-empty fields
                    for field, field_value in new_question.items():
                        if field_value is not None and field_value != '':
                            existing_question[field] = field_value
                    
                    updated_questions.append(existing_question)
                else:
                    # New question - add directly
                    updated_questions.append(new_question)
            
            existing_qa[key] = updated_questions
            
        elif value is not None and value != '':
            # Regular field update
            existing_qa[key] = value

    # Update timestamp
    from datetime import datetime
    existing_qa["updated_at"] = datetime.utcnow().isoformat()

    updated_qa = await update(question_id, existing_qa)
    
    # Return DTO format for response
    return convert_qa_detail_to_dto(updated_qa) if updated_qa else None

async def delete_qa(question_id: str) -> bool:
    # Kiểm tra existence bằng cách query trực tiếp
    existing_qa = await find_by_id(question_id)
    if not existing_qa:
        return False

    return await delete(question_id)

async def get_qa_by_article_id_service(article_id: str) -> List[dict]:
    qas = await get_qa_by_article_id(article_id)
    # Always return a list, empty if no QAs found
    return [convert_qa_detail_to_dto(qa) for qa in qas] if qas else []

# async def grade_qa(question_id: str, qa: dict) -> Optional[dict]:
#     # Lấy dữ liệu gốc từ database (không qua DTO)
#     existing_qa = await find_by_id(question_id)
#     if not existing_qa:
#         return None
    
#     correct_answers = 0
#     questions=[]
#     for q in existing_qa.get('questions', []):
#         if q.get('correct_answer') == qa.get(q.get('question_id')):
#             correct_answers += 1
#             is_correct = True
#         else:
#             is_correct = False
#         question_result = {
#             "question_id": q.get('question_id'),
#             "question": q.get('question'),
#             "answer_a": q.get('answer_a'),
#             "answer_b": q.get('answer_b'),
#             "answer_c": q.get('answer_c'),
#             "answer_d": q.get('answer_d'),
#             "correct_answer": q.get('correct_answer'),
#             "selected_answer": qa.get(q.get('question_id')),
#             "is_correct": is_correct,
#             "explanation": q.get('explanation', '')
#         }
#         questions.append(question_result)
#     score = correct_answers / len(existing_qa.get('questions', [])) * 100

#     return {
#         "score": score,
#         "questions": questions
#     }

def convert_qa_detail_to_dto(qa: dict) -> dict:
    questions = []
    for q in qa.get("questions", []):
        # Ensure question_id exists, generate one if missing
        question_id = q.get("question_id")
        if not question_id:
            question_id = str(uuid.uuid4())
            # Update the original question with the new ID
            q["question_id"] = question_id
            
        questions.append({
            "question_id": question_id,
            "question": q.get("question"),
            "answer_a": q.get("answer_a"),  # Sửa từ question_a thành answer_a
            "answer_b": q.get("answer_b"),  # Sửa từ question_b thành answer_b
            "answer_c": q.get("answer_c"),  # Sửa từ question_c thành answer_c
            "answer_d": q.get("answer_d")   # Sửa từ question_d thành answer_d
            # Không bao gồm correct_answer để ẩn đáp án đúng
        })
    return {
        "id": qa.get("id"),
        "article_id": qa.get("article_id"),  # Include article_id for filtering
        "total_questions": len(questions),
        "questions": questions,
        "created_at": qa.get("created_at"),
        "updated_at": qa.get("updated_at")
    }
    
    

