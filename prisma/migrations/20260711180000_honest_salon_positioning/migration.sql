UPDATE "SalonSettings"
SET "subtitle" = 'мужские и женские стрижки',
    "tagline" = 'Мужские стрижки рядом с домом',
    "description" = 'В основном занимаемся мужскими стрижками. Также выполняем женские стрижки и другие услуги по предварительной записи.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 1;

UPDATE "Master"
SET "role" = 'Парикмахер',
    "experience" = 'Женские и мужские стрижки',
    "bio" = 'Выполняет женские и мужские стрижки по предварительной записи.',
    "tags" = 'женские стрижки|мужские стрижки',
    "isActive" = true,
    "sortOrder" = 10
WHERE "slug" = 'anna-volkova';

UPDATE "Master"
SET "role" = 'Парикмахер, мужские стрижки',
    "experience" = 'Основное направление — мужские стрижки',
    "bio" = 'Выполняет мужские стрижки и помогает подобрать удобную повседневную форму.',
    "tags" = 'мужские стрижки',
    "isActive" = true,
    "sortOrder" = 20
WHERE "slug" = 'ilya-sokolov';

UPDATE "Master" SET "isActive" = false WHERE "slug" = 'maria-orlova';

DELETE FROM "WeeklyShift" WHERE "masterId" IN (
  SELECT "id" FROM "Master" WHERE "slug" IN ('anna-volkova', 'ilya-sokolov', 'maria-orlova')
);

INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 1, '10:00', '20:00' FROM "Master" WHERE "slug" = 'anna-volkova';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 3, '10:00', '20:00' FROM "Master" WHERE "slug" = 'anna-volkova';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 2, '10:00', '20:00' FROM "Master" WHERE "slug" = 'ilya-sokolov';
INSERT INTO "WeeklyShift" ("masterId", "dayOfWeek", "startTime", "endTime")
SELECT "id", 4, '10:00', '20:00' FROM "Master" WHERE "slug" = 'ilya-sokolov';

DELETE FROM "MasterService" WHERE "masterId" IN (
  SELECT "id" FROM "Master" WHERE "slug" IN ('anna-volkova', 'ilya-sokolov', 'maria-orlova')
);

INSERT INTO "MasterService" ("masterId", "serviceId")
SELECT m."id", s."id" FROM "Master" m, "Service" s
WHERE m."slug" = 'anna-volkova' AND s."slug" IN ('mens-haircut', 'womens-haircut');
INSERT INTO "MasterService" ("masterId", "serviceId")
SELECT m."id", s."id" FROM "Master" m, "Service" s
WHERE m."slug" = 'ilya-sokolov' AND s."slug" = 'mens-haircut';
