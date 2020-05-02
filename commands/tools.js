class Tools {

	/**
	* @param resources
	*/	
	constructor({Discord})
	{

	}

	/**
	* @param Discord.Message.content
	* @return Object
	*/
	getArgs(content)
	{
		let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		let command = args.shift().toLowerCase();

		return {command, args};
	}

	/**
	* @param Message
	*/
	choose({channel, content, author})
	{
		let {args} = this.getArgs(content);
		let intRandom = Math.floor(Math.random() * args.length);
        let choice = args[intRandom];
        channel.send(author.toString() + ' I chose ' + choice + ' for you');
	}

	/**
	* @param Message
	*/
	ping({channel})
	{
		channel.send('pong!');
	}

	/**
	* @param Message
	*/
	help({channel, author})
	{
		channel.send(author.toString() + " I am sending you a DM");
	    author.send('**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~hangman**: start a classic party game others can join.\n**~tictactoe @username**: invites the mentioned player for a game of tic tac toe\n**~ouulthululu**: summons the Ouul\n**~motivated**: The Meme');
	}
}

module.exports = {
  name: 'tools',
  description: 'tools',
  validate: function({author})
  {
  	return !author.bot;
  },
  init(resources){
    return new Tools(resources);
  }
};