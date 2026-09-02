# VI Planer

Единый портфель **проектов и продуктов** со сквозным приоритетом (WSJF), очередями команд, Gantt и планированием ёмкости.

## Ссылка на приложение

**https://bolshakovin.github.io/vi_planer/**

> **Бесплатно и общая база:** [Supabase + GitHub Pages](#бесплатно--supabase--github-pages) (рекомендуется). Платный VPS (Selectel и т.д.) — только если нужен свой сервер.

## Режимы

| Режим | Стоимость | URL | Данные |
|---|---|---|---|
| **Supabase + Pages** | **0 ₽** | [bolshakovin.github.io/vi_planer/](https://bolshakovin.github.io/vi_planer/) | Общие для всей команды |
| **Pages локально** | 0 ₽ | тот же URL | Личная копия в браузере (`npm run deploy:pages`) |
| **VPS / Amvera** | платно | свой домен | Свой сервер + Postgres |

## Бесплатно — Supabase + GitHub Pages

1. Проект на [supabase.com](https://supabase.com) (free)
2. SQL Editor → [`supabase/schema.sql`](supabase/schema.sql)
3. Сборка с ключами и деплой:

```bash
export VITE_SUPABASE_URL='https://xxxx.supabase.co'
export VITE_SUPABASE_ANON_KEY='eyJ...'
npm run deploy:pages:shared
git add docs && git commit -m "Shared cloud storage" && git push
```

Подробно: [`deploy/supabase-free.md`](deploy/supabase-free.md)

Сборка `deploy:pages` (без Supabase) включает `VITE_LOCAL_STORAGE_ONLY` — только личные данные в браузере.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте **http://127.0.0.1:5173** — фронтенд. API проксируется на **http://127.0.0.1:8787**.

Продакшен (сборка + сервер с общим хранилищем):

```bash
npm run build
npm start
# http://127.0.0.1:8787
```

Порт и хост можно переопределить: `PORT=9000 HOST=0.0.0.0 npm start`.

Без `DATABASE_URL` сервер хранит состояние в файле (`DATA_DIR`). С PostgreSQL — в общей базе.

## Amvera (РФ)

Платформа [amvera.ru](https://amvera.ru) — деплой из GitHub, постоянный диск `/data`, без привязки к US-регионам.

1. **Создать приложение** → **Из GitHub** → `BolshakovIN/vi_planer`, ветка `master`
2. В корне репозитория уже есть `amvera.yaml` и `Dockerfile`
3. Переменные окружения:
   - `NODE_ENV=production`
   - `HOST=0.0.0.0`
   - `DATA_DIR=/data`
4. Включите публичный домен → проверьте `GET /api/health`

Подробнее: [`deploy/amvera.md`](deploy/amvera.md)

## Selectel (рекомендуется для РФ)

Облачный сервер + Docker Compose + PostgreSQL.

1. [my.selectel.ru](https://my.selectel.ru) → облачный сервер Ubuntu 24.04 (2 GB RAM+)
2. User data: [`deploy/selectel-cloud-init.yaml`](deploy/selectel-cloud-init.yaml)
3. На сервере:

```bash
git clone https://github.com/BolshakovIN/vi_planer.git && cd vi_planer
export POSTGRES_PASSWORD='смените-пароль'
docker compose up -d --build
```

→ `http://IP:8787`. Пошагово: [`deploy/selectel.md`](deploy/selectel.md)

## VPS + Docker Compose

На любом VPS (Timeweb, Hetzner…): [`deploy/vps.md`](deploy/vps.md)

## Railway — общая база для команды

Один URL, одни данные для всех. PostgreSQL на Railway, фронтенд и API на одном сервисе.

### Быстрый деплой

1. Зарегистрируйтесь на [railway.com](https://railway.com).
2. **New Project** → **Deploy from GitHub repo** → выберите `BolshakovIN/vi_planer`, ветка `master`.
3. В проекте: **+ New** → **Database** → **PostgreSQL**.
4. Откройте web-сервис → **Variables** → **Add Reference** → выберите Postgres → `DATABASE_URL`.
5. Добавьте переменные (если не заданы автоматически):
   - `NODE_ENV=production`
   - `HOST=0.0.0.0`
6. **Settings** → **Networking** → **Generate Domain** — получите URL вида `https://vi-planer-production.up.railway.app`.
7. Дождитесь деплоя. Health check: `GET /api/health` → `{ "ok": true, "storage": "postgres" }`.

При первом запросе к API в пустую базу автоматически загружается seed-состояние из `src/seed.ts`.

### Локальная разработка с PostgreSQL

```bash
# Поднимите Postgres (Docker) и задайте DATABASE_URL
docker run --name vi-planer-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=viplaner -p 5432:5432 -d postgres:16
export DATABASE_URL=postgres://postgres:dev@127.0.0.1:5432/viplaner
export PGSSLMODE=disable

npm run dev
```

### GitHub Pages + Railway API (опционально)

Статика на Pages, данные на Railway:

```bash
VITE_BASE_PATH=/vi_planer/ \
VITE_API_URL=https://your-app.up.railway.app \
npm run build:pages
npm run deploy:pages
```

На Railway добавьте `CORS_ORIGIN=https://bolshakovin.github.io`.

## Render — общая база для команды

Один URL, одни данные для всех.

1. Зарегистрируйтесь на [render.com](https://render.com) (без входа кнопка деплоя не откроется).
2. Нажмите **Deploy to Render** (ветка `master`):

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/BolshakovIN/vi_planer/tree/master)

   Прямая ссылка: https://render.com/deploy?repo=https://github.com/BolshakovIN/vi_planer/tree/master

3. Подключите GitHub, подтвердите Blueprint — Render создаст сервис.
4. После деплоя получите URL вида `https://vi-planer.onrender.com`.

> На бесплатном плане Render данные сохраняются между перезапусками, но могут сброситься при полном redeploy. Для надёжного хранения подключите Supabase (см. ниже) или платный диск Render.

### Если кнопка не открывается

Деплой вручную:

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Подключите репозиторий `BolshakovIN/vi_planer`, ветка `master`
3. Render подхватит `render.yaml` из корня

## GitHub Pages — только фронтенд

Обновить опубликованную версию:

```bash
npm run deploy:pages
git add docs package.json && git commit -m "Update GitHub Pages site" && git push
```

В **Settings → Pages** репозитория источник: **Deploy from branch → master → /docs**.

### Общие данные на GitHub Pages (Supabase)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните [`supabase/schema.sql`](supabase/schema.sql) в SQL Editor
3. Соберите с ключами:

```bash
VITE_BASE_PATH=/vi_planer/ \
VITE_SUPABASE_URL=https://xxx.supabase.co \
VITE_SUPABASE_ANON_KEY=eyJ... \
npm run build
npm run deploy:pages
```

## Что внутри

| Вкладка | Смысл |
|---|---|
| **Портфель** | Проекты + продукты, WSJF, ручной приоритет |
| **Очереди команд** | Сквозной приоритет внутри каждой команды |
| **Очереди (тест)** | Приоритет + «может взять с…» |
| **Сроки / Gantt** | ETA по weekly capacity |
| **Команды** | Ёмкость и названия команд |

## Переменные окружения

| Переменная | Где | Назначение |
|---|---|---|
| `DATABASE_URL` | Server | PostgreSQL (Railway). Без неё — файл в `DATA_DIR` |
| `HOST` | Server | `0.0.0.0` для Railway/Render |
| `PORT` | Server | Порт (Railway задаёт автоматически) |
| `CORS_ORIGIN` | Server | Origin для cross-origin API (GitHub Pages) |
| `VITE_API_URL` | Build | URL Railway-бэкенда для GitHub Pages |
| `VITE_SUPABASE_*` | Build | Supabase вместо собственного API |
| `VITE_BASE_PATH` | Build | Базовый путь для GitHub Pages |

См. [`.env.example`](.env.example).
