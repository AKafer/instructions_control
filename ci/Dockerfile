FROM python:3.10.2-bullseye
LABEL authors="s-storozhuk"

RUN apt-get update && apt-get upgrade -y && \
  apt-get -y install \
    pip \
    bash \
    expect \
    curl \
    git \
    htop \
    iputils-ping \
    python3-aiofiles \
    vim \
    openssl \
    libssl-dev \
  && apt-get clean

RUN mkdir /app

RUN pip install --no-cache poetry==1.4.0

COPY pyproject.toml poetry.lock /app/
COPY src/ /app/src

ENV PYTHONPATH "${PYTHONPATH}:/app/src"
ENV PYTHONUNBUFFERED=TRUE

RUN cd /app && poetry config virtualenvs.create false && poetry install

WORKDIR /app/src
