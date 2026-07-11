ALTER TABLE "Service" ADD COLUMN "isBookable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "SalonSettings" ADD COLUMN "weekendHoursStart" TEXT NOT NULL DEFAULT '10:00';
ALTER TABLE "SalonSettings" ADD COLUMN "weekendHoursEnd" TEXT NOT NULL DEFAULT '19:00';
ALTER TABLE "SalonSettings" ADD COLUMN "latitude" REAL;
ALTER TABLE "SalonSettings" ADD COLUMN "longitude" REAL;

UPDATE "SalonSettings"
SET "workingHoursStart" = '10:00',
    "workingHoursEnd" = '20:00',
    "weekendHoursStart" = '10:00',
    "weekendHoursEnd" = '19:00',
    "phone" = '+7 (950) 252-69-99',
    "email" = '',
    "address" = 'г. Архангельск, просп. Победы, 58',
    "vkUrl" = NULL,
    "telegramUrl" = NULL,
    "whatsappUrl" = NULL,
    "mapUrl" = 'https://yandex.ru/maps/-/CTBrYHlm',
    "latitude" = 64.537494,
    "longitude" = 39.805033
WHERE "id" = 1;

UPDATE "WeeklyShift"
SET "startTime" = '10:00',
    "endTime" = CASE WHEN "dayOfWeek" IN (0, 6) THEN '19:00' ELSE '20:00' END;

UPDATE "Service" SET "price" = 180, "description" = 'Аккуратная мужская стрижка с учетом формы головы и привычного стиля.', "isActive" = true, "isBookable" = true WHERE "slug" = 'mens-haircut';
UPDATE "Service" SET "price" = 350, "description" = 'Женская стрижка с подбором формы и рекомендациями по домашнему уходу.', "isActive" = true, "isBookable" = true WHERE "slug" = 'womens-haircut';
UPDATE "Service" SET "isActive" = false WHERE "slug" IN ('kids-haircut', 'coloring', 'styling', 'hair-care');

INSERT OR IGNORE INTO "Service" ("slug", "icon", "title", "price", "duration", "description", "isPopular", "isActive", "isBookable", "sortOrder", "createdAt", "updatedAt")
VALUES ('manicure', 'hand', 'Классический маникюр с покрытием', 350, 90, 'Классический женский маникюр с аккуратным покрытием.', true, true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "Service" ("slug", "icon", "title", "price", "duration", "description", "isPopular", "isActive", "isBookable", "sortOrder", "createdAt", "updatedAt")
VALUES ('massage', 'activity', 'Массаж', 0, 60, 'Массажные процедуры. Стоимость и продолжительность уточняйте по телефону.', true, true, false, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
