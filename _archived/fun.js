function Fun(Discord, client, logger, memory){

	client.on("message", message => {
		if(message.author.bot){
			return;
		}
		var currentTime = +new Date();
		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		const embed = new Discord.RichEmbed();

		switch(command){
			case 'ouulthululu':
				embed.setImage('https://cdn.discordapp.com/attachments/559790958238105611/562936235471929356/oothulurises.gif');
            	message.channel.send(embed);
            break;
            case 'motivated':
	            var image = "https://cdn.discordapp.com/attachments/522773675263655983/567039672648204308/gzfy1bez4t311_1.png";
	            if(message.author.username=="Ouul"||message.author.username=="Ouulette"){
	            	image = "https://media.discordapp.net/attachments/522773675263655983/564112585620979712/OuulMotivated2.png";
	            }
	            embed.setImage(image);
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