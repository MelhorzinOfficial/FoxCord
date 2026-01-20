import { Events } from 'discord.js';
import { BotClient } from '../structures/BotClient';
import { handleVoiceStateUpdate } from './voiceStateUpdate';
import { handleGuildMemberAdd } from './guild/guildMemberAdd';
import { handleRoleSelectorInteraction } from './interactions/roleSelectorHandler';

// Função para registrar todos os handlers de eventos
export function registerEvents(client: BotClient): void {
	client.on(Events.VoiceStateUpdate, (oldState, newState) => {
		handleVoiceStateUpdate(oldState, newState).catch((err) => {
			console.error('Erro não tratado em VoiceStateUpdate:', err);
		});
	});

	client.on(Events.GuildMemberAdd, (member) => {
		// Verifica se o membro não é parcial
		if (member.partial) {
			member
				.fetch()
				.then((fullMember) => {
					handleGuildMemberAdd(fullMember, client).catch((err) => {
						console.error('Erro não tratado em GuildMemberAdd (parcial):', err);
					});
				})
				.catch((err) => {
					console.error('Erro ao buscar membro parcial em GuildMemberAdd:', err);
				});
		} else {
			handleGuildMemberAdd(member, client).catch((err) => {
				console.error('Erro não tratado em GuildMemberAdd:', err);
			});
		}
	});

	// Handler para StringSelectMenu (Role Selector)
	client.on(Events.InteractionCreate, (interaction) => {
		if (interaction.isStringSelectMenu()) {
			handleRoleSelectorInteraction(interaction).catch((err) => {
				console.error('Erro não tratado em RoleSelectorInteraction:', err);
			});
		}
	});

	// Adicione outros listeners de eventos aqui...
	// client.on(Events.MessageCreate, message => { ... });

	console.log('✅ Handlers de eventos registrados.');
}
