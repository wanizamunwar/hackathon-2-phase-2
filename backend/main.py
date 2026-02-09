import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from db import create_db_and_tables
from routes.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Todo API", version="1.0.0", lifespan=lifespan)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://hackathon-2-phase-2-alpha.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
