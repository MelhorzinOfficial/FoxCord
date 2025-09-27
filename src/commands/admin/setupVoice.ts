import { ChatInputCommandInteraction, ChannelType, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import prisma from "../../utils/database";

export const data = new SlashCommandBuilder()
  .setName("setupvoice")
  .setDescription("Configura o sistema de salas de voz")
  .addChannelOption((option) => option.setName("canal").setDescription("Canal de voz que servirá como gerador").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[SETUPVOICE] Comando executado por ${interaction.user.tag} em ${interaction.guild?.name}`);
  
  if (!interaction.guild) {
    console.log(`[SETUPVOICE] Erro: Comando usado fora de servidor`);
    return interaction.reply({
      content: "Este comando só pode ser usado em servidores!",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("canal", true);
  console.log(`[SETUPVOICE] Canal selecionado: ${channel.name} (${channel.id}) - Tipo: ${channel.type}`);

  if (channel.type !== ChannelType.GuildVoice) {
    console.log(`[SETUPVOICE] Erro: Canal não é de voz`);
    return interaction.reply({
      content: "Você precisa selecionar um canal de voz!",
      ephemeral: true,
    });
  }

  try {
    console.log(`[SETUPVOICE] Iniciando upsert para guild ${interaction.guild.id}`);
    
    // Buscar ou criar o registro do servidor
    const result = await prisma.guild.upsert({
      where: { id: interaction.guild.id },
      update: { 
        name: interaction.guild.name,
        voiceGeneratorChannelId: channel.id 
      },
      create: {
        id: interaction.guild.id,
        name: interaction.guild.name,
        voiceGeneratorChannelId: channel.id,
      },
    });
    
    console.log(`[SETUPVOICE] Upsert concluído:`, result);

    // Atualizar a variável de ambiente para compatibilidade com o código existente
    process.env.VOICE_GENERATOR_CHANNEL = channel.id;
    console.log(`[SETUPVOICE] Variável de ambiente atualizada: ${channel.id}`);

    await interaction.reply({
      content: `✅ O canal ${channel.name} foi configurado com sucesso como gerador de salas de voz!`,
      ephemeral: true,
    });
    
    console.log(`[SETUPVOICE] Resposta enviada com sucesso`);
  } catch (error) {
    console.error("[SETUPVOICE] Erro detalhado:", error);
    console.error("[SETUPVOICE] Stack trace:", error.stack);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao configurar o canal gerador de salas de voz.",
      ephemeral: true,
    });
  }
}
