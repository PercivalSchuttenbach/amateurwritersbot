function Tools(client, logger, memory){
	client.on("message", message => {
		if(message.author.bot){
			return;
		}
		var currentTime = +new Date();
		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		switch(command){
            case 'choose':
                var intRandom = Math.floor(Math.random() * args.length);
                var choice = args[intRandom];
                message.channel.send(message.author.toString() + ' I chose ' + choice + ' for you');
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