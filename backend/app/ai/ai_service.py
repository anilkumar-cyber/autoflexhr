"""AI Service Layer - Interview Assistant, Fraud Detection & Resume Parsing"""
import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
# Resume parsing uses Groq (OpenAI-compatible API) instead of OpenAI -- same
# key/model already relied on by the n8n careers-apply pipeline.
groq_client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")


async def parse_resume_text(resume_text: str) -> dict:
    """Extract structured candidate data from raw resume text using AI."""
    prompt = f"""Extract the following fields from this resume text. Return ONLY valid JSON, no markdown.

RESUME TEXT:
{resume_text[:4000]}

Also give an overall resume quality/completeness score from 1 to 100 (1 = very
weak/incomplete resume, 100 = excellent, well-rounded resume), based purely on
this resume alone, not against any specific job.

Return this exact JSON structure (use empty string if not found):
{{
  "name": "Full name of candidate",
  "email": "candidate@email.com",
  "phone": "+1 555 123 4567",
  "skills": "Python, React, SQL, ...",
  "education": "B.Tech in Computer Science from XYZ University",
  "experience": "3 years as Software Engineer at ABC Corp",
  "city": "City name",
  "ats_score": 75
}}"""

    try:
        response = await groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500,
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        # The model sometimes appends explanatory prose after the JSON object --
        # extract just the {...} block instead of assuming the whole string is JSON.
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace == -1 or last_brace == -1:
            raise ValueError("No JSON object found in model response")
        text = text[first_brace:last_brace + 1]
        parsed = json.loads(text)
        # The prompt asks for a 1-100 score, but the model sometimes ignores
        # that floor and returns 0 -- clamp it so the UI never shows 0/100.
        raw_score = parsed.get("ats_score")
        try:
            raw_score = float(raw_score)
        except (TypeError, ValueError):
            raw_score = 1
        parsed["ats_score"] = min(100, max(1, raw_score))
        return parsed
    except Exception:
        return {
            "name": "", "email": "", "phone": "",
            "skills": "", "education": "", "experience": "", "city": "",
            "ats_score": 0,
        }

async def generate_interview_analysis(candidate: dict) -> dict:
    """Generate comprehensive AI interview analysis for a candidate."""
    prompt = f"""You are an expert HR recruiter and talent acquisition specialist.
Analyze this candidate and provide a comprehensive recruitment assessment.

CANDIDATE PROFILE:
Name: {candidate.get('name')}
Job Title Applied: {candidate.get('job_title')}
ATS Score: {candidate.get('ats_score')}/100
Education: {candidate.get('education')}
Job History: {candidate.get('job_history')}
Skills: {candidate.get('skills')}
HR Evaluation: {candidate.get('hr_evaluation', 'N/A')}

Respond ONLY with a valid JSON object (no markdown, no backticks):
{{
  "summary": "2-3 sentence executive summary of the candidate",
  "overall_rating": "Excellent|Good|Average|Below Average",
  "hire_recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "confidence": 85,
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "technical_questions": [
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}}
  ],
  "hr_questions": [
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}},
    {{"q": "Question text?", "purpose": "What this tests"}}
  ],
  "communication_score": 78,
  "leadership_potential": "High|Medium|Low",
  "culture_fit": "Strong|Moderate|Weak",
  "salary_range": "$X,000 - $Y,000",
  "notice_period_estimate": "Immediate|2 weeks|1 month|2-3 months",
  "key_risks": ["risk 1", "risk 2"]
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    text = response.choices[0].message.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def generate_fraud_detection(candidate: dict) -> dict:
    """AI-powered resume fraud detection analysis."""
    prompt = f"""You are an expert resume fraud detection specialist with 15 years of experience.
Analyze this resume for authenticity, inconsistencies, and red flags.

RESUME DATA:
Name: {candidate.get('name')}
Job Title: {candidate.get('job_title')}
ATS Score: {candidate.get('ats_score')}/100
Education: {candidate.get('education')}
Job History: {candidate.get('job_history')}
Skills: {candidate.get('skills')}

Check for:
- Unrealistic experience claims
- Keyword stuffing patterns
- Timeline inconsistencies
- AI-generated content patterns
- Skill mismatch with experience
- Suspicious educational claims
- Inflated achievements

Respond ONLY with valid JSON (no markdown):
{{
  "fraud_risk_score": 15,
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 88,
  "is_authentic": true,
  "overall_verdict": "Likely Authentic|Needs Verification|Suspicious|Fraudulent",
  "suspicious_indicators": [
    {{"indicator": "description", "severity": "low|medium|high", "details": "explanation"}}
  ],
  "authentic_signals": ["signal 1", "signal 2"],
  "timeline_analysis": "Analysis of career timeline consistency",
  "skill_authenticity": "Analysis of skill claims vs experience",
  "ai_generated_probability": 12,
  "recommendation": "Proceed|Verify Claims|Flag for Review|Reject",
  "verification_steps": ["step 1", "step 2", "step 3"]
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1200,
    )
    text = response.choices[0].message.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
