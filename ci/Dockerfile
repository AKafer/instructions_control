# Stage 1: Build
FROM python:3.10-slim as build
LABEL authors="s-storozhuk"

# Устанавливаем необходимые системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    openssl \
    libssl-dev \
    libpq-dev \
    gcc \
    make \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Poetry
RUN pip install --no-cache-dir poetry==1.4.0

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY pyproject.toml poetry.lock /app/

# Устанавливаем зависимости (без dev-зависимостей)
RUN poetry config virtualenvs.create false && poetry install --only main

# Stage 2: Final
FROM python:3.10-slim

# Устанавливаем необходимые системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Копируем приложение из build-этапа
COPY --from=build /app /app

# Создаём папку для логов
RUN mkdir -p /app/src/logs && touch /app/src/logs/app.log

# Настраиваем переменные окружения
ENV PYTHONPATH="/app/src"
ENV PYTHONUNBUFFERED=TRUE

# Устанавливаем рабочую директорию
WORKDIR /app/src

# Команда по умолчанию
CMD ["python", "main.py"]
