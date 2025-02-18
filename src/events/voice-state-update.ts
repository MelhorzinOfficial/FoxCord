import { Events, VoiceState } from 'discord.js';
import { EventImpl } from './impl';

class EventVoiceStateUpdate implements EventImpl<Events.VoiceStateUpdate> {
	type: string = Events.VoiceStateUpdate;

	listener(oldState: VoiceState, newState: VoiceState) {
		console.log('Voice state update');
	}
}

export const eventVoiceStateUpdate = new EventVoiceStateUpdate();
