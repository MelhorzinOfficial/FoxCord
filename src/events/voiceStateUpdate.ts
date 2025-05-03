import { VoiceState, ChannelType, PermissionsBitField, VoiceChannel, CategoryChannel } from "discord.js";
import prisma from "../utils/database";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  try {
    const guild = newState.guild;

    // Buscar configuração do servidor no banco de dados
    const guildData = await prisma.guild.findUnique({
      where: { id: guild.id },
      select: { voiceGeneratorChannelId: true, defaultUserLimit: true },
    });

    // Se não houver configuração ou canal gerador, não faz nada
    if (!guildData?.voiceGeneratorChannelId) return;

    const generatorChannelId = guildData.voiceGeneratorChannelId;
    const defaultUserLimit = guildData.defaultUserLimit ?? 25;
    const parentChannel = guild.channels.cache.get(generatorChannelId)?.parent;
    const category = parentChannel instanceof CategoryChannel ? parentChannel : null;

    // Deletar canais vazios (exceto o gerador)
    if (category) {
      const emptyChannels = category.children.cache.filter((channel): channel is VoiceChannel => channel instanceof VoiceChannel && channel.id !== generatorChannelId && channel.members.size === 0 && channel.name.startsWith("🚀"));

      for (const channel of emptyChannels.values()) {
        try {
          // Remover do banco de dados
          await prisma.voiceChannel.deleteMany({
            where: { id: channel.id },
          });

          // Deletar o canal do Discord
          await channel.delete();
          console.log(`Canal deletado: ${channel.name}`);
        } catch (error) {
          console.error(`Erro ao deletar canal ${channel.name}:`, error);
        }
      }
    }

    // Se o usuário entrou no canal gerador
    if (newState.channelId === generatorChannelId) {
      const member = newState.member;
      if (!member) return;

      // Verificar se o usuário já tem um canal
      const existingUserChannel = await prisma.voiceChannel.findFirst({
        where: {
          guildId: guild.id,
          ownerId: member.id,
        },
      });

      // Se já existir um canal para este usuário, mover para o canal existente
      if (existingUserChannel) {
        const discordChannel = guild.channels.cache.get(existingUserChannel.id) as VoiceChannel;
        if (discordChannel) {
          await member.voice.setChannel(discordChannel);
          return;
        } else {
          // Se o canal não existir mais no Discord, remover do banco
          await prisma.voiceChannel.delete({
            where: { id: existingUserChannel.id },
          });
        }
      }

      try {
        // Buscar ou criar usuário no banco
        const user = await prisma.user.upsert({
          where: { id: member.id },
          update: { username: member.user.username },
          create: {
            id: member.id,
            username: member.user.username,
            guildId: guild.id,
          },
        });

        // Criar novo canal de voz
        const newChannel = await guild.channels.create({
          name: `🚀 ${member.displayName}`,
          type: ChannelType.GuildVoice,
          parent: category,
          userLimit: defaultUserLimit,
          bitrate: 384000,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseVAD],
            },
            {
              id: guild.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.UseVAD],
            },
          ],
        });

        // Registrar o canal no banco de dados
        await prisma.voiceChannel.create({
          data: {
            id: newChannel.id,
            name: newChannel.name,
            guildId: guild.id,
            ownerId: member.id,
            userLimit: defaultUserLimit,
          },
        });

        // Mover o usuário para o novo canal
        await member.voice.setChannel(newChannel);
      } catch (error) {
        console.error("Erro ao criar canal:", error);
      }
    }

    // Se o usuário saiu de um canal que ele é dono, verificar se ficou vazio
    if (oldState.channel && oldState.channel.id !== generatorChannelId) {
      // Verificar se este canal é um canal gerenciado pelo bot
      const channelData = await prisma.voiceChannel.findUnique({
        where: { id: oldState.channelId! },
      });

      if (channelData && oldState.channel.members.size === 0) {
        try {
          // Remover do banco de dados
          await prisma.voiceChannel.delete({
            where: { id: oldState.channelId! },
          });

          // Deletar o canal
          await oldState.channel.delete();
          console.log(`Canal deletado após ficar vazio: ${oldState.channel.name}`);
        } catch (error) {
          console.error(`Erro ao deletar canal vazio ${oldState.channel.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Erro ao processar mudança de canal de voz:", error);
  }
}
