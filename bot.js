var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var memory = {};

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
    var currentTime = +new Date();

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
                    message: user + ' your random channel to critique is #' + userChannel + '\ndon\'t forget to mention the corresponding user in #feedback'
                });
            break;
            // Just add any case commands if you want to..
         }
     }
     else{
        if(channelID=='522773675263655983' && user != 'AmateurWritersBot'){
            if(message.toLowerCase().search('writing') > -1 || message.toLowerCase().search('write') > -1){
                if(!memory[user]){
                    memory[user] = { 'writing': {timestamp: null, count: 0} };
                }
                if(!memory[user]['writing']){
                    memory[user]['writing'] = {timestamp: null, count: 0};
                }
                if(memory[user]['writing'].timestamp && (currentTime - memory[user]['writing'].timestamp) >= 3600000){
                    if(memory[user].writing.count != 5){
                        memory[user].writing.count++;
                    }else{
                        bot.sendMessage({
                            to: channelID,
                            message: user + ' writing writing al you talk about is writing. When are you going to start :thinking: '
                        });

                        memory[user].writing.timestamp = +new Date();
                        
                        // make sure it's not fired again for at least an hour
                    }
                }
            }
        }
     }
});