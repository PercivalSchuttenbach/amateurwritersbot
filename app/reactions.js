const DEBUG = parseInt(process.env.DEBUG);
const DEBUG_CHANNELS = JSON.parse(process.env.CHANNEL_DEBUG);
const BONK_ROLE_ID = "809364853151367189";
const TIMEOUT = 1000 * 60 * 10;
const BONKS = 3;
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

    async handle(messageReaction, user)
    {
        if (messageReaction && !this.bonkRole) {
            this.bonkRole = await messageReaction.message.guild.roles.fetch(BONK_ROLE_ID);
        }
        if (messageReaction && messageReaction.emoji.id === BONK_EMOJI && messageReaction.count >= BONKS) {
            //messageReaction.message.member.roles.add(this.bonkRole);
            const member = await messageReaction.message.guild.members.fetch(messageReaction.message.author);
            try {
                member.roles.add(this.bonkRole);
                this.jail.push({ member, timestamp: Date.now() + TIMEOUT });
                this.startTicker();
                messageReaction.message.reactions.cache.get(BONK_EMOJI).remove().catch(error => console.error('Failed to remove reactions: ', error));
                messageReaction.message.channel.send(`${member} off to horny jail (#nsfw) with you.`);
            } catch (e) { console.log(e); }
        }
    }

    startTicker()
    {
        setTimeout(this.checkJail.bind(this), TICKER);
    }

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

    set({ Discord, Client})
    {
        this.Discord = Discord;
        this.Client = Client;

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