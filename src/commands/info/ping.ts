import { EmbedBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder().setName("ping").setDescription("Mostra o ping do bot, latência e horário do servidor");

export async function execute(interaction: CommandInteraction) {
  const sent = await interaction.deferReply({ fetchReply: true });

  const latency = sent.createdTimestamp - interaction.createdTimestamp;

  const serverTime = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("🏓 Pong!")
    .addFields({ name: "📡 Latência", value: `${latency}ms`, inline: true }, { name: "⌛ API Ping", value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }, { name: "🕒 Horário do Servidor", value: serverTime, inline: true })
    .setFooter({ text: "Bot está online!" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
