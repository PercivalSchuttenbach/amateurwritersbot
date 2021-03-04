require('dotenv').config();

console.log(process.version);

const Discord = require('discord.js');
const Logger = require('./app/logger');
const Memory = require('./app/memory');
const Intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
Intents.add('GUILD_MEMBERS');
Intents.add('GUILD_PRESENCES');
const Client = new Discord.Client({ ws: { intents: Intents } });
const Controller = require('./app/controller');
const Reactions = require('./app/reactions');

const ResourceManager = require('./models/ResourceManager.js');
const UserManagerClass = require('./models/UserManager.js');

async function init()
{
    await ResourceManager.authenticateWithGoogle();
    const UserManager = new UserManagerClass(ResourceManager);
    await UserManager.getUsers();

    let resources = { Discord, Logger, Memory, Client, UserManager, ResourceManager };

    Controller.set(resources);
    Reactions.set(resources);

    Client.on("message", Controller.handle.bind(Controller));
    Client.on("messageReactionAdd", Reactions.handle.bind(Reactions));

    Client.on('ready', () =>
    {
        //set Status for bot
        Client.user.setActivity('OG: ~help', { type: 'WATCHING' });
        if (!parseInt(process.env.DEBUG)) Controller.restore.bind(Controller).call();
    });

    Client.login(process.env.CLIENT_TOKEN);
}

init();