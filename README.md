# VI Planer

Единый портфель **проектов и продуктов** со сквозным приоритетом (WSJF), очередями команд, Gantt и планированием ёмкости.

## Ссылка на приложение

**https://bolshakovin.github.io/vi_planer/**

> Для **общих данных** у всех пользователей по ссылке нужен сервер с базой — см. [Render](#render-общая-база-для-команды) ниже. GitHub Pages без Supabase хранит данные отдельно в каждом браузере.

## Локальный запуск

```bash
npm install
npm run dev
```

Продакшен (сборка + сервер с общим хранилищем):

```bash
npm run build
npm start
# http://localhost:3000
```

## Render — общая база для команды

Один URL, одни данные для всех:

1. [Deploy to Render](https://render.com/deploy?repo=https://github.com/BolshakovIN/vi_planer)
2. После деплоя Render даст ссылку вида `https://vi-planer-xxxx.onrender.com` — её можно давать коллегам.

Данные сохраняются на диске Render (`/data/vi-planer-state.json`).

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

См. [`.env.example`](.env.example).
