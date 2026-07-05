from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://hattrick:hattrick@localhost:5432/hattrick2shopping"
    ml_model_path: str = "models/"
    write_api_key: str = ""
    rate_limit_per_minute: str = "15/minute"

    class Config:
        env_file = ".env"


settings = Settings()
