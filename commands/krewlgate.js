function Krewlgate(client, logger, memory){
  var krewlimage = 'https://cdn.discordapp.com/attachments/522773675263655983/561929502087970818/unknown.png';

  function krewlGateHasBeencalled(userId, currentTime, channel){
      var krewlgateMemory = memory['AmateurWritersBot'].krewlgate;

      if(!krewlgateMemory.timestamp || (currentTime - krewlgateMemory.timestamp) >= 3600000){
          krewlgateMemory.timestamp = currentTime;
          krewlgateMemory.users = {};
      }
      else {
          //set user count to 0
          if(!krewlgateMemory.users[userId]){
              krewlgateMemory.users[userId] = 0;
          }
          //if the user used the command 7 times, reset
          if(krewlgateMemory.users[userId]==3){
              krewlgateMemory.users[userId] = 0;
          }
          krewlgateMemory.users[userId]++;
          //call the user out for being an ass
          switch(krewlgateMemory.users[userId]){
              case 1:
                  channel.send('<@' + userId +'> stop harrasing the poor boy.');
              break;
                  channel.send('<@' + userId +'> you deaf?');
              break;
              case 3:
                  channel.send('Mom! <@' + userId +'> is picking on Krewl again!');
              break;
          }
      }
  }

  function checkForKrewlGate(userId, content, currentTime, channel){
      if(content.toLowerCase().indexOf(krewlimage) > -1){
          logger.info('Krewlgate image detected');
          krewlGateHasBeencalled(userId, currentTime, channel);
      }
  }

  this.call = function(userId, channel){
      var currentTime = +new Date();

      var krewlgateMemory = memory['AmateurWritersBot'].krewlgate;
      if(!krewlgateMemory.timestamp || (currentTime - krewlgateMemory.timestamp) >= 3600000){
          channel.send(krewlimage)
      }

      krewlGateHasBeencalled(userId, currentTime, channel);
  }

  //listeners
  client.on("message", message => {
      if(message.author.bot){
        return;
      }
      const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
      const command = args.shift().toLowerCase();
      var currentTime = +new Date();
      if(command=='krewlgate'){
        krewl.call(message.author.id, message.channel);
      }

      checkForKrewlGate(message.author.id, message.content, currentTime, message.channel);
  });

  //krewl retalliaton
  client.on("messageReactionAdd", function(messageReaction, user){
    if(!user.bot && messageReaction.message.author.id == "562331981007028237"){
        if(user.id=="180006018837774336" && messageReaction.emoji.identifier == "%E2%9D%A4"){
          if(messageReaction.message.content.indexOf(krewlimage) > -1){
            messageReaction.message.edit("I :heart: my boy " + user.toString() + " We bots stand united.");
          }
        }
    }
  });

}

var krewl;

module.exports = {
  name: 'krewlgate',
  description: 'krewlgate',
  init(client, logger, memory){
    krewl = new Krewlgate(client, logger, memory);
  }
};