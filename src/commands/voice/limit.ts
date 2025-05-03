import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("limite")
  .setDescription("Define o limite de usuários no canal de voz")
  .addIntegerOption((option) => option.setName("quantidade").setDescription("Quantidade de usuários (1 a 99)").setRequired(true).setMinValue(1).setMaxValue(99));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
    return interaction.reply({
      content: "Você precisa estar em um canal de voz para usar este comando!",
      ephemeral: true,
    });
  }

  if (!voiceChannel.name.startsWith("🚀 ")) {
    return interaction.reply({
      content: "Este comando só pode ser usado em canais temporários criados pelo sistema!",
      ephemeral: true,
    });
  }

  const channelData = await prisma.voiceChannel.findUnique({
    where: { id: voiceChannel.id },
    select: { ownerId: true },
  });

  if (!channelData || channelData.ownerId !== member.id) {
    return interaction.reply({
      content: "Você não tem permissão para alterar o limite deste canal (você não é o dono).",
      ephemeral: true,
    });
  }

  const limit = interaction.options.getInteger("quantidade", true);

  try {
    await voiceChannel.setUserLimit(limit);

    await prisma.voiceChannel.update({
      where: { id: voiceChannel.id },
      data: { userLimit: limit },
    });

    await interaction.reply({
      content: `Limite de usuários do canal ${voiceChannel.name} definido para: ${limit}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Ocorreu um erro ao definir o limite de usuários!",
      ephemeral: true,
    });
  }
}
