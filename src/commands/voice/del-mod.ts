import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceDelMod implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-del-mod')
			.setDescription('Remove um usuário como moderador do canal de voz');
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceDelMod = new VoiceDelMod();
