import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("renomear")
  .setDescription("Renomeia o canal de voz")
  .addStringOption((option) => option.setName("nome").setDescription("O novo nome para o canal").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  const voiceChannel = (interaction.member as GuildMember)?.voice.channel;
  const newName = interaction.options.getString("nome");

  if (!voiceChannel) {
    return interaction.reply({
      content: "Você precisa estar em um canal de voz para usar este comando!",
      ephemeral: true,
    });
  }

  const permissions = voiceChannel.permissionOverwrites.cache;
  const ownerPermissions = permissions.find((perm) => perm.allow.has("ManageChannels") && perm.id === member?.user.id);

  if (!ownerPermissions) {
    return interaction.reply({
      content: "Você não é o dono deste canal!",
      ephemeral: true,
    });
  }

  try {
    await voiceChannel.setName(`🎮 ${newName}`);
    await interaction.reply({
      content: `Canal renomeado para: 🎮 ${newName}`,
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
