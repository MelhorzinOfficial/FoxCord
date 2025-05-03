import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("renomear")
  .setDescription("Renomeia o canal de voz")
  .addStringOption((option) => option.setName("nome").setDescription("O novo nome para o canal").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  const voiceChannel = (interaction.member as GuildMember)?.voice.channel;

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

  const channelData = await prisma.voiceChannel.findUnique({
    where: { id: voiceChannel.id },
    select: { ownerId: true },
  });

  if (!channelData || channelData.ownerId !== member?.user.id) {
    return interaction.reply({
      content: "Você não tem permissão para renomear este canal (você não é o dono).",
      ephemeral: true,
    });
  }

  const newNameInput = interaction.options.getString("nome", true);
  const newChannelName = `🚀 ${newNameInput}`;

  try {
    await voiceChannel.setName(newChannelName);

    await prisma.voiceChannel.update({
      where: { id: voiceChannel.id },
      data: { name: newChannelName },
    });

    await interaction.reply({
      content: `Canal renomeado para: ${newChannelName}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Ocorreu um erro ao renomear o canal!",
      ephemeral: true,
    });
  }
}
