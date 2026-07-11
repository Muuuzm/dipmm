CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Master" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "MasterService" (
    "masterId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    PRIMARY KEY ("masterId", "serviceId"),
    CONSTRAINT "MasterService_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MasterService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WeeklyShift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "masterId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '21:00',
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WeeklyShift_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TimeOff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "masterId" INTEGER,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    CONSTRAINT "TimeOff_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppointmentSlot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appointmentId" INTEGER NOT NULL,
    "masterId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    CONSTRAINT "AppointmentSlot_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppointmentSlot_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SalonSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '21:00',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "aboutImage" TEXT NOT NULL,
    "vkUrl" TEXT,
    "telegramUrl" TEXT,
    "whatsappUrl" TEXT,
    "mapUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "GalleryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "serviceName" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "master" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "price" INTEGER,
    "publicToken" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" INTEGER,
    "masterId" INTEGER,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("comment", "createdAt", "date", "duration", "id", "master", "name", "phone", "price", "publicToken", "service", "status", "time")
SELECT "comment", "createdAt", "date", "duration", "id", "master", "name", "phone", "price", "publicToken", "service", "status", "time" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_publicToken_key" ON "Appointment"("publicToken");
CREATE INDEX "Appointment_date_masterId_status_idx" ON "Appointment"("date", "masterId", "status");
CREATE INDEX "Appointment_phone_date_idx" ON "Appointment"("phone", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE UNIQUE INDEX "Service_title_key" ON "Service"("title");
CREATE UNIQUE INDEX "Master_slug_key" ON "Master"("slug");
CREATE UNIQUE INDEX "Master_name_key" ON "Master"("name");
CREATE UNIQUE INDEX "WeeklyShift_masterId_dayOfWeek_key" ON "WeeklyShift"("masterId", "dayOfWeek");
CREATE INDEX "TimeOff_date_masterId_idx" ON "TimeOff"("date", "masterId");
CREATE INDEX "AppointmentSlot_appointmentId_idx" ON "AppointmentSlot"("appointmentId");
CREATE UNIQUE INDEX "AppointmentSlot_masterId_date_time_key" ON "AppointmentSlot"("masterId", "date", "time");
