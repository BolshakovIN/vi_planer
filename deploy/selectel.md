# Деплой VI Planer на Selectel

Общая база PostgreSQL для всей команды на облачном сервере Selectel.

GitHub Pages (**https://bolshakovin.github.io/vi_planer/**) не затрагивается — там личная копия в браузере.

## 1. Создать облачный сервер

1. [my.selectel.ru](https://my.selectel.ru) → **Продукты** → **Облачные серверы** → **Создать сервер**
2. **Источник:** Ubuntu 24.04 LTS 64-bit
3. **Конфигурация:** минимум **2 vCPU / 2 GB RAM / 20 GB диск** (app + PostgreSQL)
4. **Сеть:** публичный IPv4
5. **SSH-ключ:** добавьте свой публичный ключ
6. **User data** (шаг «Дополнительно»): вставьте содержимое [`selectel-cloud-init.yaml`](selectel-cloud-init.yaml) — установит Docker и откроет порты
7. Создайте сервер, запишите **публичный IP**

### Группа безопасности (если используете)

Разрешите входящий TCP:

| Порт | Назначение |
|------|------------|
| 22 | SSH |
| 8787 | VI Planer (HTTP) |
| 80, 443 | HTTPS (если поставите nginx/Caddy) |

## 2. Подключиться по SSH

```bash
ssh ubuntu@ВАШ_IP
# или root@ВАШ_IP — зависит от образа
```

Проверка Docker:

```bash
docker --version
docker compose version
```

Если Docker не установился через cloud-init:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# перелогиньтесь
```

## 3. Запустить приложение

```bash
git clone https://github.com/BolshakovIN/vi_planer.git
cd vi_planer

# Обязательно смените пароль!
export POSTGRES_PASSWORD='длинный-случайный-пароль'
export APP_PORT=8787

docker compose up -d --build
```

Проверка на сервере:

```bash
curl -s http://127.0.0.1:8787/api/health
# {"ok":true,"storage":"postgres"}
```

В браузере: **http://ВАШ_IP:8787**

При первом запросе в пустую базу загрузится seed из `src/seed.ts`.

## 4. HTTPS с доменом (опционально)

Если есть домен, укажите A-запись на IP сервера.

### Caddy (проще всего)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

sudo tee /etc/caddy/Caddyfile <<'EOF'
vi-planer.ваш-домен.ru {
    reverse_proxy 127.0.0.1:8787
}
EOF

sudo systemctl reload caddy
```

В `docker-compose.yml` можно оставить `APP_PORT=8787` только на localhost — снаружи будет 443 через Caddy.

## 5. Обновление

```bash
cd ~/vi_planer
git pull
docker compose up -d --build
```

## 6. Бэкап базы

```bash
cd ~/vi_planer
docker compose exec db pg_dump -U viplaner viplaner > backup-$(date +%F).sql
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `POSTGRES_PASSWORD` | — | пароль БД (обязательно задать) |
| `APP_PORT` | `8787` | внешний порт приложения |

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Сайт не открывается снаружи | Проверьте группу безопасности Selectel и `ufw status` |
| `storage: file` вместо postgres | Не задан `DATABASE_URL` — используйте `docker compose`, не одиночный `docker run` |
| Контейнер падает | `docker compose logs -f app` |
