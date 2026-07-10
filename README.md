# Студия Престиж — сайт парикмахерской

Дипломный MVP веб-системы для парикмахерской: современный одностраничный landing page салона красоты с услугами, мастерами, контактами и формой онлайн-записи. Заявки сохраняются в SQLite через Prisma, поэтому проект можно расширить до панели администратора и расписания мастеров.

## Технологии

- Next.js App Router
- React
- TypeScript
- Prisma ORM
- SQLite
- `next/font/google`
- PM2
- Caddy / Nginx

## Архитектура

- `app/page.tsx` — главная landing page: hero, преимущества, услуги, мастера, о нас, онлайн-запись, контакты, footer.
- `app/booking/page.tsx` — отдельная пошаговая страница онлайн-записи с календарем, сменами мастеров, слотами времени и карточкой итогов.
- `components/SiteHeader.tsx` — адаптивный sticky header с мобильным меню.
- `components/AppointmentForm.tsx` — клиентская форма записи с отправкой в `/api/appointments`.
- `app/api/appointments/route.ts` — API для сохранения заявок.
- `app/api/availability/route.ts` — API для расчета свободных слотов мастера на выбранную дату.
- `lib/schedule.ts` — рабочее время, смены мастеров, расчет занятых и свободных слотов.
- `lib/validation-core.js` и `lib/validation.ts` — общий список услуг/мастеров и валидация данных формы.
- `prisma/schema.prisma` — модель `Appointment` для хранения заявок.
- `deploy/nginx/parih.svoiprox.pro.conf` — альтернативная конфигурация Nginx для домена.

## Локальный запуск

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

Сайт будет доступен по адресу `http://localhost:3000`.

Основные маршруты:

- `/` — главная страница.
- `/booking` — пошаговая онлайн-запись.
- `/api/availability?date=YYYY-MM-DD&master=Анна%20Волкова&duration=40` — свободные слоты.
- `/api/appointments` — создание заявки.

## Административная панель

- `/admin/login` — вход администратора.
- `/admin` — защищенная панель управления заявками.
- `/admin/logout` — выход из панели.

Переменные окружения:

```env
ADMIN_LOGIN=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
ADMIN_SESSION_SECRET=CHANGE_ME_RANDOM_SECRET
```

Возможности панели:

- статистика по заявкам за день, неделю и месяц;
- список заявок с фильтрами по имени, телефону, датам, мастеру, услуге и статусу;
- смена статусов `new`, `confirmed`, `cancelled`, `completed`;
- удаление заявок после подтверждения;
- календарь записей по выбранному дню с группировкой по мастерам;
- экспорт CSV с учетом текущих фильтров.

## Проверка

```bash
npm test
npm run build
```

## Деплой на сервер

1. Установить Node.js 22+, PM2 и reverse proxy.
2. Загрузить проект в `/var/www/parih`.
3. Создать `.env`:

```bash
DATABASE_URL=file:./dev.db
```

4. Установить зависимости и подготовить базу:

```bash
npm ci
npx prisma migrate deploy
npm run build
```

5. Запустить приложение:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Обновление проекта на сервере

```bash
cd /var/www/parih
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart parih-barbershop
```

На текущем сервере порт `80/443` уже занят Docker-контейнером Caddy. Рабочее подключение домена:

```caddyfile
https://parih.svoiprox.pro {
    encode gzip zstd
    reverse_proxy 172.18.0.1:3002
}
```

Для публичного открытия домена A-запись `parih.svoiprox.pro` должна указывать на сервер `2.26.54.49`.

## Android client

Отдельное мобильное приложение для обычных клиентов находится в `android-client`.

Клиентское приложение использует только публичные API:

- `GET /api/public/salon`
- `GET /api/public/services`
- `GET /api/public/masters`
- `GET /api/public/masters?date=YYYY-MM-DD`
- `GET /api/availability`
- `POST /api/appointments`
- `GET /api/public/appointments/by-token/:publicToken`

В приложении нет административных функций и обращений к `/api/admin/*`. Готовые APK/AAB лежат в `android-client/artifacts`, подробности сборки описаны в `android-client/README.md`.
