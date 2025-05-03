-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "autoRoleEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoRoleIDs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "defaultUserLimit" INTEGER;

-- AlterTable
ALTER TABLE "VoiceChannel" ALTER COLUMN "userLimit" DROP DEFAULT;
