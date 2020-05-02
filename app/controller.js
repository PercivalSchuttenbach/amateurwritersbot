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
 		return content.indexOf(this.prefix) == 0 && (!process.env.DEBUG || process.env.CHANNEL_DEBUG == channel.id);
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
		if(!this.validate(message)) return;

		let {command, args} = this.getArgs(message);

		if(!this.models[command])
		{
			let commandModel = this.getModel(command);
			if(commandModel && commandModel.validate(message))
			{
				this.models[command] = commandModel.init({...this.resources, message});
			}
		}
		this.models[command][command](message);
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