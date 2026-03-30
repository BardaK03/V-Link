from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class MatchRequest(BaseModel):
    volunteer_skills: list[int]
    role_skills: list[int]


class MatchResponse(BaseModel):
    score: int


@router.post("/match", response_model=MatchResponse)
def compute_match(payload: MatchRequest) -> MatchResponse:
    role_set = set(payload.role_skills)

    # Rol fără cerințe → oricine se califică
    if not role_set:
        return MatchResponse(score=100)

    volunteer_set = set(payload.volunteer_skills)
    intersection = volunteer_set & role_set
    union = volunteer_set | role_set

    score = int(len(intersection) / len(union) * 100)
    return MatchResponse(score=score)
