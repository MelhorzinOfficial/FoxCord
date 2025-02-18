import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceKick implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-kick')
			.setDescription('Expulsa um usuário de um canal de voz');
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceKick = new VoiceKick();
