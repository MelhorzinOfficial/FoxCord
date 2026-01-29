import { Message, PermissionFlagsBits } from 'discord.js';

interface UserMessageCache {
	messages: string[];
	timestamps: number[];
}

const messageCache = new Map<string, UserMessageCache>();

// Configurações do anti-flood
const CONFIG = {
	maxMessages: 5,           // Quantidade de mensagens para analisar
	timeWindow: 10000,        // Janela de tempo em ms (10 segundos)
	similarityThreshold: 0.7, // 70% de similaridade = flood
	minMessageLength: 3,      // Ignora mensagens muito curtas
};

function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase();
	const s2 = str2.toLowerCase();

	if (s1 === s2) return 1;
	if (s1.length === 0 || s2.length === 0) return 0;

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

	// Obtém ou cria cache do usuário
	let cache = messageCache.get(key);
	if (!cache) {
		cache = { messages: [], timestamps: [] };
		messageCache.set(key, cache);
	}

	// Remove mensagens antigas fora da janela de tempo
	const validIndices: number[] = [];
	cache.timestamps.forEach((timestamp, index) => {
		if (now - timestamp < CONFIG.timeWindow) {
			validIndices.push(index);
		}
	});

	cache.messages = validIndices.map(i => cache!.messages[i]);
	cache.timestamps = validIndices.map(i => cache!.timestamps[i]);

	// Verifica similaridade com mensagens recentes
	let similarCount = 0;
	for (const prevMessage of cache.messages) {
		const similarity = calculateSimilarity(content, prevMessage);
		if (similarity >= CONFIG.similarityThreshold) {
			similarCount++;
		}
	}

	// Adiciona mensagem atual ao cache
	cache.messages.push(content);
	cache.timestamps.push(now);

	// Mantém apenas as últimas N mensagens
	if (cache.messages.length > CONFIG.maxMessages) {
		cache.messages.shift();
		cache.timestamps.shift();
	}

	// Se 3 ou mais mensagens similares na janela de tempo = flood
	return similarCount >= 2;
}

export async function handleAntiFlood(message: Message): Promise<void> {
	// Ignora bots
	if (message.author.bot) return;

	// Ignora DMs
	if (!message.guild) return;

	// Ignora mensagens de moderadores/admins
	if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
		return;
	}

	const content = message.content.trim();

	// Ignora mensagens vazias (apenas attachments, embeds, etc.)
	if (!content) return;

	// Verifica se é flood
	if (isFlood(message.author.id, message.guild.id, content)) {
		try {
			await message.delete();

			if ('send' in message.channel) {
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


setInterval(() => {
	const now = Date.now();
	for (const [key, cache] of messageCache.entries()) {
		const hasRecentActivity = cache.timestamps.some(
			ts => now - ts < CONFIG.timeWindow * 2
		);
		if (!hasRecentActivity) {
			messageCache.delete(key);
		}
	}
}, 60000);
