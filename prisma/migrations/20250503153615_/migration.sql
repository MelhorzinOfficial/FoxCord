-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "farewellChannelId" TEXT,
ADD COLUMN     "farewellEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "farewellMessage" TEXT DEFAULT '😥 Adeus **{user.tag}**... Sentiremos sua falta.',
ADD COLUMN     "welcomeChannelId" TEXT,
ADD COLUMN     "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "welcomeMessage" TEXT DEFAULT '👋 Bem-vindo(a) {user.mention} a **{guild.name}**! 🎉';
