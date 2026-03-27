from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    port: int = 5000

    # Database
    database_url: str = "postgresql+asyncpg://hn_user:hn_password@localhost:5432/hn_reader"

    # AI Providers
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-preview-05-20"
    groq_api_key: str = ""

    # HN API
    firebase_base_url: str = "https://hacker-news.firebaseio.com/v0"
    algolia_base_url: str = "https://hn.algolia.com/api/v1"
    cache_ttl_seconds: int = 180
    default_page_size: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
