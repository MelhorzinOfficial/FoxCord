import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder().setName("lock").setDescription("Tranca ou destranca sua sala de voz");

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

  // Verificar o estado atual da sala
  const isLocked = channelData.isLocked;

  try {
    // Inverter o estado da sala
    await prisma.voiceChannel.update({
      where: { id: voiceChannel.id },
      data: { isLocked: !isLocked },
    });

    // Atualizar permissões no Discord
    await voiceChannel.permissionOverwrites.edit(interaction.guild!.id, {
      Connect: isLocked, // Se estava trancada, destranca; se estava destrancada, tranca
    });

    // Atualizar o nome do canal com um indicador visual
    const currentName = voiceChannel.name;
    const newName = isLocked ? currentName.replace("🔒 ", "").replace("🚀 ", "🚀 ") : currentName.replace("🚀 ", "🔒 🚀 ");

    await voiceChannel.setName(newName);

    await interaction.reply({
      content: isLocked ? "✅ Sala destrancada! Outros usuários agora podem entrar." : "✅ Sala trancada! Apenas você pode permitir quem entra.",
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao trancar/destrancar a sala!",
      ephemeral: true,
    });
  }
}
