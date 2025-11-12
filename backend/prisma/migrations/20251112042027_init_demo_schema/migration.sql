/*
  Warnings:

  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staffId_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "medical_logs" DROP CONSTRAINT "medical_logs_recordId_fkey";

-- DropForeignKey
ALTER TABLE "medical_logs" DROP CONSTRAINT "medical_logs_staffId_fkey";

-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_userId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_uploadedByStaffId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status";

-- DropTable
DROP TABLE "appointments";

-- DropTable
DROP TABLE "medical_logs";

-- DropTable
DROP TABLE "medical_records";

-- DropTable
DROP TABLE "reports";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "UserStatus";
