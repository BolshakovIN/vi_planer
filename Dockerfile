# Multi-stage: build Vite frontend with Node, run FastAPI (Python) as primary server.
# Node Express remains available locally via `npm start` / `npm run dev`.

FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM python:3.12-slim-bookworm
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server_py ./server_py
COPY --from=frontend /app/dist ./dist

EXPOSE 3000

# Respect PORT (Railway / Amvera); default 3000 matches compose mapping.
CMD ["sh", "-c", "uvicorn server_py.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-3000}"]
