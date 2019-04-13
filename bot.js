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
// if(client.commands.critique){
//     client.commands.critique.init(Discord, client, logger, memory);
// }

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
            message.channel.send(message.author.toString() + ' I agree. But I doubt if I am the right person? :thinking:');
            message.author.send('**~random**: will choose one of the masterdoc channels for you to pick a story from and critique.\n**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~ouulthululu**: summons the Ouul\n**~krewlgate**: that which we do not speak of.');
        break;
    }

});

client.login();