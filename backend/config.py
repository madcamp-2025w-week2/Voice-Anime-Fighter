from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Azure Speech
    azure_speech_key: str = ""
    azure_speech_region: str = "koreacentral"
    
    # Database
    database_url: str = "postgresql+asyncpg://vaf_user:vaf_password_2026@127.0.0.1:5435/voice_anime_fighter"

    def model_post_init(self, __context):
        # Force port 5435 if it mistakenly defaulted to 5432 for localhost/127.0.0.1
        if ("@localhost:5432" in self.database_url or "@127.0.0.1:5432" in self.database_url):
            print(f"⚠️ Correcting Database Port from 5432 to 5435 (Docker Mapping)")
            self.database_url = self.database_url.replace(":5432", ":5435")
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str = "dev_secret_key_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
