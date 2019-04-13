function Fun(Discord, client, logger, memory){

	client.on("message", message => {
		if(message.author.bot){
			return;
		}
		var currentTime = +new Date();
		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		switch(command){
			case 'ouulthululu':
				const embed = new Discord.RichEmbed();
				embed.setImage('https://cdn.discordapp.com/attachments/559790958238105611/562936235471929356/oothulurises.gif');
            	message.channel.send(embed);
            break;
		}
	});
}

module.exports = {
  name: 'fun',
  description: 'fun',
  init(Discord, client, logger, memory){
    fun = new Fun(Discord, client, logger, memory);
  }
};