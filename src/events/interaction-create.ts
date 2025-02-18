import { Command } from '@/commands/impl';
import { getObjectImports } from '@/utils/object-imports';
import { CacheType, Events, Interaction } from 'discord.js';
import * as allCommands from '../commands';
import { EventImpl } from './impl';

class EventInteractionCreate implements EventImpl<Events.InteractionCreate> {
	
	type: string = Events.InteractionCreate;

	commands: Map<string, Command> = new Map();

	constructor() {
		this.listener = this.listener.bind(this);
		const cmds = getObjectImports<Command>(allCommands);
		this.commands = new Map(cmds.map((cmd) => [cmd.data.name, cmd]));
	}

	listener(interaction: Interaction<CacheType>) {
		if (!interaction.isCommand()) return;
		if (!interaction.isChatInputCommand()) return;

		const command = this.commands.get(interaction.commandName);
		if (!command) {
			return interaction.reply({ content: 'Command not found', ephemeral: true });
		};

		try {
			console.log(`Executing command: ${command.data.name}`);
			command.execute(interaction);
		} catch (error) {
			console.error("Error while executing command ", error);
			if (interaction.deferred || interaction.replied) {
				return interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			}
			return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}

	}
}

export const eventInteractionCreate = new EventInteractionCreate();
