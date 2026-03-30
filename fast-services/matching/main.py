from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.match import router

app = FastAPI(title="V-Link Matching Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
