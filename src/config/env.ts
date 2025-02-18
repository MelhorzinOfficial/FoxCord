import z from 'zod';

const EnvSchema = z.object({
	DISCORD_TOKEN: z.string(),
	DISCORD_CLIENT_ID: z.string(),
	VOICE_CHANNEL_GENERATOR_ID: z.string(),
	VOICE_CHANNEL_CATEGORY_ID: z.string(),
});

export const env = EnvSchema.parse(process.env);
