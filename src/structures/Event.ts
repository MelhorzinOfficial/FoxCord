import { ClientEvents } from "discord.js";
import { BotClient } from "./BotClient";

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: BotClient, ...args: ClientEvents[K]) => Promise<void> | void;
}
