# Студия Престиж

Дипломная информационная система парикмахерской: публичный landing page, пошаговая онлайн-запись, защищенная веб-админка и отдельный Android-клиент для посетителей.

## Технологии

- Next.js 15, React 19, TypeScript
- Prisma ORM и SQLite
- Node.js, PM2, Caddy/Nginx
- Kotlin, Jetpack Compose, Material 3, OkHttp, DataStore

## Данные салона

- Адрес: г. Архангельск, просп. Победы, 58
- Телефон: +7 (950) 252-69-99
- Координаты: 64.537494, 39.805033
- Будни: 10:00-20:00
- Суббота и воскресенье: 10:00-19:00
- Яндекс.Карты: https://yandex.ru/maps/-/CTBrYHlm

## Архитектура

SQLite является единым источником данных для сайта и мобильного приложения. В базе хранятся:

- `Service` — услуги, цены, длительность и видимость;
- `Master` и `MasterService` — мастера и их специализации;
- `WeeklyShift` и `TimeOff` — смены и недоступные интервалы;
- `Appointment` и `AppointmentSlot` — заявки и атомарно занятые 30-минутные слоты;
- `SalonSettings` — контакты, тексты, изображения и режим работы;
- `GalleryItem` и `Review` — портфолио и отзывы.

Цена и длительность при создании записи берутся только из базы. Клиентские значения не считаются доверенными. `AppointmentSlot` имеет уникальный индекс по мастеру, дате и времени, поэтому параллельные запросы не создают пересекающиеся записи.

## Основные маршруты

- `/` — публичная страница студии;
- `/booking` — пошаговая онлайн-запись;
- `/admin/login` — вход администратора;
- `/admin` — заявки, статистика, фильтры, календарь и CSV;
- `/admin/catalog` — услуги, мастера, смены и настройки сайта.

Публичные API:

- `GET /api/public/salon`
- `GET /api/public/services`
- `GET /api/public/masters?date=YYYY-MM-DD&service=service-slug`
- `GET /api/availability?date=YYYY-MM-DD&master=Имя&service=service-slug`
- `POST /api/appointments`
- `GET /api/public/appointments/by-token/:publicToken`

## Локальный запуск

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Сайт будет доступен на `http://localhost:3000`.

Переменные окружения:

```env
DATABASE_URL="file:./dev.db"
ADMIN_LOGIN=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
ADMIN_SESSION_SECRET=CHANGE_ME_RANDOM_SECRET
```

## Проверка

```bash
npm test
npm run build
```

## Деплой

Проект на сервере расположен в `/var/www/parih`, PM2-процесс — `parih-barbershop`.

```bash
cd /var/www/parih
git pull
npm ci
npx prisma migrate deploy
npm run prisma:seed
npm run build
pm2 restart parih-barbershop
pm2 status
```

Seed использует `upsert` и не перезаписывает изменения, сделанные администратором. Он добавляет только отсутствующие начальные данные и связывает старые заявки с новым каталогом.

## Android-клиент

Исходный код находится в `android-client`. Приложение предназначено только для обычных клиентов и не содержит административных функций, паролей или обращений к `/api/admin/*`.

Android получает услуги, цены, мастеров, смены, свободные слоты и статус записи по HTTPS с Next.js backend. Локально сохраняются только имя, телефон, безопасный `publicToken` и последняя загруженная запись.

Подробная инструкция и размеры сборок: `android-client/README.md`.
