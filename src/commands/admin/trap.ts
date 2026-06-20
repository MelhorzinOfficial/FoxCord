import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } from "discord.js";
import prisma from "../../utils/database";
import { setTrapChannel } from "../../events/guild/messageCreate";

export const data = new SlashCommandBuilder()
  .setName("trap")
  .setDescription("Canal-armadilha anti-bot: castiga 7 dias quem enviar mensagem nele")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .addSubcommand((s) => s.setName("criar").setDescription("Cria o canal-armadilha no topo do servidor"))
  .addSubcommand((s) => s.setName("remover").setDescription("Desativa a armadilha (o canal não é apagado)"));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    return interaction.reply({ content: "Este comando só pode ser usado em um servidor.", flags: 64 });
  }

  const sub = interaction.options.getSubcommand();

  try {
    if (sub === "remover") {
      await prisma.guild.upsert({
        where: { id: interaction.guild.id },
        update: { name: interaction.guild.name, trapChannelId: null },
        create: { id: interaction.guild.id, name: interaction.guild.name },
      });
      setTrapChannel(interaction.guild.id, null);
      return interaction.reply({ content: "🟢 Armadilha desativada. O canal continua existindo — apague manualmente se quiser.", flags: 64 });
    }

    // criar
    const me = interaction.guild.members.me;
    const required = [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ModerateMembers, PermissionsBitField.Flags.ManageMessages];
    if (!me?.permissions.has(required)) {
      return interaction.reply({ content: "Preciso das permissões **Gerenciar Canais**, **Castigar Membros (Moderar Membros)** e **Gerenciar Mensagens** para montar a armadilha.", flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    // Reaproveita o canal-armadilha existente se ainda existir, em vez de criar órfãos
    const existing = await prisma.guild.findUnique({ where: { id: interaction.guild.id }, select: { trapChannelId: true } });
    if (existing?.trapChannelId) {
      const current = await interaction.guild.channels.fetch(existing.trapChannelId).catch(() => null);
      if (current) {
        setTrapChannel(interaction.guild.id, current.id);
        return interaction.editReply({ content: `⚠️ A armadilha já está ativa em ${current}. Use \`/trap remover\` antes de recriar.` });
      }
    }

    const channel = await interaction.guild.channels.create({
      name: "🚫-não-envie-aqui",
      type: ChannelType.GuildText,
      position: 0,
      reason: "Canal-armadilha anti-bot (/trap)",
    });

    const embed = new EmbedBuilder()
      .setTitle("⛔ NÃO ENVIE MENSAGENS NESTE CANAL")
      .setColor("#FF0000")
      .setDescription(
        [
          "Este canal é uma **armadilha anti-bot**.",
          "",
          "Qualquer mensagem enviada aqui resulta em **castigo (mute) automático de 7 dias**, e a mensagem é apagada na hora.",
          "",
          "Usuários reais não têm motivo para escrever aqui. Bots de spam que disparam mensagem em todos os canais caem direto na armadilha.",
          "",
          "**Você foi avisado.**",
        ].join("\n")
      );
    await channel.send({ embeds: [embed] });

    await prisma.guild.upsert({
      where: { id: interaction.guild.id },
      update: { name: interaction.guild.name, trapChannelId: channel.id },
      create: { id: interaction.guild.id, name: interaction.guild.name, trapChannelId: channel.id },
    });
    setTrapChannel(interaction.guild.id, channel.id);

    return interaction.editReply({ content: `✅ Armadilha criada em ${channel}. Quem enviar mensagem lá toma castigo de 7 dias automaticamente.` });
  } catch (error) {
    console.error("Erro no comando trap:", error);
    const payload = { content: "Ocorreu um erro ao configurar a armadilha." };
    return interaction.deferred || interaction.replied ? interaction.editReply(payload) : interaction.reply({ ...payload, flags: 64 });
  }
}
