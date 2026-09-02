# Бесплатная общая база: Supabase + GitHub Pages

**0 ₽** — без VPS, без Railway, без Selectel.

- **Хостинг:** GitHub Pages (бесплатно)
- **База:** [Supabase](https://supabase.com) free tier (500 MB, достаточно для портфеля)
- **URL:** тот же https://bolshakovin.github.io/vi_planer/
- **Данные:** одни для всех, кто открывает ссылку

Код уже в проекте (`src/storage.ts`, `supabase/schema.sql`).

## 1. Supabase (5 минут)

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) (бесплатный план).
2. **New project** → имя, пароль БД, регион (ближайший доступный).
3. **SQL Editor** → New query → вставьте весь файл [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
4. **Project Settings** → **API**:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key → `eyJ...`

> Схема открывает read/write для всех с anon-ключом — подходит для внутренней команды. Не храните секреты в портфеле.

## 2. Сборка и деплой на Pages

На своём компьютере (ключи **не коммитьте** в git):

```bash
cd vi_planer
npm install

export VITE_SUPABASE_URL='https://xxxx.supabase.co'
export VITE_SUPABASE_ANON_KEY='eyJ...'

npm run deploy:pages:shared
git add docs
git commit -m "Enable shared Supabase storage on GitHub Pages"
git push origin master
```

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
