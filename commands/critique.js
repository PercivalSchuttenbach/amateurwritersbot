function Critique(Discord, client, logger, memory){

	var CritiqueStore = new function(){
		function Work(workId, workTitle){
			var id = workId;
			var title = workTitle;
			var favorite = false;
			var critique = false;
			var toread = false;

			this.setTitle = function(workTitle){
				title = workTitle;
			};

			this.getTitle = function(){
				return title;
			};

			this.setFavorite = function(flag){
				favorite = flag;
			};

			this.setCritique = function(flag){
				critique = flag;
			};

			this.setToread = function(flag){
				toread = flag;
			};
			this.getFavorite = function(){
				return favorite;
			};

			this.getCritique = function(){
				return critique;
			};

			this.getToread = function(){
				return toread;
			};
		}

		function Writer(writerId, writerName){
			var id = writerId;
			var name = writerName;
			var works = {};

			this.getName = function(){
				return name;
			};

			this.get = function(workId){
				if(!works[workId]){
					return false;
				}
				return works[workId];
			}
			this.getAll = function(){
				return works;
			};
			this.create = function(workId, title){
				works[workId] = new Work(workId, title);
				return works[workId];
			}
		}

		function Critiquer(critquerId){
			var id = critquerId;
			var writers = {};

			this.get = function(writerId){
				if(!writers[writerId]){
					return false;
				}
				
				return writers[writerId];
			}

			this.create = function(writerId, writerName){
				writers[writerId] = new Writer(writerId, writerName);
				return writers[writerId];
			};

			this.list = function(){
				var message = "";
				for(var writerId in writers){
					var name;
					var works = writers[writerId].getAll();
					message += "**" + writers[writerId].getName() + "**\n";
					for(var workId in works){
						var work = works[workId];
						message+= "*" + work.getTitle() + "* ";
						if(work.getFavorite()){
							message+= ":heart:";
						}
						if(work.getCritique()){
							message+= ":speech_balloon:";
						}
						if(work.getToread()){
							message+= ":clock1:";
						}
						message+= "\n";
					}
					message+="\n\n"
				}

				return message;
			};
		}

		var critiqueStore = {};

		this.get = function(critquerId){
			if(!critiqueStore[critquerId]){
				critiqueStore[critquerId] = new Critiquer(critquerId);
			}
			return critiqueStore[critquerId];
		};
	};

	function checkIfDocs(message){
		return message.content.indexOf("https://docs.google.com/") > -1;
	}

	client.on("messageReactionAdd", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		//logger.info(message.embeds[0].title);

		if(message.channel.id=="566520124245409812" && checkIfDocs(message)){
			var critiquer = CritiqueStore.get(user.id);
			var writer = critiquer.get(message.author.id);
			if(!writer){
				writer = critiquer.create(message.author.id, message.author.username);
			}
			var work = writer.get(message.id);
			if(!work){
				work = writer.create(message.id);
				if(message.embeds.length){
					work.setTitle(message.embeds[0].title);
				}
			}

			

			switch(emoji){
				case "%F0%9F%92%AC":
					work.setCritique(true);
					logger.info(user.username + ' critiqued');
				break;
				case "%E2%9D%A4":
					work.setFavorite(true);
					logger.info(user.username + ' favorited');
				break;
				case "%F0%9F%95%90":
					work.setToread(true);
					logger.info(user.username + ' to read');
				break;
			}
		}
	});

	//%F0%9F%92%AC   critique
	//%E2%9D%A4	favorite
	//%F0%9F%95%90 read later
	client.on("message", function(message){
		if(message.author.bot){
	        return;
	  	}

		if(message.channel.id=="566520124245409812" && checkIfDocs(message)){
			message.react("%F0%9F%92%AC");
			message.react("%E2%9D%A4");
			message.react("%F0%9F%95%90");
		}

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		
		if(command=='critique'){
			switch(args[0]){
				case "stats":
					var critiquer = CritiqueStore.get(message.author.id);
					message.channel.send(critiquer.list());
				break;
			}
		}
	});

}

module.exports = {
  name: 'critique',
  description: 'critique',
  init(Discord, client, logger, memory){
    critique = new Critique(Discord, client, logger, memory);
  }
};