import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";

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

  // Encontra o dono do canal
  const owner = voiceChannel.permissionOverwrites.cache.find((perm) => perm.allow.has("ManageChannels") && perm.id !== voiceChannel.guild.id);

  const ownerMember = owner ? await voiceChannel.guild.members.fetch(owner.id) : null;

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
        value: `${voiceChannel.members.size}/${voiceChannel.userLimit || "∞"}`,
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
