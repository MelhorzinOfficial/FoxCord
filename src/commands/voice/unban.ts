import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceUnban implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-unban')
			.setDescription('Desbane um usuário de um canal de voz');
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceUnban = new VoiceUnban();
