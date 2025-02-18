import { CacheType, Events, Interaction } from 'discord.js';
import { EventImpl } from './impl';

class EventInteractionCreate implements EventImpl<Events.InteractionCreate> {
	type: string = Events.InteractionCreate;
	listener(interaction: Interaction<CacheType>) {}
}

export const eventInteractionCreate = new EventInteractionCreate();
