import { Command } from '@/commands/impl';
import { env } from '@/config/env';
import { REST, Routes } from 'discord.js';

const discordRestClient = new REST({ version: '10' }).setToken(
	env.DISCORD_TOKEN,
);

export async function RegisterDiscordCommands(
	guildId: string,
	commands: Command[],
) {
	try {
		console.log('🚀 Started refreshing application (/) commands.');

		const commandsData = Object.values(commands).map(
			(command) => command.data,
		);
		const routerGuildCommands = Routes.applicationGuildCommands(
			env.DISCORD_CLIENT_ID,
			guildId,
		);
		await discordRestClient.put(routerGuildCommands, {
			body: commandsData,
		});

		console.log('✅ Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error('❌ Error deploying commands:', error);
	}
}
