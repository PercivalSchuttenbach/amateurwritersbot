require('dotenv').config();

console.log(process.version);

const Discord = require('discord.js');
const Logger = require('./app/logger');
const Memory = require('./app/memory');
const Client = new Discord.Client();
const Controller = require('./app/controller');

const ResourceManager = require('./models/ResourceManager.js');
const UserManagerClass = require('./models/UserManager.js');

async function init()
{
    await ResourceManager.authenticateWithGoogle();
    const UserManager = new UserManagerClass(ResourceManager);
    await UserManager.getUsers();

    Controller.set({ Discord, Logger, Memory, Client, UserManager, ResourceManager });

    Client.on("message", Controller.handle.bind(Controller));

    Client.on('ready', () =>
    {
        //set Status for bot
        Client.user.setActivity('OG: ~help', { type: 'WATCHING' });
        if (!parseInt(process.env.DEBUG)) Controller.restore.bind(Controller).call();
    });

    Client.login(process.env.CLIENT_TOKEN);
}

init();