require('dotenv').config(); 
var debug = true;
var fs = require('fs');
var logger = require('./logger');
var Discord = require('discord.js');
var memory = require('./memory');
var client = new Discord.Client();

const ALLOWED_CHANNELS = ["703652356566548591", "652184396819857448"];

var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client.commands = [];

for (var file in commandFiles) {
    const model = require('./commands/' + commandFiles[file]);
    client.commands.push( new model(Discord, client, logger, memory) );
}

function checkIfForbiddenToListen(message)
{
     return (message.content.indexOf(process.env.PREFIX) !== 0 || message.author.bot || !ALLOWED_CHANNELS.includes(message.channel.id));
}

client.on("message", message => {
    //let message = {content:'~tictactoe1', author: {bot: false}, channel: {id: "652184396819857448"}};
    
    if(checkIfForbiddenToListen(message)){
        console.log('not allowed to listen');
        return;
    }

    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    let model = client.commands.find(model=>model.command.includes(command));
    if(model)
    {
        console.log('found model');
        model.run(message);
    }

    // switch(command){
    //     case 'ping':
    //         message.channel.send('pong!');
    //     break;
    //     case 'help':
    //         message.channel.send(message.author.toString() + " I am sending you a DM");
    //         message.author.send('**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~hangman**: start a classic party game others can join.\n**~tictactoe @username**: invites the mentioned player for a game of tic tac toe\n**~ouulthululu**: summons the Ouul\n**~motivated**: The Meme');
    //     break;
    // }

});

client.on('ready', ()=>{
    //set Status for bot
    client.user.setActivity('OG: ~help', { type: 'WATCHING' });
});

client.login();