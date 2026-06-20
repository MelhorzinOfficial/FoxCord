import { Message } from "discord.js";
import prisma from "../../utils/database";

const TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // castigo de 7 dias (máx do Discord: 28d)

// ponytail: cache em memória por processo; evita uma query no DB a cada mensagem.
// Atualizado pelo comando /trap; em cache-miss carrega do DB uma vez por guilda.
const trapCache = new Map<string, string | null>();

export function setTrapChannel(guildId: string, channelId: string | null) {
  trapCache.set(guildId, channelId);
}

export async function handleMessageCreate(message: Message) {
  if (!message.guild || message.author.bot) return;

  let trapId = trapCache.get(message.guild.id);
  if (trapId === undefined) {
    const data = await prisma.guild.findUnique({
      where: { id: message.guild.id },
      select: { trapChannelId: true },
    });
    trapId = data?.trapChannelId ?? null;
    trapCache.set(message.guild.id, trapId);
  }

  if (!trapId || message.channelId !== trapId) return;

  // Apaga a mensagem da armadilha
  await message.delete().catch(() => {});

  // Castiga o autor por 7 dias (moderatable é false p/ admins e cargos acima do bot)
  const member = message.member ?? (await message.guild.members.fetch(message.author.id).catch(() => null));
  if (member?.moderatable) {
    await member.timeout(TIMEOUT_MS, "Trap anti-bot: enviou mensagem no canal-armadilha.").catch(() => {});
  }
}
