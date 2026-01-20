import { StringSelectMenuInteraction, GuildMember } from 'discord.js';
import prisma from '../../utils/database';

export async function handleRoleSelectorInteraction(interaction: StringSelectMenuInteraction): Promise<void> {
	if (interaction.customId !== 'role_selector') return;

	if (!interaction.inGuild() || !interaction.guild) {
		await interaction.reply({ content: 'Este menu só funciona em servidores.', ephemeral: true });
		return;
	}

	const member = interaction.member as GuildMember;
	const selectedRoleIds = interaction.values;

	// Busca o seletor e seus cargos
	const selector = await prisma.roleSelector.findUnique({
		where: { guildId: interaction.guild.id },
		include: { roles: true },
	});

	if (!selector) {
		await interaction.reply({ content: '❌ Seletor não configurado.', ephemeral: true });
		return;
	}

	// IDs dos cargos disponíveis no seletor
	const availableRoleIds = selector.roles.map((r) => r.roleId);

	// Cargos que o membro tem atualmente (apenas os do seletor)
	const currentRoleIds = member.roles.cache.filter((role) => availableRoleIds.includes(role.id)).map((role) => role.id);

	// Cargos a adicionar e remover
	const rolesToAdd = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
	const rolesToRemove = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

	const addedRoles: string[] = [];
	const removedRoles: string[] = [];
	const errors: string[] = [];

	// Adiciona cargos
	for (const roleId of rolesToAdd) {
		try {
			const role = await interaction.guild.roles.fetch(roleId);
			if (role) {
				await member.roles.add(role);
				addedRoles.push(role.name);
			}
		} catch (error) {
			const selectorRole = selector.roles.find((r) => r.roleId === roleId);
			errors.push(selectorRole?.label || roleId);
		}
	}

	// Remove cargos
	for (const roleId of rolesToRemove) {
		try {
			const role = await interaction.guild.roles.fetch(roleId);
			if (role) {
				await member.roles.remove(role);
				removedRoles.push(role.name);
			}
		} catch (error) {
			const selectorRole = selector.roles.find((r) => r.roleId === roleId);
			errors.push(selectorRole?.label || roleId);
		}
	}

	// Monta a resposta
	const messages: string[] = [];

	if (addedRoles.length > 0) {
		messages.push(`✅ **Adicionados:** ${addedRoles.join(', ')}`);
	}

	if (removedRoles.length > 0) {
		messages.push(`🗑️ **Removidos:** ${removedRoles.join(', ')}`);
	}

	if (errors.length > 0) {
		messages.push(`❌ **Erros:** ${errors.join(', ')}`);
	}

	if (messages.length === 0) {
		messages.push('ℹ️ Nenhuma alteração feita.');
	}

	await interaction.reply({
		content: messages.join('\n'),
		ephemeral: true,
	});
}
