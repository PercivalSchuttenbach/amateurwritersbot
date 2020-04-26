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
            case 'ping':
	            message.channel.send('pong!');
	        break;
	        case 'help':
	            message.channel.send(message.author.toString() + " I am sending you a DM");
	            message.author.send('**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~hangman**: start a classic party game others can join.\n**~tictactoe @username**: invites the mentioned player for a game of tic tac toe\n**~ouulthululu**: summons the Ouul\n**~motivated**: The Meme');
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