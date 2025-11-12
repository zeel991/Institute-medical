-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('checkedIn', 'checkedOut');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'checkedOut';
