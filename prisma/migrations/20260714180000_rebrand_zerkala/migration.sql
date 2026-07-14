ALTER TABLE "SalonSettings" ADD COLUMN "workingDaysLabel" TEXT NOT NULL DEFAULT 'Вт-пт';
ALTER TABLE "SalonSettings" ADD COLUMN "weekendDaysLabel" TEXT NOT NULL DEFAULT 'Сб';

UPDATE "SalonSettings"
SET "name" = 'Зеркала',
    "subtitle" = 'парикмахерская в Северодвинске',
    "tagline" = 'Стрижки без лишних слов',
    "description" = 'Мужские и женские стрижки по предварительной записи. Дополнительно доступны услуги для волос, ногтей, бровей и ресниц.',
    "workingHoursStart" = '11:00',
    "workingHoursEnd" = '19:00',
    "workingDaysLabel" = 'Вт-пт',
    "weekendHoursStart" = '11:00',
    "weekendHoursEnd" = '18:00',
    "weekendDaysLabel" = 'Сб',
    "phone" = '+7 (900) 911-02-22',
    "email" = '',
    "address" = 'г. Северодвинск, ул. Лебедева, 7А',
    "mapUrl" = 'https://yandex.ru/maps/org/zerkala/3862380459/',
    "latitude" = 64.540552,
    "longitude" = 39.804762,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 1;

UPDATE "Service"
SET "price" = 200,
    "description" = 'Классическая или короткая мужская стрижка с учетом пожеланий клиента.',
    "isActive" = true,
    "isPopular" = true,
    "isBookable" = true,
    "sortOrder" = 10
WHERE "slug" = 'mens-haircut';

UPDATE "Service"
SET "price" = 350,
    "isActive" = true,
    "isPopular" = true,
    "isBookable" = true,
    "sortOrder" = 20
WHERE "slug" = 'womens-haircut';

UPDATE "Service"
SET "title" = 'Маникюр',
    "price" = 0,
    "description" = 'Маникюр и покрытие. Стоимость уточняется при записи.',
    "isActive" = true,
    "isPopular" = true,
    "isBookable" = false,
    "sortOrder" = 30
WHERE "slug" = 'manicure';

UPDATE "Service"
SET "price" = 0,
    "isActive" = true,
    "isPopular" = true,
    "isBookable" = false,
    "sortOrder" = 40
WHERE "slug" = 'massage';

INSERT INTO "Service" ("slug", "icon", "title", "price", "duration", "description", "isActive", "isPopular", "isBookable", "sortOrder", "createdAt", "updatedAt")
VALUES ('pedicure', 'sparkles', 'Педикюр', 0, 90, 'Педикюр по предварительной записи. Стоимость уточняется по телефону.', true, true, false, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("slug") DO UPDATE SET
  "title" = excluded."title", "price" = excluded."price", "duration" = excluded."duration",
  "description" = excluded."description", "isActive" = true, "isPopular" = true,
  "isBookable" = false, "sortOrder" = 50, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Service" ("slug", "icon", "title", "price", "duration", "description", "isActive", "isPopular", "isBookable", "sortOrder", "createdAt", "updatedAt")
VALUES ('brows-lashes', 'eye', 'Брови и ресницы', 0, 60, 'Оформление бровей и ресниц по предварительной записи.', true, true, false, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("slug") DO UPDATE SET
  "title" = excluded."title", "price" = excluded."price", "duration" = excluded."duration",
  "description" = excluded."description", "isActive" = true, "isPopular" = true,
  "isBookable" = false, "sortOrder" = 60, "updatedAt" = CURRENT_TIMESTAMP;

DELETE FROM "WeeklyShift" WHERE "masterId" IN (
  SELECT "id" FROM "Master" WHERE "slug" IN ('anna-volkova', 'ilya-sokolov')
);

INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 2, '11:00', '19:00' FROM "Master" WHERE "slug" = 'anna-volkova';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 5, '11:00', '19:00' FROM "Master" WHERE "slug" = 'anna-volkova';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 3, '11:00', '19:00' FROM "Master" WHERE "slug" = 'ilya-sokolov';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 6, '11:00', '18:00' FROM "Master" WHERE "slug" = 'ilya-sokolov';
