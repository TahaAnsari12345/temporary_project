from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from models.post import Post
from models.user import User
from routes.auth import router as auth_router
from routes.analyses import router as analyses_router
from routes.trends import router as trends_router
from routes.health import router as health_router
from routes.collect import router as collect_router
from routes.preprocess import router as preprocess_router
from routes.language import router as language_router
from routes.emotion import router as emotion_router
from routes.analyze import router as analyze_router
from utils.db import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    post_columns = {column["name"] for column in inspect(engine).get_columns("posts")}
    if "user_id" not in post_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE posts ADD COLUMN user_id VARCHAR"))
    with engine.begin() as connection:
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_posts_user_id ON posts (user_id)"))
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
app.include_router(emotion_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(analyses_router, prefix="/api")
app.include_router(trends_router, prefix="/api")