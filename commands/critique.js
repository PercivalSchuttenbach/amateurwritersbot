function Critique(Discord, client, logger, memory){
	const CRITIQUED = "%F0%9F%92%AC";
	const TOREAD = "%E2%8C%9B";
	const READING = "%F0%9F%91%93";

	var CritiqueStore = new function(){
		function Work(workId, workTitle){
			var id = workId;
			var title = workTitle;
			var reading = false;
			var critique = false;
			var toread = false;

			this.checkForRemoval = function(){
				if(!reading && !critique && !toread){
					return true;
				}
				return false;
			};

			this.getId = function(){
				return id;
			};

			this.setTitle = function(workTitle){
				title = workTitle;
			};

			this.getTitle = function(){
				return title;
			};

			this.setReading = function(flag){
				reading = flag;
			};

			this.setCritique = function(flag){
				critique = flag;
			};

			this.setToread = function(flag){
				toread = flag;
			};
			this.getReading = function(){
				return reading;
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

			this.getId = function(){
				return id;
			};
			this.getName = function(){
				return name;
			};

			this.get = function(workId){
				if(!works[workId]){
					return false;
				}
				return works[workId];
			};
			this.remove = function(work){
				delete works[work.getId()];
			};
			this.getAll = function(){
				return works;
			};
			this.create = function(workId, title){
				works[workId] = new Work(workId, title);
				return works[workId];
			};
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

			this.remove = function(writer){
				delete writers[writer.getId()];
			};

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
						if(work.getReading()){
							message+= ":heart:";
						}
						if(work.getCritique()){
							message+= ":speech_balloon:";
						}
						if(work.getToread()){
							message+= ":hourglass:";
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

	function clearWork(critiquer, writer, work){
		if(work.checkForRemoval()){
			writer.remove(work);
			var works = writer.getAll();
			if(Object.keys(works).length === 0 && works.constructor === Object){
				critiquer.remove(writer);
			}
		}
	}

	function fetchAllMessages(channelId, options, user, fn, doneFn, botM){
		logger.info(options);
		client.channels.get(channelId).fetchMessages(options).then(function(messages){
			logger.info("fetchAllMessages run");
			logger.info(messages.size);

			fn(messages, user);

			if(messages.size){
				options.before = messages.last().id;
				fetchAllMessages(channelId, options, user, fn);
			}
			else{
				doneFn(user.id, botM)
			}
		});
	}

	function getCritiquedStats(messages, user){
		var docLinks = messages.filter(m =>checkIfDocs(m) && m.reactions.size);
		docLinks.forEach(function(m){
			//logger.info(m.reactions.filter(r=>r.count>1&&r.users.has("212587952461578240")).size);
			m.reactions.forEach(function(r){
				if(	r.emoji.identifier == CRITIQUED ||
					r.emoji.identifier == TOREAD ||
					r.emoji.identifier == READING){
					r.fetchUsers().then(function(users){
						if(users.has(user.id)){
							processMessage(user, m, r.emoji.identifier);
						}
					});
				}
			});
		});
	}

	function showStats(userId, botM){
		var critiquer = CritiqueStore.get(userId);
		var list = critiquer.list();
		if(!list){
			list = "You have nothing in your critique listings at the moment. \"run ~critique update\" to update list";
		}else{
			list = message.author.toString() + " your stats:\n" + list;
		}
		botM.edit(list);
	}

	//working on showing waiting message and updating list
	function getStats(message){
		message.channel.send("Retrieving stats...:hourglass:").then(m =>fetchAllMessages("566520124245409812", {limit: 100}, message.author, getCritiquedStats, showStats, m));
	}

	function update(message){
		logger.info("Update command fired");
		// 	//logger.info(messages.filter(m => m.embeds.length!=0 && checkIfDocs(m) && m.author.id == message.author.id).size);

		//update CritiquedStats from channel
	}

	function processMessage(user, message, emoji){
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
			case CRITIQUED:
				work.setCritique(true);
				logger.info(user.username + ' critiqued');
			break;
			case READING:
				work.setReading(true);
				logger.info(user.username + ' reading');
			break;
			case TOREAD:
				work.setToread(true);
				logger.info(user.username + ' to read');
			break;
		}
	}

	client.on("messageReactionAdd", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(message.channel.id=="566520124245409812" && checkIfDocs(message)){
			processMessage(user, message, emoji);
		}
	});

	client.on("messageReactionRemove", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(message.channel.id=="566520124245409812" && checkIfDocs(message)){
			var critiquer = CritiqueStore.get(user.id);
			var writer = critiquer.get(message.author.id);
			var work = writer.get(message.id);

			switch(emoji){
				case CRITIQUED:
					work.setCritique(false);
				break;
				case READING:
					work.setReading(false);
				break;
				case TOREAD:
					work.setToread(false);
				break;
			}

			clearWork(critiquer, writer, work);
		}

	});

	//%F0%9F%92%AC   critique
	//%E2%9D%A4	reading
	//%F0%9F%95%90 read later
	client.on("message", function(message){
		if(message.author.bot){
	        return;
	  	}

		if(message.channel.id=="566520124245409812" && checkIfDocs(message)){
			message.react(TOREAD)
			.then(()=>message.react(READING))
			.then(()=>message.react(CRITIQUED));
		}

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		
		if(command=='critique'){
			switch(args[0]){
				case "update":
					update(message);
				break;
				case "stats":
					getStats(message);
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