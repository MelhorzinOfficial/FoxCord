import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../impl';

class VoiceTransferOwner implements Command {
	get data() {
		return new SlashCommandBuilder()
			.setName('voice-transfer-owner')
			.setDescription(
				'Transfere a propriedade do canal de voz para outro usuário',
			);
	}

	async execute(interaction: CommandInteraction) {}
}

export const voiceTransferOwner = new VoiceTransferOwner();
