FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Poetry 설치
RUN pip install poetry

# 의존성 파일 복사
COPY pyproject.toml ./

# 의존성 설치
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 애플리케이션 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
