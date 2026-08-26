# VI Planer

Единый портфель **проектов и продуктов** со сквозным приоритетом (WSJF), очередями команд, Gantt и планированием ёмкости.

Данные сохраняются в **базе данных** — все, кто открывает приложение по ссылке, видят одно и то же состояние.

## Быстрый старт (локально)

```bash
npm install
npm run dev
```

Откроется Vite на `:5173`, API с SQLite — на `:3000`. Фронтенд проксирует `/api` на сервер.

Продакшен (сборка + сервер с SQLite):

```bash
npm run build
npm start
# http://localhost:3000
```

База лежит в `./data/vi-planer-state.json`.

## Публичная ссылка для команды

Есть два варианта деплоя — выберите один.

### Вариант A — один URL (сервер + SQLite), Render

1. Зарегистрируйтесь на [render.com](https://render.com) и подключите репозиторий GitHub.
2. New → **Blueprint** → укажите этот репозиторий (файл `render.yaml` уже в корне).
3. После деплоя получите URL вида `https://vi-planer.onrender.com` — его можно давать коллегам.

Данные хранятся на подключённом диске Render (`/data`), переживают перезапуски.

### Вариант B — GitHub Pages + Supabase (бесплатно)

1. Создайте проект на [supabase.com](https://supabase.com).
2. В **SQL Editor** выполните скрипт [`supabase/schema.sql`](supabase/schema.sql).
3. В GitHub репозитории → **Settings → Secrets and variables → Actions** добавьте:
   - `VITE_SUPABASE_URL` — Project URL из Supabase
   - `VITE_SUPABASE_ANON_KEY` — anon public key
4. В репозитории включите **GitHub Pages** (Source: GitHub Actions).
5. Запушьте в `master` — workflow соберёт и опубликует сайт.

Публичная ссылка: **https://bolshakovin.github.io/vi_planer/**

> Без Supabase-секретов GitHub Pages будет работать только с `localStorage` в каждом браузере отдельно.

## Что внутри

| Вкладка | Смысл |
|---|---|
| **Портфель** | Проекты + продукты, WSJF, ручной приоритет, drag-and-drop |
| **Очереди команд** | Сквозной приоритет внутри каждой команды |
| **Очереди (тест)** | Приоритет + «может взять с…» |
| **Сроки / Gantt** | ETA по weekly capacity, зависимости по приоритету |
| **Команды** | Ёмкость и названия команд |

Модель: **WSJF = (BV + TC + RO) / Job Size**. Ручной ранг `manualRank` — главный для сортировки и Gantt.

## Экспорт / импорт

Кнопки **Экспорт JSON** / **Импорт JSON** в шапке — резервное копирование и перенос снимка вручную.

## Google Apps Script (альтернатива)

В папке [`gas/`](gas/) — вариант для Google Workspace без отдельного сервера (данные в браузере, см. README в `gas/`).

## Переменные окружения

См. [`.env.example`](.env.example).

| Переменная | Назначение |
|---|---|
| `VITE_SUPABASE_URL` | URL проекта Supabase (для GitHub Pages) |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase |
| `VITE_BASE_PATH` | Base path Vite (`/vi_planer/` для GitHub Pages) |
| `PORT` | Порт сервера (по умолчанию 3000) |
| `DATA_DIR` | Каталог данных сервера (по умолчанию `./data`) |
