import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";

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

  if (!targetMember) {
    return interaction.reply({
      content: "Membro não encontrado!",
      ephemeral: true,
    });
  }

  if (!(targetMember instanceof GuildMember) || !targetMember.voice?.channelId || targetMember.voice.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "O membro precisa estar no mesmo canal de voz que você!",
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
    await voiceChannel.permissionOverwrites.edit(member!.user.id, {
      ManageChannels: false,
      MoveMembers: false,
      MuteMembers: false,
      DeafenMembers: false,
    });

    await voiceChannel.permissionOverwrites.edit(targetMember.id, {
      ManageChannels: true,
      MoveMembers: true,
      MuteMembers: true,
      DeafenMembers: true,
    });

    await interaction.reply({
      content: `A propriedade do canal foi transferida para ${targetMember}!`,
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
