const { Client } = require('pg');
const DEBUG = parseInt(process.env.DEBUG);
const DEBUG_CHANNELS = JSON.parse(process.env.CHANNEL_DEBUG);

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
		this.toBeSaved = [];
	}

	/**
	* @param Object
	*/
	set(resources)
	{
		this.resources = resources;
	}

	/**
	 * Fetch a previous state from postgres and restore
	 * 
	 * @todo split in to smaller functions
	 **/
	async restore()
	{
		const PgClient = new Client({
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false }
		});

		PgClient.connect();

		const query = {
			text: 'SELECT state FROM states ORDER BY id DESC LIMIT 1',
			rowMode: 'array'
		};

		PgClient.query(query, async (err, res) =>
		{
			if (err) return console.log(err);

			const json = res.rows[0][0];
			const { Client } = this.resources;

			for (var i in json) {
				//create a mock message object; fetch all needed resources for the message
				let message = json[i];
				const { command } = this.getArgs(message);
				message.channel = await Client.channels.fetch(message.channel_id);
				message.author = await Client.users.fetch(message.author_id);
				message.member = await message.channel.members.get(message.author_id);
				message.guild = message.channel.guild;

				if (i == 0) await message.channel.send('Oh my... I seem to have crashed... Now this is embarrassing 😳\nPlease give me a moment while I start things up again.');

				await this.process(command, message, false, true);
			}

			PgClient.end();
		});
	}

	/**
	 * Store executed command to state
	 * 
	 * @param {any} param0
	 */
	async save({content, channel, author})
	{
		this.toBeSaved.push({ content, channel_id: channel.id, author_id: author.id });
		this.storeInDb();	
	}

	/**
	 * Remove all subcommands for given commands from state 
	 *
	 * @param {any} command
	 */
	async clearSaved(command)
	{
		this.toBeSaved = this.toBeSaved.filter(item => item.content.indexOf(command) === -1);
		this.storeInDb();
	}

	/**
	 * Store state in postgress
	 */
    async storeInDb()
	{
		if (DEBUG) return;

		const PgClient = new Client({
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false }
		});

		PgClient.connect();

		PgClient.query(`UPDATE states SET state = '${JSON.stringify(this.toBeSaved)}' WHERE id = 1`, (err, res) =>
		{
			if (err) return console.log(err);
			PgClient.end();
		});
    }


	/**
	* @param Discord.Message.content
	* @return bool
	*/
	validate({content, channel})
	{
		//commpand prefix needs to be in message; if debug enabled we need to be in debug channel
		return content.indexOf(this.prefix) == 0 && (!DEBUG || DEBUG_CHANNELS.includes(channel.id) || channel.type === 'dm');
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

		let { command, args } = this.getArgs(message);
		this.process(command, message);		
	}

	/**
	 * Process command message
	 * 
	 * @param string command
	 * @param Message message
	 * @param bool
	 * @param bool
	 */
	async process(command, message, validate=true, silent=false)
	{
		const commandModel = await this.getModel(command, message, validate);
		if (!commandModel) {
			return;
			//message.channel.send(`Command ${command} does not exist`);
		}
		await commandModel[command](message, silent);
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
    * @param string
    * @param bool
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
	 * Get the commandModel from the this.models using the file as key. A file can have multiple commands.
	 * 
	* @param string command
    * @param Message mesage
    * @param bool validate
    * @return class
	*/
	async getModel(command, message, validate=true)
	{
		const commandFile = this.getCommandRoute(command);
		if (!commandFile) return;

		if (!this.models[commandFile.file]) {
			//require works from current file path
			let commandModel = await require('../commands/' + commandFile.file);
			if (!commandModel || (validate && !commandModel.validate(message))) {
				return;
			}
			this.models[commandFile.file] = await commandModel.init({ ...this.resources, Controller: this });
		}
		return this.models[commandFile.file];
	}

}

module.exports = new Controller();