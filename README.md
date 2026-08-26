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

Откройте **http://127.0.0.1:5173** — фронтенд. API проксируется на **http://127.0.0.1:8787**.

Продакшен (сборка + сервер с общим хранилищем):

```bash
npm run build
npm start
# http://127.0.0.1:8787
```

Порт и хост можно переопределить: `PORT=9000 HOST=0.0.0.0 npm start`.

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

См. [`.env.example`](.env.example).
