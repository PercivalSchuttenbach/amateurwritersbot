require('dotenv').config(); 
var fs = require('fs');
var Discord = require('discord.js');
var logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var client = new Discord.Client();

var debug = true;

var memory = {
    'AmateurWritersBot':
    {
        'krewlgate':
        {
            'timestamp': null,
            'users': {}
        },
        'writing':
        {
            'start': null,
            'cooldown': null,
            'count': 0
        },
        'ouulbd': false
    }
};

client.commands = {};

var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (var file in commandFiles) {
    const command = require('./commands/' + commandFiles[file]);
    client.commands[command.name] = command;
}

if(client.commands.krewlgate){
    client.commands.krewlgate.init(Discord, client, logger, memory);
}
if(client.commands.callout){
     client.commands.callout.init(client, logger, memory);
}
if(client.commands.fun){
     client.commands.fun.init(Discord, client, logger, memory);
}
if(client.commands.tools){
    client.commands.tools.init(client, logger, memory);
}
if(client.commands.critique){
    client.commands.critique.init(Discord, client, logger, memory);
}
if(client.commands.tictactoe){
    client.commands.tictactoe.init(Discord, client, logger, memory);
}
if(client.commands.hangman){
    client.commands.hangman.init(Discord, client, logger, memory);
}
if(client.commands.connectfour){
    client.commands.connectfour.init(Discord, client, logger, memory);
}

//Make sure all mesages are checked
client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
});

client.on("message", message => {
    
    if(message.author.bot){
        return;
    }

    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch(command){
        case 'ping':
            message.channel.send('pong!');
        break;
        case 'help':
            message.channel.send(message.author.toString() + " I am sending you a DM");
            message.author.send('**~critique help**\n**~random**: will choose one of the masterdoc channels for you to pick a story from and critique.\n**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~hangman**: start a classic party game others can join.\n**~tictactoe @username**: invites the mentioned player for a game of tic tac toe\n**~ouulthululu**: summons the Ouul\n**~motivated**: The Meme\n**~krewlgate**: that which we do not speak of.');
        break;
    }

});

client.login();