var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

function getRandomCritiqueUser(){
    var userChannels = [];
    for(var c in bot.channels){
        if(bot.channels[c].parent_id == '562283512904941614'){
            userChannels.push(bot.channels[c].name);
        }
    }

    logger.info('Channels:' + userChannels.length);

    var intRandom = Math.floor(Math.random() * userChannels.length);
    var user = userChannels[intRandom];

    logger.info('The winner is:' + user);

    return user;
}

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '~') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            case 'random':
                var userChannel = getRandomCritiqueUser();
                bot.sendMessage({
                    to: channelID,
                    message: user + ' your random channel to critique is #' + userChannel
                });
                bot.sendMessage({
                    to: channelID,
                    message: 'don\'t forget to mention the corresponding user in #feedback'
                });
                //FUss
            break;
            // Just add any case commands if you want to..
         }
     }
});