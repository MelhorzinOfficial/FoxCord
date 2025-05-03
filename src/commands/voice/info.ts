import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder().setName("info").setDescription("Mostra informações sobre o canal de voz atual");

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

  // Buscar dados do canal no banco, incluindo o ID do dono
  const channelData = await prisma.voiceChannel.findUnique({
    where: { id: voiceChannel.id },
    select: { ownerId: true, userLimit: true },
  });

  console.log(`[INFO] Dados do Canal DB para ${voiceChannel.id}:`, channelData);
  // Tentar buscar o membro dono
  let ownerMember = null;
  if (channelData?.ownerId) {
    console.log(`[INFO] Tentando buscar membro dono com ID: ${channelData.ownerId}`);
    try {
      ownerMember = await voiceChannel.guild.members.fetch(channelData.ownerId);
      console.log(`[INFO] Membro dono encontrado: ${ownerMember?.user?.tag}`);
    } catch (error) {
      console.error(`[INFO] Erro ao buscar membro dono ${channelData.ownerId}:`, error);
      ownerMember = null; // Garantir que é null se falhar
    }
  } else {
    console.log(`[INFO] Nenhum ownerId encontrado no DB para o canal ${voiceChannel.id}`);
  }

  const embed = new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle(`📊 Informações do Canal ${voiceChannel.name}`)
    .addFields([
      {
        name: "👑 Dono",
        value: ownerMember ? `${ownerMember.displayName} (${ownerMember.user.tag})` : "Não encontrado",
        inline: true,
      },
      {
        name: "👥 Membros",
        value: `${voiceChannel.members.size}/${channelData?.userLimit || voiceChannel.userLimit || "∞"}`,
        inline: true,
      },
      {
        name: "🔊 Bitrate",
        value: `${voiceChannel.bitrate / 1000}kbps`,
        inline: true,
      },
      {
        name: "⏰ Criado em",
        value: `<t:${Math.floor(voiceChannel.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
      {
        name: "👥 Membros Conectados",
        value: voiceChannel.members.size > 0 ? voiceChannel.members.map((m) => `- ${m.displayName}`).join("\n") : "Nenhum membro conectado",
      },
    ])
    .setFooter({ text: `ID do Canal: ${voiceChannel.id}` })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
