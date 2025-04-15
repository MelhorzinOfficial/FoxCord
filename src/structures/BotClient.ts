import { Client, ClientOptions, Collection, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import fs from "fs";
import { Command } from "./Commands";
import { deployCommands } from "../deploy-commands";
import { handleVoiceStateUpdate } from "../events/voiceStateUpdate";

export class BotClient extends Client {
  commands: Collection<string, Command>;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.initializeCommands();
    this.registerEvents();
  }

  private initializeCommands() {
    const commandsPath = path.join(__dirname, "..", "commands");
    const commandFolders = fs.readdirSync(commandsPath).filter((file) => !file.endsWith(".ts") && !file.endsWith(".js"));

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
          this.commands.set(command.data.name, command);
        }
      }
    }
  }

  private registerEvents() {
    this.once(Events.ClientReady, async () => {
      console.log(`Logged in as ${this.user?.tag}`);
      const guilds = await this.guilds.fetch();
      guilds.forEach(async (guild) => {
        await deployCommands({ guildId: guild.id });
        console.log(`Deployed commands to guild: ${guild.name}`);
      });
    });

    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);

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

    this.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);
  }
}
