require('dotenv').config();

console.log(process.version);

const Discord = require('discord.js');
const Logger = require('./app/logger');
const Memory = require('./app/memory');
const Client = new Discord.Client();
const Controller = require('./app/controller');

Controller.set({ Discord, Logger, Memory, Client });

Client.on("message", Controller.handle.bind(Controller));

Client.on('ready', ()=>{
    //set Status for bot
    Client.user.setActivity('OG: ~help', { type: 'WATCHING' });
});

Client.login(process.env.CLIENT_TOKEN);