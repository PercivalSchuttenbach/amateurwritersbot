const SNAPSHOT_KEYS = ['models','listeners'];

/**
* Controller determines to with file the command is delegated
*/
class Controller {

	constructor()
	{
		//@var {module:{file:"",commands:[]}}
		this.commands = require('../app/commands');
		this.prefix = process.env.PREFIX;
		this.models = [];
		this.listeners = [];
		this.resources = null;
	}

	/**
	* @param Object
	*/
	set(resources)
	{
		this.resources = resources;
	}

	/**
	* @param Discord.Message.content
	* @return bool
	*/
	validate({content, channel})
	{
		//commpand prefix needs to be in message; if debug enabled we need to be in debug channel
 		return content.indexOf(this.prefix) == 0 && (!parseInt(process.env.DEBUG) || process.env.CHANNEL_DEBUG == channel.id);
	}

	/**
	* @param Discord.Message.content
	* @return Object
	*/
	getArgs({content})
	{
		let args = content.slice(this.prefix.length).trim().split(/ +/g);
		let command = args.shift().toLowerCase();

		return {command, args};
	}

	/**
	* @param Discord.Message
	*/
	handle(message)
	{
		this.listen(message);

		if(!this.validate(message)) return;

		let {command, args} = this.getArgs(message);

		if(!this.models[command])
		{
			let commandModel = this.getModel(command);
			if(!commandModel || !commandModel.validate(message))
			{
				return;
			}
			this.models[command] = commandModel.init({...this.resources, message, Controller: this});
		}
		this.models[command][command](message);
	}

	/**
	* @param Discord.message
	*/
	listen(message)
	{	
		let {content, channel, author} = message;
		//do not listen to self
		if(author.id == this.resources.Client.user.id){
			return;
		}
		//loop through listeners
		this.listeners.forEach(({phrase, channelId, bot, callback})=>{
			if(channelId == channel.id && author.bot == bot && content.search(phrase) > -1)
			{
				callback(message);
				return;
			}
		});
	}

	/**
	* @param string
	* @param Fn
	*/
	listenTo(phrase, channelId, bot, callback)
	{
		const listenerId = this.listeners.length;
		this.listeners.push({id: listenerId, phrase, channelId, bot, callback});
		return listenerId;
	}

	/**
	* @param string
	*/
	stopListeningTo(listenerId)
	{
		this.listeners = this.listeners.filter(({id})=>id!=listenerId);
	}

	/**
	* @param string command
	* @return {file,commands}
	*/
	getCommandRoute(command)
	{
		return this.commands.find(com=>com.commands.indexOf(command) > -1);
	}

	/**
	 * Take a snap shot of Objects currently loaded in memory and save to file
	 */
	takeSnapshot()
	{
		let snapshot = JSON.stringify(SNAPSHOT_KEYS.map(key => this[key]));
		console.log(snapshot);
    }

	/**
	* @param string command
	*/
	getModel(command)
	{
		//@var string
		let commandFile = this.getCommandRoute(command);
		if(commandFile)
		{
			//require works from current file path
			return require('../commands/' + commandFile.file);
		}
	}

}

module.exports = new Controller();