import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel, PermissionsBitField } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("transferir")
  .setDescription("Transfere a propriedade do canal de voz para outro membro")
  .addUserOption((option) => option.setName("membro").setDescription("O membro que receberá a propriedade do canal").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  const targetMember = interaction.options.getMember("membro");
  const voiceChannel = (interaction.member as GuildMember)?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply({
      content: "Você precisa estar em um canal de voz para usar este comando!",
      ephemeral: true,
    });
  }

  if (!(voiceChannel instanceof VoiceChannel) || !voiceChannel.name.startsWith("🚀 ")) {
    return interaction.reply({
      content: "Este comando só pode ser usado em canais temporários criados pelo sistema!",
      ephemeral: true,
    });
  }

  if (!targetMember || !(targetMember instanceof GuildMember)) {
    return interaction.reply({
      content: "Membro não encontrado!",
      ephemeral: true,
    });
  }

  if (!targetMember.voice?.channelId || targetMember.voice.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "O membro precisa estar no mesmo canal de voz que você!",
      ephemeral: true,
    });
  }

  const channelData = await prisma.voiceChannel.findUnique({
    where: { id: voiceChannel.id },
    select: { ownerId: true },
  });

  if (!channelData || channelData.ownerId !== member?.user.id) {
    return interaction.reply({
      content: "Você não tem permissão para transferir a propriedade deste canal (você não é o dono).",
      ephemeral: true,
    });
  }

  if (targetMember.id === member?.user.id) {
    return interaction.reply({
      content: "Você já é o dono deste canal!",
      ephemeral: true,
    });
  }

  try {
    await prisma.voiceChannel.update({
      where: { id: voiceChannel.id },
      data: { ownerId: targetMember.id },
    });

    await voiceChannel.permissionOverwrites.edit(member!.user.id, {
      MoveMembers: null,
      MuteMembers: null,
      DeafenMembers: null,
    });

    await voiceChannel.permissionOverwrites.edit(targetMember.id, {
      MoveMembers: true,
      MuteMembers: true,
      DeafenMembers: true,
    });

    await interaction.reply({
      content: `✅ A propriedade do canal ${voiceChannel.name} foi transferida para ${targetMember}!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Ocorreu um erro ao transferir a propriedade do canal!",
      ephemeral: true,
    });
  }
}
