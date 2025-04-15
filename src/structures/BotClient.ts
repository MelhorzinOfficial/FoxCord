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

    // Initialize commands first, then register events
    try {
      this.initializeCommands();
      this.registerEvents();
      console.log("Bot client initialization complete");
    } catch (error) {
      console.error("Error during bot initialization:", error);
    }
  }

  private initializeCommands() {
    try {
      // Path resolution that works in both development and production
      let commandsPath;
      const devPath = path.join(process.cwd(), "src", "commands");
      const prodPath = path.join(process.cwd(), "dist", "commands");

      // Check if we're in production (dist directory exists and contains commands)
      if (fs.existsSync(prodPath)) {
        commandsPath = prodPath;
        console.log(`Using production commands path: ${commandsPath}`);
      } else {
        commandsPath = devPath;
        console.log(`Using development commands path: ${commandsPath}`);
      }

      if (!fs.existsSync(commandsPath)) {
        console.error(`Commands directory not found at ${commandsPath}`);
        return;
      }

      // Get all items in the commands directory
      const commandItems = fs.readdirSync(commandsPath);

      // Filter to get only directories (skipping files like index.js and index.js.map)
      const commandFolders = commandItems.filter((item) => {
        try {
          const itemPath = path.join(commandsPath, item);
          return fs.statSync(itemPath).isDirectory();
        } catch (error) {
          console.error(`Error checking if ${item} is a directory:`, error);
          return false;
        }
      });

      console.log(`Found ${commandFolders.length} command folders: ${commandFolders.join(", ")}`);

      for (const folder of commandFolders) {
        try {
          const folderPath = path.join(commandsPath, folder);
          const commandFiles = fs.readdirSync(folderPath).filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts") && !file.endsWith(".js.map"));

          console.log(`Loading ${commandFiles.length} commands from ${folder}: ${commandFiles.join(", ")}`);

          for (const file of commandFiles) {
            try {
              const filePath = path.join(folderPath, file);
              const command = require(filePath);

              if ("data" in command && "execute" in command) {
                this.commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
              } else {
                console.warn(`Command at ${filePath} is missing required properties (data or execute)`);
              }
            } catch (error) {
              console.error(`Error loading command file ${file}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error processing command folder ${folder}:`, error);
        }
      }

      console.log(`Total commands loaded: ${this.commands.size}`);
    } catch (error) {
      console.error("Failed to initialize commands:", error);
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
