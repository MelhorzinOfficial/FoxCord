import { REST, Routes } from "discord.js";
import { commands } from "./commands";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

// Get the commands data from the imported commands
const commandsData = Object.values(commands).map((command) => command.data);

// Log the commands to be deployed
console.log(`Loaded ${commandsData.length} commands for deployment`);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("🚀 Started refreshing application (/) commands.");
    console.log(`Deploying ${commandsData.length} commands to guild ${guildId}`);

    await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId), {
      body: commandsData,
    });

    console.log("✅ Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
}
