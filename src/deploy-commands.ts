import { REST, Routes } from "discord.js";
import { commands } from "./commands";
import { config } from "dotenv";

config();

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("🚀 Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId), {
      body: commandsData,
    });

    console.log("✅ Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
}
