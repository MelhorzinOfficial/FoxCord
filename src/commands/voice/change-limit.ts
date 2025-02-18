import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceChangeLimit implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-change-limit')
			.setDescription('Altera o limite de usuários no canal de voz');
	}

	async execute(interaction: CommandInteraction) {
		console.log('voice-change-limit');
	}
}

export const voiceChangeLimit = new VoiceChangeLimit();
