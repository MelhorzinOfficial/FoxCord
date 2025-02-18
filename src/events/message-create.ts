import { Events, Message, OmitPartialGroupDMChannel } from 'discord.js';
import { EventImpl } from './impl';

class EventMessageCreate implements EventImpl<Events.MessageCreate> {
	type: string = Events.MessageCreate;

	listener(message: OmitPartialGroupDMChannel<Message<boolean>>) {
		if (message.content === 'ping') {
			message.reply('pong');
		}
	}
}

export const eventMessageCreate = new EventMessageCreate();
