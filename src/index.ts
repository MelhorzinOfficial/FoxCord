import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  const guilds = await client.guilds.fetch();
  guilds.forEach(async (guild) => {
    await deployCommands({ guildId: guild.id });
    console.log(`Deployed commands to guild: ${guild.name}`);
  });
});

client.on("messageCreate", (message) => {
  if (message.content === "ping") {
    message.reply("pong");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands[interaction.commandName as keyof typeof commands];

  if (!command) {
    console.log(`Comando não encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`Executando comando: ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Houve um erro ao executar este comando!", ephemeral: true });
    } else {
      await interaction.reply({ content: "Houve um erro ao executar este comando!", ephemeral: true });
    }
  }
});

client.on("voiceStateUpdate", handleVoiceStateUpdate);

client.login(process.env.DISCORD_TOKEN);
