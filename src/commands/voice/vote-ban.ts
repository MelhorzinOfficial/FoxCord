import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceVoteBan implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-vote-ban')
			.setDescription('Vota para banir um usuário do canal de voz');
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceVoteBan = new VoiceVoteBan();
