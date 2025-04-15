import { ChatInputCommandInteraction, ChannelType, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("setupvoice")
  .setDescription("Configura o sistema de salas de voz")
  .addChannelOption((option) => option.setName("canal").setDescription("Canal de voz que servirá como gerador").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "Este comando só pode ser usado em servidores!",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("canal", true);

  if (channel.type !== ChannelType.GuildVoice) {
    return interaction.reply({
      content: "Você precisa selecionar um canal de voz!",
      ephemeral: true,
    });
  }

  try {
    // Buscar ou criar o registro do servidor
    const guild = await prisma.guild.upsert({
      where: { id: interaction.guild.id },
      update: { voiceGeneratorChannelId: channel.id },
      create: {
        id: interaction.guild.id,
        name: interaction.guild.name,
        voiceGeneratorChannelId: channel.id,
      },
    });

    // Atualizar a variável de ambiente para compatibilidade com o código existente
    process.env.VOICE_GENERATOR_CHANNEL = channel.id;

    await interaction.reply({
      content: `✅ O canal ${channel.name} foi configurado com sucesso como gerador de salas de voz!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Erro ao configurar canal gerador:", error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao configurar o canal gerador de salas de voz.",
      ephemeral: true,
    });
  }
}
