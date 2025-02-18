import { Command } from '@/commands/impl';
import { RegisterDiscordCommands } from '@/utils/deploy-commands';
import { getObjectImports } from '@/utils/object-imports';
import { Client, Events } from 'discord.js';
import * as allCommands from '../commands';
import { EventImpl } from './impl';

class EventClientReady implements EventImpl<Events.ClientReady> {
	type: string = Events.ClientReady;

	async listener(client: Client<true>) {
		console.log(`Logged in as ${client.user?.tag}`);
		const guilds = await client.guilds.fetch();
		const commands = getObjectImports<Command>(allCommands);

		for (const guild of guilds.values()) {
			await RegisterDiscordCommands(guild.id, commands);
			console.log(`Deployed commands to guild: ${guild.name}`);
		}
	}
}

export const eventClientReady = new EventClientReady();
