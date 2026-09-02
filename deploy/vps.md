# Деплой на VPS (Docker Compose)

Подходит для Timeweb, Selectel, Hetzner и любого VPS с Docker.

## Требования

- Docker + Docker Compose v2
- Открытый порт (например 8787) или reverse proxy (nginx/Caddy)

## Быстрый старт

```bash
git clone https://github.com/BolshakovIN/vi_planer.git
cd vi_planer

# Задайте пароль БД (обязательно смените!)
export POSTGRES_PASSWORD='ваш-сложный-пароль'
export APP_PORT=8787

docker compose up -d --build
```

Проверка:

```bash
curl http://127.0.0.1:8787/api/health
# {"ok":true,"storage":"postgres"}
```

Откройте в браузере: `http://IP-вашего-VPS:8787`

## HTTPS (опционально)

Поставьте Caddy или nginx перед приложением:

```text
vi-planer.example.com  →  proxy_pass http://127.0.0.1:8787
```

## Обновление

```bash
cd vi_planer
git pull
docker compose up -d --build
```

## Только приложение без Compose

Если Postgres уже есть снаружи:

```bash
docker build -t vi-planer .
docker run -d --name vi-planer -p 8787:3000 \
  -e DATABASE_URL='postgres://user:pass@host:5432/viplaner' \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  vi-planer
```

## GitHub Pages

Личная копия на **https://bolshakovin.github.io/vi_planer/** работает независимо (`localStorage`).
