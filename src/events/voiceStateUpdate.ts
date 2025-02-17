import { VoiceState, ChannelType, PermissionsBitField, VoiceChannel, CategoryChannel } from "discord.js";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const generatorChannelId = process.env.VOICE_GENERATOR_CHANNEL;

  if (!generatorChannelId) return;

  const parentChannel = newState.guild.channels.cache.get(generatorChannelId)?.parent;
  const category = parentChannel instanceof CategoryChannel ? parentChannel : null;

  if (category) {
    category.children.cache
      .filter((channel): channel is VoiceChannel => channel instanceof VoiceChannel && channel.id !== generatorChannelId && channel.members.size === 0 && channel.name.startsWith("🚀"))
      .forEach((channel) => {
        channel.delete().catch(console.error);
      });
  }

  if (newState.channelId === generatorChannelId) {
    const guild = newState.guild;
    const member = newState.member;

    if (!guild || !member) return;

    const existingChannel = category?.children.cache.find((channel): channel is VoiceChannel => channel instanceof VoiceChannel && channel.permissionOverwrites.cache.some((perm) => perm.id === member.id && perm.allow.has("ManageChannels")));

    if (existingChannel) {
      await member.voice.setChannel(existingChannel);
      return;
    }

    try {
      const newChannel = await guild.channels.create({
        name: `🚀 ${member.displayName}`,
        type: ChannelType.GuildVoice,
        parent: category,
        userLimit: 10,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseVAD],
          },
          {
            id: guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseVAD],
          },
        ],
      });

      await member.voice.setChannel(newChannel);
    } catch (error) {
      console.error("Erro ao criar canal:", error);
    }
  }
}
