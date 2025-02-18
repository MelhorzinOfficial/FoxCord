import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceBan implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-ban')
			.setDescription('Bane um usuário de um canal de voz');
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceBan = new VoiceBan();
