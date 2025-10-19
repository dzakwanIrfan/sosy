from typing import List, Union
from pydantic_settings import BaseSettings
from decouple import config

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = config("APP_NAME", default="SOSY Backend API")
    VERSION: str = config("VERSION", default="1.0.0")
    DEBUG: bool = config("DEBUG", default=True, cast=bool)
    
    # Local Database
    DB_HOST: str = config("DB_HOST")
    DB_PORT: int = config("DB_PORT", cast=int)
    DB_NAME: str = config("DB_NAME")
    DB_USER: str = config("DB_USER")
    DB_PASS: str = config("DB_PASS")
    
    # WordPress Database
    WP_DB_HOST: str = config("WP_DB_HOST")
    WP_DB_PORT: int = config("WP_DB_PORT", cast=int)
    WP_DB_NAME: str = config("WP_DB_NAME")
    WP_DB_USER: str = config("WP_DB_USER")
    WP_DB_PASS: str = config("WP_DB_PASS")
    
    # JWT
    SECRET_KEY: str = config("SECRET_KEY")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    
    # Database URLs
    @property
    def LOCAL_DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def WP_DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.WP_DB_USER}:{self.WP_DB_PASS}@{self.WP_DB_HOST}:{self.WP_DB_PORT}/{self.WP_DB_NAME}"

    class Config:
        env_file = ".env"

settings = Settings()