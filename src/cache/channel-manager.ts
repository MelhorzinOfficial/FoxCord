import NodeCache from "node-cache"

export type ChannelModerator = {
    channelId: string
    ownerId: string
    moderators: string[]
    bans: string[]
}


class CacheChannelManager {

    cache: NodeCache

    constructor() {
        this.cache = new NodeCache()
    }

    create(channelId: string, ownerId: string) {
        this.cache.set(channelId, {
            channelId,
            ownerId,
            moderators: [],
            bans: []
        })
    }

    delete(channelId: string) {
        this.cache.del(channelId)
    }

    get(channelId: string): ChannelModerator {
        const channel = this.cache.get(channelId)
        if (!channel) {
            throw new Error(`Channel with ID ${channelId} not found`)
        }
        return channel as ChannelModerator
    }

    ban(channelId: string, userId: string) {
        const channel = this.get(channelId)
        channel.bans.push(userId)
        this.cache.set(channelId, channel)
    }

    unban(channelId: string, userId: string) {
        const channel = this.get(channelId)
        channel.bans = channel.bans.filter(ban => ban !== userId)
        this.cache.set(channelId, channel)
    }

    addModerator(channelId: string, userId: string) {
        const channel = this.get(channelId)
        channel.moderators.push(userId)
        this.cache.set(channelId, channel)
    }

    removeModerator(channelId: string, userId: string) {
        const channel = this.get(channelId)
        channel.moderators = channel.moderators.filter(mod => mod !== userId)
        this.cache.set(channelId, channel)
    }
    
    changeOwner(channelId: string, userId: string) {
        const channel = this.get(channelId)
        channel.ownerId = userId
        this.cache.set(channelId, channel)
    }

}

export const cacheChannelManager = new CacheChannelManager()