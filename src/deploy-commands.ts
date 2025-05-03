import { REST, Routes, Collection } from "discord.js";
// import { commands } from "./commands";
import { config } from "dotenv";
import { Command } from "./structures/Commands";

config();

// const commandsData = Object.values(commands).map((command) => command.data);
// console.log(`Loaded ${commandsData.length} commands for deployment`);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

type DeployCommandsProps = {
  guildId: string;
  commands: Collection<string, Command>;
};

export async function deployCommands({ guildId, commands }: DeployCommandsProps) {
  const commandsData = commands.map((command) => command.data.toJSON());

  try {
    console.log(`🚀 Started refreshing ${commandsData.length} application (/) commands for guild ${guildId}.`);

    const result = await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId), {
      body: commandsData,
    });

    console.log(`✅ Successfully reloaded ${Array.isArray(result) ? result.length : "unknown"} application (/) commands for guild ${guildId}.`);
  } catch (error) {
    console.error(`❌ Error deploying commands to guild ${guildId}:`, error);
  }
}
