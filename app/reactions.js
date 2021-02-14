const DEBUG = parseInt(process.env.DEBUG);
const DEBUG_CHANNELS = JSON.parse(process.env.CHANNEL_DEBUG);
const BONK_ROLE_ID = "809364853151367189";
const TIMEOUT = 1000 * 60 * 10;
const BONKS = 5;
const TICKER = 60000;
const BONK_EMOJI = "808730952381497374";

class Reactions
{

    constructor()
    {
        this.Discord = null;
        this.Client = null;
        this.jail = [];
        this.bonkRole = null;
    }

    /**
     * Handle MessageReactionAdd
     * @param {any} messageReaction
     * @param {any} user
     */
    async handle(messageReaction, user)
    {
        //if there is no messageReaction, then there is nothing to handle
        if (!messageReaction) return;

        if (messageReaction.emoji.id === BONK_EMOJI && messageReaction.count >= BONKS) {
            const bonkRole = await this.getBonkRole(messageReaction.message.guild);
            //get member from Guild members by message author
            const member = await this.getMemberFromMessageReaction(messageReaction);
            try {
                member.roles.add(bonkRole);
                this.jail.push({ member, timestamp: Date.now() + TIMEOUT });
                this.startTicker();
                this.removeBonkReactionFromMessage(messageReaction);
                this.sendMessageToReactionChannel(messageReaction);
            } catch (e) { console.log(e); }
        }
    }

    /**
     * @param {any} messageReaction
     * @return GuildMember
     */
    async getMemberFromMessageReaction(messageReaction)
    {
        const member = await messageReaction.message.guild.members.fetch(messageReaction.message.author);
        return member;
    }

    /**
     * @param {any} messageReaction
     */
    removeBonkReactionFromMessage(messageReaction)
    {
        messageReaction.message.reactions.cache.get(BONK_EMOJI).remove().catch(error => console.error('Failed to remove reactions: ', error));
    }

    /*
     * get BonkRole from guild
     * @param MessageReaction
     * @return GuildRole
     */ 
    async getBonkRole(guild)
    {
        //fet bonk role from the message reaction
        if (!this.bonkRole) {
            this.bonkRole = await guild.roles.fetch(BONK_ROLE_ID);
        }
        return this.bonkRole;
    }

    startTicker()
    {
        setTimeout(this.checkJail.bind(this), TICKER);
    }

    /**
     * Check if jail array has members; iterate over them and remove role were timeout has expired
     * */
    checkJail()
    {
        this.jail.forEach(({ member, timestamp }, index, array) =>
        {
            if (Date.now() > timestamp) {
                member.roles.remove(this.bonkRole);
                array.splice(index, 1);
            }
        });
        if (this.jail.length) this.startTicker();
    }

    /**
     * @param {any} messageReaction
     */
    sendMessageToReactionChannel({message})
    {
        message.channel.send(`${message.author} off to the Corner of Shame with you! <:bonk:808730952381497374>`);
    }

    set({ Discord, Client})
    {
        this.Discord = Discord;
        this.Client = Client;

        this.bindOnRaw();
    }

    /**
     * Emit MessageReactionAdd and MessageReactionRemove on uncached messages
     */
    bindOnRaw()
    {
        const Client = this.Client;
        //Make sure all mesages are checked
        Client.on('raw', async (packet) =>
        {
            // We don't want this to run on unrelated packets
            if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
            // Grab the channel to check the message from
            const channel = await Client.channels.fetch(packet.d.channel_id);
            // There's no need to emit if the message is cached, because the event will fire anyway for that
            if (channel.messages.cache.has(packet.d.message_id)) return;
            // Since we have confirmed the message is not cached, let's fetch it
            channel.messages.fetch(packet.d.message_id).then(async (message) =>
            {
                // This gives us the reaction we need to emit the event properly, in top of the message object
                const reaction = await message.reactions.cache.get(packet.d.emoji.id);
                const user = await Client.users.fetch(packet.d.user_id);
                // Adds the currently reacting user to the reaction's users collection.
                if (reaction) reaction.users.cache.set(packet.d.user_id, user);
                // Check which type of event it is before emitting
                if (packet.t === 'MESSAGE_REACTION_ADD') {
                    Client.emit('messageReactionAdd', reaction, user);
                }
                if (packet.t === 'MESSAGE_REACTION_REMOVE') {
                    Client.emit('messageReactionRemove', reaction, user);
                }
            });
        });
    }
}

module.exports = new Reactions();