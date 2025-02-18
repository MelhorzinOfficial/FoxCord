import { ClientEvents, Events } from 'discord.js';

export interface EventImpl<T extends keyof ClientEvents> {
	type: string;
	listener(...args: ClientEvents[T]): any;
}

export type RegisteredEvents =
	| Events.ClientReady
	| Events.MessageCreate
	| Events.InteractionCreate
	| Events.VoiceStateUpdate;
