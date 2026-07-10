ALTER TABLE "Appointment" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Appointment_publicToken_key" ON "Appointment"("publicToken");
