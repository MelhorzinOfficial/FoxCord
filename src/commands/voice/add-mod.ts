import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceAddMod implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-add-mod')
			.setDescription(
				'Adiciona um usuário como moderador do canal de voz',
			);
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceAddMod = new VoiceAddMod();
