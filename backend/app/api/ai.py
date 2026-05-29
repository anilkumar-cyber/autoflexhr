from fastapi import APIRouter, HTTPException
from app.ai.ai_service import (
    generate_interview_analysis,
    generate_fraud_detection,
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)

@router.post("/interview")
async def interview_analysis(candidate: dict):
    try:
        result = await generate_interview_analysis(candidate)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fraud")
async def fraud_detection(candidate: dict):
    try:
        result = await generate_fraud_detection(candidate)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))