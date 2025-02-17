import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("limite")
  .setDescription("Define o limite de usuários no canal de voz")
  .addIntegerOption((option) => option.setName("quantidade").setDescription("Quantidade de usuários (mínimo 10, máximo 99)").setRequired(true).setMinValue(10).setMaxValue(99));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
    return interaction.reply({
      content: "Você precisa estar em um canal de voz para usar este comando!",
      ephemeral: true,
    });
  }

  if (!voiceChannel.name.startsWith("🎮")) {
    return interaction.reply({
      content: "Este comando só pode ser usado em canais temporários criados pelo sistema!",
      ephemeral: true,
    });
  }

  const permissions = voiceChannel.permissionOverwrites.cache;
  const memberPermissions = permissions.get(member.id);

  if (!memberPermissions?.allow.has("ManageChannels")) {
    return interaction.reply({
      content: "Você não é o dono deste canal!",
      ephemeral: true,
    });
  }

  const limit = interaction.options.getInteger("quantidade", true);

  try {
    await voiceChannel.setUserLimit(limit);
    await interaction.reply({
      content: `Limite de usuários definido para: ${limit}`,
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
