import { Message, PermissionFlagsBits } from 'discord.js';

interface CachedMessage {
	content: string;
	timestamp: number;
}

interface UserMessageCache {
	messages: CachedMessage[];
}

const messageCache = new Map<string, UserMessageCache>();
const lastWarning = new Map<string, number>();

const WARNING_THROTTLE_MS = 5000;

// Configurações do anti-flood
const CONFIG = {
	maxMessages: 5,           // Quantidade de mensagens para analisar
	timeWindow: 10000,        // Janela de tempo em ms (10 segundos)
	similarityThreshold: 0.7, // 70% de similaridade = flood
	minMessageLength: 3,      // Ignora mensagens muito curtas
};

const MAX_INPUT_LENGTH = 200;
const MAX_LENGTH_DIFF_THRESHOLD = 50;

function calculateSimilarity(str1: string, str2: string): number {
	// Trunca inputs para evitar uso excessivo de memória/CPU
	let s1 = str1.slice(0, MAX_INPUT_LENGTH).toLowerCase();
	let s2 = str2.slice(0, MAX_INPUT_LENGTH).toLowerCase();

	if (s1 === s2) return 1;
	if (s1.length === 0 || s2.length === 0) return 0;

	// Early-exit: se diferença de tamanho for muito grande, não são similares
	if (Math.abs(s1.length - s2.length) > MAX_LENGTH_DIFF_THRESHOLD) {
		return 0;
	}

	const matrix: number[][] = [];

	for (let i = 0; i <= s1.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= s2.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= s1.length; i++) {
		for (let j = 1; j <= s2.length; j++) {
			const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost
			);
		}
	}

	const maxLen = Math.max(s1.length, s2.length);
	return 1 - matrix[s1.length][s2.length] / maxLen;
}

function isFlood(userId: string, guildId: string, content: string): boolean {
	const key = `${guildId}:${userId}`;
	const now = Date.now();

	if (content.length < CONFIG.minMessageLength) {
		return false;
	}

	let cache = messageCache.get(key);
	if (!cache) {
		cache = { messages: [] };
		messageCache.set(key, cache);
	}

	// Remove mensagens antigas fora da janela de tempo
	cache.messages = cache.messages.filter(
		(msg) => now - msg.timestamp < CONFIG.timeWindow
	);

	// Verifica similaridade com mensagens recentes
	let similarCount = 0;
	for (const prevMessage of cache.messages) {
		const similarity = calculateSimilarity(content, prevMessage.content);
		if (similarity >= CONFIG.similarityThreshold) {
			similarCount++;
			if (similarCount >= 2) break;
		}
	}

	// Adiciona mensagem atual ao cache
	cache.messages.push({ content, timestamp: now });

	// Mantém apenas as últimas N mensagens
	if (cache.messages.length > CONFIG.maxMessages) {
		cache.messages.shift();
	}

	return similarCount >= 2;
}

export async function handleAntiFlood(message: Message): Promise<void> {
	if (message.author.bot) return;

	if (!message.guild) return;

	if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
		return;
	}

	const content = message.content.trim();

	if (!content) return;

	// Verifica se é flood
	if (isFlood(message.author.id, message.guild.id, content)) {
		try {
			await message.delete();

			const now = Date.now();
			const warningKey = `${message.guild.id}:${message.author.id}`;
			const lastWarnTime = lastWarning.get(warningKey) ?? 0;

			if ('send' in message.channel && now - lastWarnTime >= WARNING_THROTTLE_MS) {
				lastWarning.set(warningKey, now);

				const warning = await message.channel.send({
					content: `**${message.member?.displayName ?? message.author.username}**, evite enviar mensagens repetidas!`,
				});

				setTimeout(() => {
					warning.delete().catch(() => {});
				}, 5000);
			}

			console.log(
				`[Anti-Flood] Mensagem deletada de ${message.author.tag} em ${message.guild.name}`
			);
		} catch (error) {
			console.error('[Anti-Flood] Erro ao processar flood:', error);
		}
	}
}


const cacheCleanupInterval = setInterval(() => {
	const now = Date.now();
	for (const [key, cache] of messageCache.entries()) {
		const hasRecentActivity = cache.messages.some(
			(msg) => now - msg.timestamp < CONFIG.timeWindow * 2
		);
		if (!hasRecentActivity) {
			messageCache.delete(key);
		}
	}

	for (const [userId, timestamp] of lastWarning.entries()) {
		if (now - timestamp > WARNING_THROTTLE_MS * 2) {
			lastWarning.delete(userId);
		}
	}
}, 60000);

export function cleanupAntiFlood(): void {
	clearInterval(cacheCleanupInterval);
	messageCache.clear();
	lastWarning.clear();
}
