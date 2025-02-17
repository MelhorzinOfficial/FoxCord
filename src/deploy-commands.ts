import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const commands = [new SlashCommandBuilder().setName("ping").setDescription("Responde com pong!")];

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("🚀 Iniciando deploy de comandos...");

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), { body: commands });
    console.log("✅ Comandos deployados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao deployar comandos:", error);
  }
})();
