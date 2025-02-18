import { CategoryChannel, Events, VoiceChannel, VoiceState } from 'discord.js';
import { env } from '../config/env';
import { EventImpl } from './impl';

class EventVoiceStateUpdate implements EventImpl<Events.VoiceStateUpdate> {
	type: string = Events.VoiceStateUpdate;

	listener(oldState: VoiceState, newState: VoiceState) {
		
		const parentChannel = newState.guild.channels.cache.get(env.VOICE_CHANNEL_GENERATOR_ID);
		const category = parentChannel instanceof CategoryChannel ? parentChannel : null;

		if (category) {
			category.children.cache.filter((channel): channel is VoiceChannel => channel instanceof VoiceChannel && channel.id !== env.VOICE_CHANNEL_GENERATOR_ID && channel.members.size === 0 && channel.name.startsWith("🚀"))
			.forEach((channel) => {channel.delete().catch(console.error);});
		}


	}
}

export const eventVoiceStateUpdate = new EventVoiceStateUpdate();
