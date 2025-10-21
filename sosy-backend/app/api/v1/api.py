from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, wp_users, events, personality_test

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(wp_users.router, prefix="/wp-users", tags=["wordpress-users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(personality_test.router, prefix="/personality-test", tags=["personality-test"])