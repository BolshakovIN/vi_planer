# Бесплатная общая база: Supabase + GitHub Pages

**0 ₽** — без VPS, без Railway, без Selectel.

- **Хостинг:** GitHub Pages (бесплатно)
- **База:** [Supabase](https://supabase.com) free tier (500 MB, достаточно для портфеля)
- **URL:** тот же https://bolshakovin.github.io/vi_planer/
- **Данные:** одни для всех, кто открывает ссылку

Код уже в проекте (`src/storage.ts`, `supabase/schema.sql`).

## 1. Supabase (5 минут)

Проект **уже создан**: `vi_planer` (`hmqajjxjnxbrgrvfkegv`).
SQL-схема уже применена — **повторно запускать не нужно** (скрипт идемпотентный: `IF NOT EXISTS`).

Если с нуля на новом проекте:
1. [supabase.com](https://supabase.com) → **New project**.
2. **SQL Editor** → вставьте [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.

**Нужен только anon key:**
1. Откройте проект → **Project Settings** → **API**.
2. Скопируйте **anon public** (`eyJ...`).
3. URL уже известен: `https://hmqajjxjnxbrgrvfkegv.supabase.co`.

> Схема открывает read/write для всех с anon-ключом — для внутренней команды. Не храните секреты в портфеле.

## 2. Сборка и деплой на Pages

На своём компьютере (ключи **не коммитьте** в git).

Проект уже создан: `hmqajjxjnxbrgrvfkegv` → URL `https://hmqajjxjnxbrgrvfkegv.supabase.co`.

```bash
cd /Users/ivanbolsakov/vi_planer
npm install

# Вариант A: .env.local (Vite подхватит сам)
cp .env.local.example .env.local
# Откройте .env.local и вставьте anon public key из Supabase → Project Settings → API

# Вариант B: export в терминале
export VITE_SUPABASE_URL='https://hmqajjxjnxbrgrvfkegv.supabase.co'
export VITE_SUPABASE_ANON_KEY='eyJ...'   # anon public из Settings → API

npm run deploy:pages:shared
git add docs
git commit -m "Enable shared Supabase storage on GitHub Pages"
git push origin master
```

`deploy:pages:shared` **не** ставит `VITE_LOCAL_STORAGE_ONLY` — собирается с Supabase.
`deploy:pages` — только localStorage (личный режим).

Через 1–2 минуты откройте https://bolshakovin.github.io/vi_planer/ — внизу/в статусе должно быть **«Сохранено в облаке»**.

## 3. Проверка

1. Откройте сайт в двух браузерах (или инкогнито).
2. Измените что-то в одном → обновите второй — данные совпадают.

## Вернуть личный режим (localStorage)

```bash
npm run deploy:pages
git add docs && git commit -m "Revert to local-only Pages" && git push
```

## Если Supabase не открывается в браузере

Попробуйте VPN при регистрации один раз, или попросите коллегу создать проект и передать URL + anon key.

## Лимиты free tier Supabase

| | |
|--|--|
| База | 500 MB |
| Запросы | ~500k/месяц (для вашего объёма более чем enough) |
| Пауза проекта | после 7 дней без активности (просыпается за секунды) |
