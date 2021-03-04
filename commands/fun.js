class Fun {

	/**
	* @param resources
	*/	
	constructor({Discord})
	{
		this.embed = new Discord.MessageEmbed();
		this.imgOuulthululu = 'https://cdn.discordapp.com/attachments/559790958238105611/562936235471929356/oothulurises.gif';
		this.imgMotivated = "https://cdn.discordapp.com/attachments/522773675263655983/567039672648204308/gzfy1bez4t311_1.png";
		this.imgMotivatedOuul = "https://media.discordapp.net/attachments/522773675263655983/564112585620979712/OuulMotivated2.png";
		this.ouulId = "396829658739376138";
	}

	/**
	* @param Discord.Message.content
	* @return Object
	*/
	getArgs(content)
	{
		let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		let command = args.shift().toLowerCase();

		return { command, args };
	}

	/**
	* @param Message
	*/
	ouulthululu({channel})
	{
		this.embed.setImage(this.imgOuulthululu);
		channel.send(this.embed);
	}

	/**
	* @param Message
	*/
	motivated({author, channel})
	{
        this.embed.setImage((author.id == this.ouulId) ? this.imgMotivatedOuul : this.imgMotivated);
    	channel.send(this.embed);
	}

	/**
	 * @param {any} args
	 */
	pluckRandomArrayItem(args)
	{
		let intRandom = ~~(Math.random() * args.length);
		return args.splice(intRandom, 1);
	}

	/**
	 * @param Message
	 */
	fmk({content, channel, author})
	{
		let fmk = {'f*':null,'marry':null,'kill':null};
		let { args } = this.getArgs(content);
		let output = '';

		for (let i in fmk) {
			output += `${i}: ${args.length ? this.pluckRandomArrayItem(args) : channel.members.random().nickname} `;
		}
		channel.send(`${author} ${output}`);
    }

}

module.exports = {
  name: 'fun',
  description: 'fun',
  validate: function({author})
  {
  	return !author.bot;
  },
  init: function(resources)
  {
  	return new Fun(resources);
  }
};