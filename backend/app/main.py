from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

app = FastAPI(title="AutoFlexHR AI Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────

class InterviewAnalysisRequest(BaseModel):
    name: str
    job_title: str
    education: str
    job_history: str
    skills: str
    ats_score: int
    hr_evaluation: Optional[str] = ""


class FraudDetectionRequest(BaseModel):
    name: str
    job_title: str
    education: str
    job_history: str
    skills: str
    ats_score: int


# ─────────────────────────────────────────────
# AI ANALYSIS FUNCTIONS (Simulated)
# ─────────────────────────────────────────────

def generate_interview_analysis(req: InterviewAnalysisRequest) -> dict:
    """Generate interview analysis for a candidate"""
    
    skills_list = [s.strip() for s in req.skills.split(',') if s.strip()]
    
    # Simulated AI analysis based on candidate data
    analysis = {
        "candidate_summary": f"{req.name} is a {req.job_title} with {req.education} education background. They have {req.job_history} experience and possess skills in: {', '.join(skills_list[:5])}. ATS Score: {req.ats_score}/100.",
        
        "strengths": [
            "Strong technical foundation" if req.ats_score >= 80 else "Adequate technical skills",
            "Relevant industry experience" if req.job_history else "Entry-level candidate",
            "Multiple skill areas" if len(skills_list) > 3 else "Focused skill set",
            "Good educational background" if req.education else "Practical experience",
            "High ATS match" if req.ats_score >= 75 else "Moderate ATS match",
        ],
        
        "weaknesses": [
            "Limited advanced certifications" if req.ats_score < 85 else "None identified",
            "Could expand skill diversity" if len(skills_list) <= 3 else "Well-rounded skill set",
            "Experience gaps" if not req.job_history else "Continuous employment",
            "Needs domain specialization" if req.ats_score < 70 else "Well-specialized",
        ],
        
        "technical_interview_questions": [
            f"Tell us about your experience with {skills_list[0] if skills_list else 'your primary technology'}?",
            f"Describe a challenging project you worked on as a {req.job_title}?",
            "How do you approach problem-solving in your technical work?",
            "What's your experience with system design and architecture?",
            "How do you stay updated with technology trends?",
            "Walk us through your most complex technical achievement?",
            "How do you handle technical debt and code quality?",
            "Describe your experience with team collaboration on technical projects?",
        ],
        
        "hr_interview_questions": [
            "Tell us about your career journey and what brought you to this role?",
            "Where do you see yourself in 5 years professionally?",
            "Describe a time when you overcame a workplace challenge?",
            "How do you handle feedback and continuous improvement?",
            "What attracted you to our company and this specific role?",
            "Tell us about a time you worked in a cross-functional team?",
            "How do you prioritize and manage multiple projects?",
            "What's your approach to learning new technologies?",
        ],
        
        "communication_analysis": "The candidate demonstrates clear communication through their profile. They articulate their experiences well and have maintained consistent professional development.",
        
        "leadership_analysis": f"Based on {'substantial' if req.ats_score >= 80 else 'developing'} experience, the candidate shows potential for leadership roles. They should focus on mentoring and strategic thinking opportunities.",
        
        "hiring_recommendation": {
            "recommendation": "RECOMMENDED FOR INTERVIEW" if req.ats_score >= 70 else "CONSIDER FOR INTERVIEW",
            "confidence": f"{min(req.ats_score + 10, 98)}%",
            "reasoning": f"Strong ATS match ({req.ats_score}/100) with relevant experience and skills. Candidate aligns well with role requirements.",
            "next_steps": "Schedule technical interview" if req.ats_score >= 75 else "Schedule initial screening",
        },
    }
    
    return analysis


def generate_fraud_detection(req: FraudDetectionRequest) -> dict:
    """Detect potential fraudulent resume elements"""
    
    skills_list = [s.strip() for s in req.skills.split(',') if s.strip()]
    
    # Calculate fraud risk score based on various factors
    red_flags = []
    risk_score = 10  # Base low risk
    
    # Check for inconsistencies
    if not req.job_history and req.ats_score > 75:
        red_flags.append("No job history but high ATS score - possible inconsistency")
        risk_score += 15
    
    if not req.education:
        red_flags.append("Missing education information")
        risk_score += 5
    
    if len(skills_list) > 15:
        red_flags.append("Excessive number of skills listed - possible keyword stuffing")
        risk_score += 20
    
    if req.ats_score > 95:
        red_flags.append("Very high ATS score - verify against actual qualifications")
        risk_score += 10
    
    # Ensure risk score is between 0 and 100
    risk_score = min(max(risk_score, 0), 100)
    
    # Determine risk level
    if risk_score < 25:
        risk_level = "LOW"
        color = "green"
    elif risk_score < 50:
        risk_level = "MEDIUM"
        color = "orange"
    elif risk_score < 75:
        risk_level = "HIGH"
        color = "red"
    else:
        risk_level = "VERY HIGH"
        color = "dark_red"
    
    fraud_analysis = {
        "fraud_risk_score": risk_score,
        "risk_level": risk_level,
        "risk_color": color,
        "confidence": min(90 + (100 - risk_score) // 10, 99),
        
        "findings": [
            {
                "category": "Timeline Consistency",
                "status": "verified" if req.job_history else "unclear",
                "message": "Employment timeline appears consistent" if req.job_history else "No employment history provided",
                "severity": "none" if req.job_history else "medium",
            },
            {
                "category": "Education Verification",
                "status": "verified" if req.education else "not_provided",
                "message": "Educational background documented" if req.education else "Education information missing",
                "severity": "none" if req.education else "low",
            },
            {
                "category": "Skill Authenticity",
                "status": "verified" if len(skills_list) > 0 and len(skills_list) <= 15 else "suspicious",
                "message": f"Skills listed appear realistic with {len(skills_list)} entries" if len(skills_list) <= 15 else "Excessive skills listed",
                "severity": "none" if len(skills_list) <= 15 else "medium",
            },
            {
                "category": "AI-Generated Content",
                "status": "clean",
                "message": "No obvious AI-generated content patterns detected",
                "severity": "none",
            },
            {
                "category": "ATS Score Alignment",
                "status": "aligned" if req.ats_score >= 50 else "low",
                "message": f"ATS score of {req.ats_score} appears aligned with provided information",
                "severity": "none",
            },
            {
                "category": "Keyword Distribution",
                "status": "normal" if len(skills_list) <= 10 else "suspicious",
                "message": "Keyword distribution appears natural" if len(skills_list) <= 10 else "Possible keyword stuffing detected",
                "severity": "none" if len(skills_list) <= 10 else "medium",
            },
        ],
        
        "suspicious_indicators": red_flags,
        
        "content_quality": {
            "grammar_quality": min(95 - risk_score // 5, 100),
            "coherence": min(94 - risk_score // 5, 100),
            "professional_language": min(92 - risk_score // 5, 100),
            "logical_flow": min(93 - risk_score // 5, 100),
        },
        
        "recommendation": {
            "status": "APPROVED" if risk_score < 30 else "REVIEW" if risk_score < 60 else "VERIFY",
            "message": "Resume appears authentic" if risk_score < 30 else "Minor inconsistencies detected - recommend clarification" if risk_score < 60 else "Significant concerns - recommend thorough verification",
            "next_action": "Proceed to interview" if risk_score < 30 else "Request clarification on specific items" if risk_score < 60 else "Conduct detailed background check",
        },
    }
    
    return fraud_analysis


# ─────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "AutoFlexHR AI Backend"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/ai/interview")
async def interview_analysis(req: InterviewAnalysisRequest):
    """Generate interview analysis for a candidate"""
    try:
        analysis = generate_interview_analysis(req)
        return {
            "success": True,
            "data": analysis,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/ai/fraud")
async def fraud_detection(req: FraudDetectionRequest):
    """Generate fraud detection analysis for a candidate"""
    try:
        analysis = generate_fraud_detection(req)
        return {
            "success": True,
            "data": analysis,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)