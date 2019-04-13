function Tools(client, logger, memory){

	function getRandomCritiqueUser(){
	    var userChannels = [];
	    client.channels.forEach(function(channel){
	    	if(channel.parentID == '562283512904941614'){
 				userChannels.push(channel.name);
	    	}
	    });

	    logger.info('Channels:' + userChannels.length);

	    var intRandom = Math.floor(Math.random() * userChannels.length);
	    var user = userChannels[intRandom];

	    logger.info('The winner is:' + user);

	    return user;
	}

	client.on("message", message => {
		if(message.author.bot){
			return;
		}
		var currentTime = +new Date();
		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		switch(command){
			case 'random':
                var userChannel = getRandomCritiqueUser();
                message.channel.send(message.author.toString() + ' your random channel to critique is #' + userChannel + '\ndon\'t forget to mention the corresponding user in #feedback');
            break;
            case 'choose':
                var intRandom = Math.floor(Math.random() * args.length);
                var choice = args[intRandom];
                message.channel.send(message.author.toString() + 'I chose ' + choice + ' for you');
            break;
		}
	});
}

module.exports = {
  name: 'tools',
  description: 'tools',
  init(client, logger, memory){
    tools = new Tools(client, logger, memory);
  }
};