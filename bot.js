var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
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
        }
    }
};

function krewlGateHasBeencalled(user, currentTime, channelID){
    var krewlgateMemory = memory['AmateurWritersBot'].krewlgate;

    if(!krewlgateMemory.timestamp || (currentTime - krewlgateMemory.timestamp) >= 3600000){
        krewlgateMemory.timestamp = currentTime;
        krewlgateMemory.users = {};
    }
    else {
        //set user count to 0
        if(!krewlgateMemory.users[user]){
            krewlgateMemory.users[user] = 0;
        }
        //if the user used the command 7 times, reset
        if(krewlgateMemory.users[user]==7){
            krewlgateMemory.users[user] = 0;
        }
        krewlgateMemory.users[user]++;
        //call the user out for being an ass
        switch(krewlgateMemory.users[user]){
            case 1:
                bot.sendMessage({
                    to: channelID,
                    message: user + ' stop harrasing the poor boy.'
                });
            break;
            case 2:
                bot.sendMessage({
                    to: channelID,
                    message: user + ' you deaf?'
                });
            break;
            case 3:
                bot.sendMessage({
                    to: channelID,
                    message: 'Mom! ' + user + ' is picking on Krewl again!'
                });
            break;
        }
    }
}

function krewlGate(user, channelID, currentTime){
    var krewlgateMemory = memory['AmateurWritersBot'].krewlgate;
    if(!krewlgateMemory.timestamp || (currentTime - krewlgateMemory.timestamp) >= 3600000){
        bot.sendMessage({
            to: channelID,
            message: 'https://cdn.discordapp.com/attachments/522773675263655983/561929502087970818/unknown.png'
        });
        krewlGateHasBeencalled(user, currentTime, channelID);
    }
    else
    {
        krewlGateHasBeencalled(user, currentTime, channelID);
    }

}

function checkForKrewlGate(user, message, currentTime, channelID){
    if(message.toLowerCase().indexOf('https://cdn.discordapp.com/attachments/522773675263655983/561929502087970818/unknown.png') > -1){
        logger.info('Krewlgate image detected');
        krewlGateHasBeencalled(user, currentTime, channelID);
    }
}

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

//have it check witihin the scope of 15 minutes for to much talk about writing
function writingCallOut(user, message, currentTime, channelID){
    logger.info('Writing callout check');
    //when writing or write is detected run. Writing or Write should be at the start of the word
    if(message.toLowerCase().search('\\bwriting') > -1 || message.toLowerCase().search('\\bwrite') > -1){
        //check if memory storage is available
        if(!memory['AmateurWritersBot']['writing']){
            memory['AmateurWritersBot']['writing'] = { start: null, count: 0, cooldown: null };
            logger.info('Created memory store');
        }
        var writingMemory = memory['AmateurWritersBot']['writing'];
        //make sure it's non-obtrusive, run once every hour
        if( !writingMemory.cooldown || (currentTime >= writingMemory.cooldown) ){
            //reset start and counter when banter is not resumed within 15 minutes
            if( !writingMemory.start || (currentTime - writingMemory.start) > (60 * 15 * 1000) ){
                writingMemory.count = 0;
                writingMemory.start = currentTime;
            }

            //keep incrementing if not yet counted banter 4 times
            if(writingMemory.count != 4){
                writingMemory.count++;
                logger.info('Incremented writing for user: ' + user);
            }else{
                logger.info('All talk');
                bot.sendMessage({
                    to: channelID,
                    message: 'All you guys talk about is writing. When are you going to start? :thinking: '
                });

                // make sure it's not fired again for at least an hour
                writingMemory.cooldown = currentTime + (60 * 60 * 1000);
                writingMemory.count = 0;
            }
        }
    }
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

    //testing
    if(channelID=='562335386970357779' && user != 'AmateurWritersBot'){
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
                case 'krewlgate':
                    krewlGate(user, channelID, currentTime);
                break;
             }
        }
        else {
            writingCallOut(user, message, currentTime, channelID);
            checkForKrewlGate(user, message, currentTime, channelID);
        }
    }

    if(channelID=='522773675263655983' && user != 'AmateurWritersBot'){
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
                case 'krewlgate':
                    krewlGate(user, channelID, currentTime);
                break;
             }
         }
         else{
            //522773675263655983
            writingCallOut(user, message, currentTime, channelID);
            checkForKrewlGate(user, message, currentTime, channelID);
         }
     }
});