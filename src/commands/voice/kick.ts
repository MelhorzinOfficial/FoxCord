import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Expulsa um usuário da sua sala de voz")
  .addUserOption((option) => option.setName("usuario").setDescription("Usuário a ser expulso da sala").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
    return interaction.reply({
      content: "Você precisa estar em um canal de voz para usar este comando!",
      ephemeral: true,
    });
  }

  if (!voiceChannel.name.startsWith("🚀")) {
    return interaction.reply({
      content: "Este comando só pode ser usado em canais temporários criados pelo sistema!",
      ephemeral: true,
    });
  }

  const channelData = await prisma.voiceChannel.findUnique({
    where: { id: voiceChannel.id },
  });

  if (!channelData || channelData.ownerId !== member.id) {
    return interaction.reply({
      content: "Você não é o dono deste canal!",
      ephemeral: true,
    });
  }

  const targetUser = interaction.options.getUser("usuario", true);
  const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!targetMember) {
    return interaction.reply({
      content: "Usuário não encontrado no servidor!",
      ephemeral: true,
    });
  }

  if (targetMember.id === member.id) {
    return interaction.reply({
      content: "Você não pode expulsar a si mesmo da sala!",
      ephemeral: true,
    });
  }

  if (targetMember.voice.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "Este usuário não está na sua sala de voz!",
      ephemeral: true,
    });
  }

  try {
    // Desconectar o usuário do canal
    await targetMember.voice.disconnect();

    // Atualizar as permissões para impedir que ele volte
    await voiceChannel.permissionOverwrites.edit(targetMember, {
      Connect: false,
    });

    await interaction.reply({
      content: `✅ ${targetUser.username} foi expulso da sala com sucesso!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao expulsar o usuário da sala!",
      ephemeral: true,
    });
  }
}
