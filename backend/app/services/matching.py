"""Heuristic skill-overlap job matching (no external AI calls -- same
simulated approach as the rest of this app's "AI" features)."""
import re


def _split_skills(text: str) -> list[str]:
    if not text:
        return []
    parts = re.split(r"[,;\n••]+", text)
    cleaned = [p.strip(" -\t").lower() for p in parts]
    return [p for p in cleaned if p]


def compute_match(job_requirements: str, job_description: str, candidate_skills: str) -> dict:
    required = _split_skills(job_requirements) or _split_skills(job_description)
    have = _split_skills(candidate_skills)

    matching = []
    missing = []
    for req in required:
        hit = any(req in h or h in req for h in have)
        (matching if hit else missing).append(req)

    if required:
        score = round(len(matching) / len(required) * 100)
    else:
        # No structured requirements to compare against -- neutral default.
        score = 50

    if score >= 80:
        summary = "Strong match -- candidate's skill set closely aligns with this role's requirements."
    elif score >= 50:
        summary = "Moderate match -- candidate covers some key requirements but has notable gaps."
    else:
        summary = "Weak match -- candidate's listed skills don't align well with this role's requirements."

    return {
        "match_score": score,
        "matching_skills": [m.title() for m in matching],
        "missing_skills": [m.title() for m in missing],
        "summary": summary,
    }
