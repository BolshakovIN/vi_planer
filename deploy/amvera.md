# Деплой на Amvera (РФ)

Один URL для всей команды, данные в постоянном хранилище `/data` (файл) или PostgreSQL.

GitHub Pages (**https://bolshakovin.github.io/vi_planer/**) не трогаем — там по-прежнему личная копия в браузере.

## Вариант A — файл на диске (проще всего)

Подходит для старта: не нужна отдельная база, Amvera монтирует `/data`.

1. Зарегистрируйтесь на [amvera.ru](https://amvera.ru).
2. **Создать приложение** → **Из GitHub** → репозиторий `BolshakovIN/vi_planer`, ветка `master`.
3. Amvera найдёт `amvera.yaml` и `Dockerfile` в корне.
4. В разделе **Переменные окружения** добавьте:

   | Переменная | Значение |
   |------------|----------|
   | `NODE_ENV` | `production` |
   | `HOST` | `0.0.0.0` |
   | `DATA_DIR` | `/data` |

5. **Сеть** → включите публичный домен (вида `https://ваш-проект.amvera.io`).
6. Дождитесь сборки. Проверка: `GET https://ваш-домен/api/health` → `{ "ok": true, "storage": "file" }`.

При первом открытии сайта подтянется seed из `src/seed.ts`.

## Вариант B — PostgreSQL

Если в Amvera подключён managed PostgreSQL (или внешний хост):

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | строка подключения Postgres |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |

Без `DATA_DIR` — данные только в Postgres.

## Обновление

Push в `master` → Amvera пересобирает автоматически (если включён автодеплой из GitHub).

## Локальная проверка Docker-образа

```bash
docker build -t vi-planer .
docker run --rm -p 8787:3000 -e DATA_DIR=/data -v vi-planer-data:/data vi-planer
# http://127.0.0.1:8787/api/health
```
