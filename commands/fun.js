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