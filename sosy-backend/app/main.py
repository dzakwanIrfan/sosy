from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    openapi_url="/api/v1/openapi.json"
)

origins = [
    # "https://sosy.vercel.app",
    # "https://sosy.daylightapp.asia",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}