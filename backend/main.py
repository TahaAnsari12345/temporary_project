from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.post import Post
from routes.health import router as health_router
from routes.collect import router as collect_router
from routes.preprocess import router as preprocess_router
from routes.language import router as language_router
from utils.db import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="SocialSense API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(collect_router, prefix="/api")
app.include_router(preprocess_router, prefix="/api")
app.include_router(language_router, prefix="/api")