import { SlashCommandBuilder, CommandInteraction, TextChannel, PermissionFlagsBits, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Apaga uma quantidade específica de mensagens do canal")
  .addIntegerOption((option) => option.setName("quantidade").setDescription("Número de mensagens para apagar (máximo 1000)").setRequired(true).setMinValue(1).setMaxValue(1000))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
  // Verificar se o usuário tem permissão de administrador
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
    const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("❌ Erro").setDescription("Você não tem permissão para usar este comando. É necessário ter permissão de Administrador.").setTimestamp();

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  // Obter a quantidade de mensagens a serem apagadas
  const amount = interaction.options.get("quantidade")?.value as number;

  // Verificar se o canal é um canal de texto
  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("❌ Erro").setDescription("Este comando só pode ser usado em canais de texto.").setTimestamp();

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Devido às limitações da API, precisamos deletar em blocos de 100 mensagens
    const channel = interaction.channel as TextChannel;
    let deletedTotal = 0;
    let remaining = amount;

    // O Discord não permite deletar mensagens com mais de 14 dias
    const warningMessage = "⚠️ Mensagens com mais de 14 dias não podem ser apagadas devido a limitações da API do Discord.";

    while (remaining > 0) {
      const toDelete = Math.min(remaining, 100);
      const messages = await channel.messages.fetch({ limit: toDelete });

      // Filtrar mensagens com mais de 14 dias
      const filteredMessages = messages.filter((msg) => {
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        return msg.createdTimestamp > twoWeeksAgo;
      });

      if (filteredMessages.size === 0) break;

      const deleted = await channel.bulkDelete(filteredMessages, true);
      deletedTotal += deleted.size;

      if (deleted.size < toDelete) {
        // Se apagamos menos do que solicitamos, provavelmente chegamos a mensagens antigas
        break;
      }

      remaining -= toDelete;
    }

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("🧹 Limpeza Concluída")
      .setDescription(`${deletedTotal} mensagens foram apagadas.`)
      .setFooter({ text: deletedTotal < amount ? warningMessage : "" })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });

    // Enviar uma mensagem temporária no canal que desaparece após 5 segundos
    const channelNotification = await channel.send({
      embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(`🧹 ${interaction.user} apagou ${deletedTotal} mensagens.`)],
    });

    // Apagar a notificação após 5 segundos
    setTimeout(() => {
      channelNotification.delete().catch(() => {});
    }, 5000);
  } catch (error) {
    console.error("Erro ao apagar mensagens:", error);

    const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("❌ Erro ao apagar mensagens").setDescription("Ocorreu um erro ao tentar apagar as mensagens. Verifique se o bot tem permissões adequadas.").setFooter({ text: "Dica: mensagens com mais de 14 dias não podem ser apagadas em massa." }).setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
