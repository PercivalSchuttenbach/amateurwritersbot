const DEBUG = parseInt(process.env.DEBUG);
const DEBUG_CHANNELS = JSON.parse(process.env.CHANNEL_DEBUG);
const BONK_ROLE_ID = "809364853151367189";
const TIMEOUT = 1000 * 60 * (DEBUG ? 1 : 10);
const INCREMENT = 1000 * 60 * (DEBUG ? 1 : 5);
const BONKS = DEBUG ? 1: 5;
const TICKER = 60000;
const BONK_EMOJI = DEBUG ? "647524411729117195" : "808730952381497374";/*debug is block emoji*/

class Reactions
{

    constructor()
    {
        this.Discord = null;
        this.Client = null;
        this.jail = [];
        this.bonkRole = null;
        this.ticker = null;
    }

    /**
     * Handle MessageReactionAdd
     * @param {any} messageReaction
     * @param {any} user
     */
    async handle(messageReaction, user)
    {
        console.log(messageReaction);
        //if there is no messageReaction, then there is nothing to handle
        if (!messageReaction) return;

        const member = await this.getMemberFromMessageReaction(messageReaction);

        if (messageReaction.emoji.id === BONK_EMOJI && messageReaction.count >= BONKS) {
            this.removeBonkReactionFromMessage(messageReaction);
            if (this.incrementJailTime(member, messageReaction)) return;
            this.addToJail(messageReaction, member);
        }
    }

    /**
     * @param {any} guildmember
     */
    incrementJailTime(guildmember, { message })
    {
        const jailed = this.jail.find(({ member }) => member.id === guildmember.id);
        if (jailed) {
            jailed.timestamp += INCREMENT;
            let timeleft = Math.ceil((jailed.timestamp - Date.now()) / 60000);
            message.channel.send(`${message.author} shame time increased! <:bonk:808730952381497374>. Time remaining: ${timeleft} minutes.`);
        }
        return jailed;
    }

    /**
     * @param {any} messageReaction
     * @param {any} member
     */
    async addToJail(messageReaction, member)
    {
        const bonkRole = await this.getBonkRole(messageReaction.message.guild);
        try {
            member.roles.add(bonkRole);
            this.jail.push({ member, timestamp: Date.now() + TIMEOUT, messageReaction });
            this.startTicker();
            this.sendMessageToReactionChannel(messageReaction);
        } catch (e) { console.log(e); }
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
    async removeBonkReactionFromMessage(messageReaction)
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
        //get bonk role from the message reaction
        if (!this.bonkRole) {
            this.bonkRole = await guild.roles.fetch(BONK_ROLE_ID);
        }
        return this.bonkRole;
    }

    /*
     * Check every N seconds if members can be let out of jail
     */
    startTicker()
    {
        if (this.ticker) return;
        this.ticker = setTimeout(this.checkJail.bind(this), TICKER);
    }

    /**
     * @param {any} param0
     * @param {any} index
     * @param {any} array
     */
    removeMemberFromJail({ member, timestamp }, index, array)
    {
        if (Date.now() > timestamp) {
            member.roles.remove(this.bonkRole);
            array.splice(index, 1);
        }
    }

    /**
     * Check if jail array has members; iterate over them and remove role were timeout has expired
     * */
    checkJail()
    {
        clearTimeout(this.ticker);
        this.ticker = null;

        this.jail.forEach(this.removeMemberFromJail.bind(this));

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