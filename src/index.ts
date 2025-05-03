import dotenv from "dotenv";
import { Events, GatewayIntentBits, Interaction } from "discord.js";
import { BotClient } from "./structures/BotClient";
import prisma from "./utils/database";
import { registerEvents } from "./events";
import { deployCommands } from "./deploy-commands";

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa o cliente do bot
const client = new BotClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

// Registrar os handlers de eventos
registerEvents(client);

// Evento ClientReady: Loga quando pronto e faz deploy dos comandos
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🟢 Logged in as ${readyClient.user.tag}`);
  try {
    console.log("🚀 Started refreshing application (/) commands.");
    const guilds = await readyClient.guilds.fetch();
    for (const [, guild] of guilds) {
      try {
        await deployCommands({ guildId: guild.id, commands: readyClient.commands });
      } catch (error) {
        // O log de erro agora está dentro de deployCommands
      }
    }
    console.log("🏁 Finished refreshing application (/) commands.");
  } catch (error) {
    console.error("❌ Failed to fetch guilds or deploy commands globally:", error);
  }
});

// Evento InteractionCreate: Lida com comandos slash
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`❓ Command not found: ${interaction.commandName}`);
    await interaction.reply({ content: "Comando não encontrado!", ephemeral: true });
    return;
  }

  try {
    console.log(`⏳ Executing command: ${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name}`);
    await command.execute(interaction);
    console.log(`✅ Successfully executed command: ${interaction.commandName}`);
  } catch (error) {
    console.error(`❌ Error executing command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Houve um erro ao executar este comando!", ephemeral: true });
    } else {
      await interaction.reply({ content: "Houve um erro ao executar este comando!", ephemeral: true });
    }
  }
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
