import dotenv from "dotenv";
import { GatewayIntentBits } from "discord.js";
import { BotClient } from "./structures/BotClient";
import prisma from "./utils/database";

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa o cliente do bot
const client = new BotClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

// Função para lidar com o desligamento gracioso
async function shutdown() {
  console.log("Desconectando do banco de dados...");
  await prisma.$disconnect();
  console.log("Desligando o bot...");
  client.destroy();
  process.exit(0);
}

// Registra os eventos para lidar com o desligamento gracioso
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Inicia o bot
client.login(process.env.DISCORD_TOKEN);
