import { ChatInputCommandInteraction, SlashCommandBuilder, Role, PermissionsBitField, EmbedBuilder } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("autorole")
  .setDescription("Configura os cargos automáticos para novos membros")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Somente admins
  .addSubcommand((subcommand) => subcommand.setName("toggle").setDescription("Ativa ou desativa o sistema de AutoRole"))
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Adiciona um cargo à lista do AutoRole")
      .addRoleOption((option) => option.setName("cargo").setDescription("O cargo a ser adicionado").setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove um cargo da lista do AutoRole")
      .addRoleOption((option) => option.setName("cargo").setDescription("O cargo a ser removido").setRequired(true))
  )
  .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Lista os cargos configurados no AutoRole"));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply({ content: "Este comando só pode ser usado em um servidor.", ephemeral: true });
  }
  if (!interaction.guild) return; // Necessário para type safety

  const subcommand = interaction.options.getSubcommand();

  try {
    // Garante que a guilda exista no DB
    const guildData = await prisma.guild.upsert({
      where: { id: interaction.guild.id },
      update: { name: interaction.guild.name }, // Atualiza o nome caso mude
      create: { id: interaction.guild.id, name: interaction.guild.name },
      select: { autoRoleEnabled: true, autoRoleIDs: true },
    });

    switch (subcommand) {
      case "toggle": {
        const newStatus = !guildData.autoRoleEnabled;
        await prisma.guild.update({
          where: { id: interaction.guild.id },
          data: { autoRoleEnabled: newStatus },
        });
        return interaction.reply({ content: `Sistema de AutoRole ${newStatus ? "ativado" : "desativado"}.`, ephemeral: true });
      }

      case "add": {
        const roleToAdd = interaction.options.getRole("cargo", true) as Role;
        if (guildData.autoRoleIDs.includes(roleToAdd.id)) {
          return interaction.reply({ content: `O cargo ${roleToAdd.name} já está na lista.`, ephemeral: true });
        }
        // Verifica se o cargo é gerenciável pelo bot
        if (roleToAdd.managed || roleToAdd.position >= interaction.guild.members.me!.roles.highest.position) {
          return interaction.reply({ content: `Não posso gerenciar o cargo ${roleToAdd.name}. Verifique a hierarquia de cargos e se ele não é gerenciado por uma integração.`, ephemeral: true });
        }

        const updatedRoles = [...guildData.autoRoleIDs, roleToAdd.id];
        await prisma.guild.update({
          where: { id: interaction.guild.id },
          data: { autoRoleIDs: updatedRoles },
        });
        return interaction.reply({ content: `Cargo ${roleToAdd.name} adicionado à lista do AutoRole.`, ephemeral: true });
      }

      case "remove": {
        const roleToRemove = interaction.options.getRole("cargo", true) as Role;
        if (!guildData.autoRoleIDs.includes(roleToRemove.id)) {
          return interaction.reply({ content: `O cargo ${roleToRemove.name} não está na lista.`, ephemeral: true });
        }

        const updatedRoles = guildData.autoRoleIDs.filter((id) => id !== roleToRemove.id);
        await prisma.guild.update({
          where: { id: interaction.guild.id },
          data: { autoRoleIDs: updatedRoles },
        });
        return interaction.reply({ content: `Cargo ${roleToRemove.name} removido da lista do AutoRole.`, ephemeral: true });
      }

      case "list": {
        const embed = new EmbedBuilder()
          .setTitle("⚙️ Configuração do AutoRole")
          .setColor(guildData.autoRoleEnabled ? "#00FF00" : "#FF0000")
          .setDescription(`O sistema de AutoRole está atualmente **${guildData.autoRoleEnabled ? "ATIVADO" : "DESATIVADO"}**.`);

        if (guildData.autoRoleIDs.length > 0) {
          const roleMentions = guildData.autoRoleIDs.map((id) => `<@&${id}>`).join(", ");
          embed.addFields({ name: "Cargos Automáticos", value: roleMentions });
        } else {
          embed.addFields({ name: "Cargos Automáticos", value: "Nenhum cargo configurado." });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  } catch (error) {
    console.error("Erro no comando autorole:", error);
    return interaction.reply({ content: "Ocorreu um erro ao processar o comando AutoRole.", ephemeral: true });
  }
}
