import { ChatInputCommandInteraction, SlashCommandBuilder, Role, PermissionsBitField, EmbedBuilder, TextChannel, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelType } from 'discord.js';
import prisma from '../../utils/database';

// Função auxiliar para criar o embed e menu
async function createRoleSelectorComponents(guildId: string) {
	const selector = await prisma.roleSelector.findUnique({
		where: { guildId },
		include: { roles: true },
	});

	if (!selector) return null;

	const embed = new EmbedBuilder().setTitle(selector.title).setDescription(selector.description).setColor('#5865F2').setFooter({ text: 'Clique no menu abaixo para selecionar seus cargos' });

	if (selector.roles.length > 0) {
		const rolesDescription = selector.roles.map((r) => `${r.emoji || '•'} <@&${r.roleId}>${r.description ? ` - ${r.description}` : ''}`).join('\n');
		embed.addFields({ name: 'Cargos Disponíveis', value: rolesDescription });
	} else {
		embed.addFields({ name: 'Cargos Disponíveis', value: 'Nenhum cargo configurado ainda.' });
	}

	const selectMenu = new StringSelectMenuBuilder().setCustomId('role_selector').setPlaceholder('Selecione seus cargos...').setMinValues(0).setMaxValues(Math.max(1, selector.roles.length));

	if (selector.roles.length > 0) {
		selector.roles.forEach((role) => {
			const option = new StringSelectMenuOptionBuilder().setLabel(role.label).setValue(role.roleId);

			if (role.description) option.setDescription(role.description);
			if (role.emoji) option.setEmoji(role.emoji);

			selectMenu.addOptions(option);
		});
	} else {
		// Menu vazio não é permitido, adiciona placeholder
		selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel('Nenhum cargo disponível').setValue('none').setDescription('Aguarde o admin configurar os cargos'));
		selectMenu.setDisabled(true);
	}

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	return { embed, row };
}

// Função para atualizar a mensagem do seletor
async function updateSelectorMessage(interaction: ChatInputCommandInteraction) {
	const selector = await prisma.roleSelector.findUnique({
		where: { guildId: interaction.guild!.id },
	});

	if (!selector || !selector.messageId) return;

	try {
		const channel = await interaction.guild!.channels.fetch(selector.channelId);
		if (!channel || !(channel instanceof TextChannel)) return;

		const message = await channel.messages.fetch(selector.messageId);
		const components = await createRoleSelectorComponents(interaction.guild!.id);

		if (components) {
			await message.edit({ embeds: [components.embed], components: [components.row] });
		}
	} catch (error) {
		console.error('Erro ao atualizar mensagem do seletor:', error);
	}
}

export const data = new SlashCommandBuilder()
	.setName('roleselector')
	.setDescription('Configura o seletor de cargos para membros')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
	.addSubcommand((subcommand) =>
		subcommand
			.setName('setup')
			.setDescription('Configura o canal e envia o embed do seletor')
			.addChannelOption((option) => option.setName('canal').setDescription('O canal onde o seletor será enviado').setRequired(true).addChannelTypes(ChannelType.GuildText)),
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName('add')
			.setDescription('Adiciona um cargo ao seletor')
			.addRoleOption((option) => option.setName('cargo').setDescription('O cargo a ser adicionado').setRequired(true))
			.addStringOption((option) => option.setName('descricao').setDescription('Descrição do cargo (aparece no menu)').setRequired(false))
			.addStringOption((option) => option.setName('emoji').setDescription('Emoji para o cargo (ex: 🎮)').setRequired(false)),
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName('remove')
			.setDescription('Remove um cargo do seletor')
			.addRoleOption((option) => option.setName('cargo').setDescription('O cargo a ser removido').setRequired(true)),
	)
	.addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lista os cargos configurados no seletor'))
	.addSubcommand((subcommand) => subcommand.setName('refresh').setDescription('Atualiza o embed do seletor no canal'));

export async function execute(interaction: ChatInputCommandInteraction) {
	if (!interaction.inGuild() || !interaction.guild) {
		return interaction.reply({ content: 'Este comando só pode ser usado em um servidor.', flags: 64 });
	}

	const subcommand = interaction.options.getSubcommand();

	try {
		// Garante que a guilda exista no DB
		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: { name: interaction.guild.name },
			create: { id: interaction.guild.id, name: interaction.guild.name },
		});

		switch (subcommand) {
			case 'setup': {
				const channel = interaction.options.getChannel('canal', true) as TextChannel;

				// Verifica se já existe um seletor
				const existingSelector = await prisma.roleSelector.findUnique({
					where: { guildId: interaction.guild.id },
				});

				// Cria ou atualiza o seletor
				const selector = await prisma.roleSelector.upsert({
					where: { guildId: interaction.guild.id },
					update: { channelId: channel.id },
					create: {
						guildId: interaction.guild.id,
						channelId: channel.id,
					},
					include: { roles: true },
				});

				// Se já tinha mensagem antiga, tenta deletar
				if (existingSelector?.messageId) {
					try {
						const oldChannel = await interaction.guild.channels.fetch(existingSelector.channelId);
						if (oldChannel instanceof TextChannel) {
							const oldMessage = await oldChannel.messages.fetch(existingSelector.messageId);
							await oldMessage.delete();
						}
					} catch {
						// Ignora se não conseguir deletar
					}
				}

				// Cria o embed e menu
				const components = await createRoleSelectorComponents(interaction.guild.id);
				if (!components) {
					return interaction.reply({ content: 'Erro ao criar componentes do seletor.', flags: 64 });
				}

				// Envia a mensagem
				const message = await channel.send({
					embeds: [components.embed],
					components: [components.row],
				});

				// Salva o ID da mensagem
				await prisma.roleSelector.update({
					where: { guildId: interaction.guild.id },
					data: { messageId: message.id },
				});

				return interaction.reply({
					content: `✅ Seletor de cargos configurado em ${channel}! Use \`/roleselector add\` para adicionar cargos.`,
					flags: 64,
				});
			}

			case 'add': {
				const role = interaction.options.getRole('cargo', true) as Role;
				const description = interaction.options.getString('descricao');
				const emoji = interaction.options.getString('emoji');

				// Verifica se existe um seletor
				const selector = await prisma.roleSelector.findUnique({
					where: { guildId: interaction.guild.id },
					include: { roles: true },
				});

				if (!selector) {
					return interaction.reply({
						content: '❌ Configure o seletor primeiro com `/roleselector setup`.',
						flags: 64,
					});
				}

				// Limite de 25 cargos (limite do Discord para select menus)
				if (selector.roles.length >= 25) {
					return interaction.reply({
						content: '❌ Limite máximo de 25 cargos atingido.',
						flags: 64,
					});
				}

				// Verifica se o cargo já está no seletor
				const existingRole = selector.roles.find((r) => r.roleId === role.id);
				if (existingRole) {
					return interaction.reply({
						content: `❌ O cargo ${role.name} já está no seletor.`,
						flags: 64,
					});
				}

				// Verifica se o bot pode gerenciar o cargo
				if (role.managed || role.position >= interaction.guild.members.me!.roles.highest.position) {
					return interaction.reply({
						content: `❌ Não posso gerenciar o cargo ${role.name}. Verifique a hierarquia de cargos.`,
						flags: 64,
					});
				}

				// Adiciona o cargo
				await prisma.selectorRole.create({
					data: {
						selectorId: selector.id,
						roleId: role.id,
						label: role.name,
						description: description || null,
						emoji: emoji || null,
					},
				});

				// Atualiza a mensagem
				await updateSelectorMessage(interaction);

				return interaction.reply({
					content: `✅ Cargo ${role.name} adicionado ao seletor!`,
					flags: 64,
				});
			}

			case 'remove': {
				const role = interaction.options.getRole('cargo', true) as Role;

				const selector = await prisma.roleSelector.findUnique({
					where: { guildId: interaction.guild.id },
					include: { roles: true },
				});

				if (!selector) {
					return interaction.reply({
						content: '❌ Nenhum seletor configurado.',
						flags: 64,
					});
				}

				const selectorRole = selector.roles.find((r) => r.roleId === role.id);
				if (!selectorRole) {
					return interaction.reply({
						content: `❌ O cargo ${role.name} não está no seletor.`,
						flags: 64,
					});
				}

				await prisma.selectorRole.delete({
					where: { id: selectorRole.id },
				});

				await updateSelectorMessage(interaction);

				return interaction.reply({
					content: `✅ Cargo ${role.name} removido do seletor.`,
					flags: 64,
				});
			}

			case 'list': {
				const selector = await prisma.roleSelector.findUnique({
					where: { guildId: interaction.guild.id },
					include: { roles: true },
				});

				const embed = new EmbedBuilder().setTitle('⚙️ Configuração do Seletor de Cargos').setColor('#5865F2');

				if (!selector) {
					embed.setDescription('Nenhum seletor configurado. Use `/roleselector setup` para começar.');
				} else {
					embed.setDescription(`Canal: <#${selector.channelId}>`);

					if (selector.roles.length > 0) {
						const rolesText = selector.roles.map((r) => `${r.emoji || '•'} <@&${r.roleId}>${r.description ? ` - ${r.description}` : ''}`).join('\n');
						embed.addFields({ name: `Cargos (${selector.roles.length}/25)`, value: rolesText });
					} else {
						embed.addFields({ name: 'Cargos', value: 'Nenhum cargo configurado.' });
					}
				}

				return interaction.reply({ embeds: [embed], flags: 64 });
			}

			case 'refresh': {
				const selector = await prisma.roleSelector.findUnique({
					where: { guildId: interaction.guild.id },
				});

				if (!selector || !selector.messageId) {
					return interaction.reply({
						content: '❌ Nenhum seletor configurado ou mensagem não encontrada.',
						flags: 64,
					});
				}

				await updateSelectorMessage(interaction);

				return interaction.reply({
					content: '✅ Seletor atualizado!',
					flags: 64,
				});
			}
		}
	} catch (error) {
		console.error('Erro no comando roleselector:', error);
		return interaction.reply({
			content: '❌ Ocorreu um erro ao processar o comando.',
			flags: 64,
		});
	}
}
