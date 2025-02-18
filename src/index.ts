import { Client } from 'discord.js';
import { env } from './config/env';
import { intents } from './config/intents';
import * as allEvents from './events';
import { EventImpl, RegisteredEvents } from './events/impl';
import { getObjectImports } from './utils/object-imports';

const client = new Client({ intents });

const events = getObjectImports<EventImpl<RegisteredEvents>>(allEvents);

for (const event of events) {
	console.log(`Registering event: ${event.type}`);
	client.on(event.type, event.listener);
}

client.login(env.DISCORD_TOKEN);
