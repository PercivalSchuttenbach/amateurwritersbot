function Critique(Discord, client, logger, memory){
	const UPDATEAFTER = 60 * 60 * 1000;//1 hour
	const CRITIQUED = "%F0%9F%92%AC";
	const TOREAD = "%E2%8C%9B";
	const READING = "%F0%9F%91%93";
	const CHANNELID = ["522776615462109186"]; //567068879944155139

	function Work(workId, workTitle){
		var id = workId;
		var name = "";
		var reading = false;
		var critique = false;
		var toread = false;
		var description;
		var link;

		this.checkForRemoval = function(){
			if(!reading && !critique && !toread){
				return true;
			}
			return false;
		};

		this.getId = function(){
			return id;
		};

		this.setName = function(workTitle){
			name = workTitle;
		};

		this.getName = function(){
			return name;
		};

		this.setDescription = function(workdescription){
			description = workdescription.substring(0,100);
		};

		this.getDescription = function(){
			return description;
		};

		this.setLink = function(workLink){
			link = workLink;
		};

		this.getLink = function(){
			return link;
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
		this.getCount = function(){
			return Object.keys(works).length;
		}
		this.getAll = function(){
			return works;
		};
		this.create = function(workId, title){
			works[workId] = new Work(workId, title);
			return works[workId];
		};
	}

	var DirStore = new function(){
		var dirStore = {};
		var lastupdated = null;

		this.getLastUpdated = function(){
			return lastupdated;
		};

		this.get = function(writerId){
			if(!dirStore[writerId]){
				return false;
			}
			return dirStore[writerId];
		};

		this.getAll = function(){
			return dirStore;
		};

		this.remove = function(writer){
			delete dirStore[writer.getId()];
		};

		this.create = function(writerId, writerName){
			dirStore[writerId] = new Writer(writerId, writerName);
			return dirStore[writerId];
		};
	};

	var CritiqueStore = new function(){

		function Critiquer(critquerId){
			var id = critquerId;
			var writers = {};
			var update = null;

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

			this.setUpdate = function(timestamp){
				update = timestamp;
			};

			this.getUpdate = function(timestamp){
				return update;
			};

			this.list = function(){
				var message = "";
				for(var writerId in writers){
					var name;
					var works = writers[writerId].getAll();
					message += "**" + writers[writerId].getName() + "**\n";
					for(var workId in works){
						var work = works[workId];
						message+= "*" + work.getName() + "* ";
						if(work.getReading()){
							message+= ":eyeglasses:";
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

	function FetchDate(message, botmessage){

		var messagePromises = 0;
		var userPromises = 0;
		var twirl = false;
		var stats = "stats";
		var channels = [];

		function checkPromises(fn){
			if(messagePromises || userPromises){
				botmessage.edit("Retrieving " + stats + "..." + (twirl ? ":hourglass:" : ":hourglass_flowing_sand:"));
				twirl = !twirl;
				setTimeout(function(){
					checkPromises(fn);
				}, 1000);
			}else{
				fn();
			}
		}

		function fetchAllMessages(channelId, options, user, fn){
			messagePromises++;
			client.channels.get(channelId).fetchMessages(options).then(function(messages){
				messagePromises--;
				fn(messages, user);

				if(messages.size){
					options.before = messages.last().id;
					fetchAllMessages(channelId, options, user, fn);
				}
			});
		}

		this.getDir = function(type, author){
			var updated = DirStore.getLastUpdated();
			if(!updated || ( (+new Date() - updated) > UPDATEAFTER ) ){
				logger.info("No directory in memory");
				//botmessage.delete();

				fetchAllMessages(CHANNELID[0], {limit: 100}, message.author, buildDir);
				setTimeout(function(){
					checkPromises(dirBuild);
				},1000);

			}
		};

		function buildDir(messages, user){
			var docLinks = messages.filter(ms =>checkIfDocs(ms));
			docLinks.forEach(function(m){
				var writer = DirStore.get(m.author.id);
				if(!writer){
					writer = DirStore.create(m.author.id, m.author.username);
				}
				//logger.info(m.id);
				var work = writer.get(m.id);
				if(!work){
					//logger.info("creating work");
					work = writer.create(m.id);
					if(m.embeds.length){
						if(m.embeds[0].title){
							work.setName(m.embeds[0].title);
						}
						if(m.embeds[0].description){
							work.setDescription(m.embeds[0].description);
						}
					}
					work.setLink(m.url);
				}
			});
		}

		function dirBuild(){
			showDir(botmessage, message.author);
		}

		

		this.getCritiqued = function(){

			//@TODO loop over all channels

			stats = '#' + client.channels.get(CHANNELID[0]).name;
			fetchAllMessages(CHANNELID[0], {limit: 100}, message.author, getCritiquedStats);
			setTimeout(function(){
				checkPromises(showStats);
			},1000);
		};

		this.updateAll = function(){
			fetchAllMessages(CHANNELID[0], {limit: 100}, message.author, addReactions);
			setTimeout(function(){
				checkPromises(doneReacting);
			},1000);
		};



		function addReactions(messages, user){
			var docLinks = messages.filter(ms =>checkIfDocs(ms));
			docLinks.forEach(function(m){
				m.react(TOREAD)
				.then(()=>m.react(READING))
				.then(()=>m.react(CRITIQUED));
			});
		}

		function doneReacting(){
			botmessage.edit("DONE");
		}

		function getCritiquedStats(messages, user){
			var docLinks = messages.filter(ms =>checkIfDocs(ms) && m.reactions.size);
			docLinks.forEach(function(m){
				//logger.info(m.reactions.filter(r=>r.count>1&&r.users.has("212587952461578240")).size);
				m.reactions.forEach(function(r){
					if(	r.emoji.identifier == CRITIQUED ||
						r.emoji.identifier == TOREAD ||
						r.emoji.identifier == READING){

						userPromises++;
						r.fetchUsers().then(function(users){
							if(users.has(user.id)){
								processMessage(user, m, r.emoji.identifier);
							}
							userPromises--;
						});
					}
				});
			});
		}

		function showStats(){
			var critiquer = CritiqueStore.get(message.author.id);
			var list = critiquer.list();
			if(!list){
				list = "You have nothing in your critique listings at the moment. \"run ~critique update\" to update list";
			}else{
				list = message.author.toString() + " your stats:\n" + list + "**Legend:**\n:hourglass:: to read.\n:eyeglasses:: currently reading.\n:speech_balloon:: critiqued.";
			}
			botmessage.edit(list);
		}

		this.showStats = showStats;

	}

	//working on showing waiting message and updating list
	function getStats(message){
		var critiquer = CritiqueStore.get(message.author.id);
		if(!critiquer.getUpdate() || (+new Date - critiquer.getUpdate() > (60 * 60 * 24 * 1000) ) ){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getCritiqued();
			});
		}
		else{
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.showStats();
			});
		}
	}

	function update(message){
		logger.info("Update command fired");
		
		message.channel.send("Adding reactions...:hourglass:").then(function(botmessage){
			var fd = new FetchDate(message, botmessage);
			fd.updateAll();
		});
	}

	function showDir(botmessage, author){

		function UI(collection, title){

			logger.info('passed 1');

			var ids = Object.keys(collection);
			var prev = null;
			var next = 0;
			var reactionMap = [
				"blank",
				"1%E2%83%A3",
				"2%E2%83%A3",
				"3%E2%83%A3",
				"4%E2%83%A3",
				"5%E2%83%A3",
				"6%E2%83%A3",
				"7%E2%83%A3",
				"8%E2%83%A3",
				"9%E2%83%A3",
				"%F0%9F%94%9F"
			];

			function getIndicatorReact(n){
				return reactionMap[n];
			}
			function getIndicator(n){
				var map = [
					'blank',
					'one',
					'two',
					'three',
					'four',
					'five',
					'six',
					'seven',
					'eight',
					'nine',
					'keycap_ten'
				];
				return ':' + map[n] + ':';
			}

			logger.info('passed 2');

			function showList(){
				logger.info("display list");
				var text = "";
				var count = next + 10;
				var n = 1;

				if(next==0){
					prev = false;
				}

				logger.info(next);

				//display
				for(var i = next;i<count;i++){
					if(ids[i]){
						var item = collection[ids[i]];
						text+= getIndicator(n) + " " + item.getName() + (item['getCount'] ? ": " + item.getCount() : "") + "\n";
						n++;
					}
				}
				next = count;

				botmessage.edit(title + "\n" + text);

				logger.info(i + " " + next + " " + ids.length);

				//add reactions
				botmessage.clearReactions().then(async function(){
					if(prev){
						await botmessage.react("%E2%AC%85");
					}
					try{
						for(var i=1;i<n;i++){
							await botmessage.react(getIndicatorReact(i));
						}
					}catch(error){
						logger.info(error);
					}
					if(next<=ids.length){
						try{
							await botmessage.react("%E2%9E%A1");
						}catch(error){
							logger.info("failed");
						}
					}
					if(next > 0){
				    	prev = true;
				    }
				});

				const filter = (reaction, user) => {
				    return !user.bot && user.id == author.id;
				};

				botmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
			    .then(collected => {
			        const reaction = collected.first();

			        switch (reaction.emoji.identifier){

				        case '%E2%9E%A1':
				            logger.info('next');
				            showList();
			            break;
				        case "%E2%AC%85":
				        	logger.info('prev');
				        	next -=20;
				            showList();
				        break;
				        default:
				        	var index = reactionMap.indexOf(reaction.emoji.identifier);
				        	if(index > -1){
				        		index = next - (10-index) - 1;
				        		logger.info("chosen: " + index);
				        		var item = collection[ids[index]];
			    				
			    				if(!item['getLink']){
			    					logger.info("get works");
			    					var test = new UI(item.getAll(), "Works of " + item.getName() + ":");
			    				}else{
			    					author.send(item.getLink());
			    					botmessage.delete();
			    				}
				        	}
				        break;
				    }
			        
			    })
			    .catch(collected => {
			       //botmessage.delete();
			    });
			}

			logger.info('passed 3');

			//sort list by name
			ids.sort(function(a, b){
				logger.info(collection[a].getName() + " " + collection[b].getName());

				var nameA = collection[a].getName().toLowerCase();
				var nameB = collection[b].getName().toLowerCase();

				if (nameA < nameB) {
					return -1;
				}
				if (nameA > nameB) {
					return 1;
				}

				// names must be equal
				return 0;
			});

			logger.info('passed 4');


			botmessage.edit("The directory is build");
			showList();

		};

		var ui = new UI(DirStore.getAll(), "Listing writers:");
	}

	function getDir(message, args){

		logger.info(args);

		function checkIfType(arg){
			return ["#short", "#chapter"].indexOf(arg) > -1;
		}

		if(!args.length){
			logger.info("get entire doc");

			message.channel.send("Fetching whole directory...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getDir();
			});

			return;
		}

		//var fd = FetchDate(message, botmessage);
		if(args.length > 2){
			// ERRUR
			logger.info("Error: to many arguments. ~critique dir [type] [author]");
			return;
		}
		if(args.length==2){
			if( !checkIfType(args[0]) ){
				//ERRUR
				logger.info("Wrong type supplied. Error: ~critique dir [type] [author]");
				return;
			} else {
				//first arg type, second arg author
				logger.info("Type: " + args[0] + ". Author: " + args[1]);
			}
		}
		else {
			if( checkIfType(args[0]) ){
				// filter by type
				logger.info("filter by type: " + args[0]);
			} else {
				//filter by author
				logger.info("filter by author: " + args[0]);
			}
		}
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
				work.setName(message.embeds[0].title);
			}
			work.setLink(message.url);
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

		critiquer.setUpdate(+new Date());
	}

	client.on("messageReactionAdd", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){
			processMessage(user, message, emoji);
		}
	});

	client.on("messageReactionRemove", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){
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

			critiquer.setUpdate(+new Date());
		}

	});

	//%F0%9F%92%AC   critique
	//%E2%9D%A4	reading
	//%F0%9F%95%90 read later
	client.on("message", function(message){
		if(message.author.bot){
	        return;
	  	}

		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){
			message.react(TOREAD)
			.then(()=>message.react(READING))
			.then(()=>message.react(CRITIQUED));
		}

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		const subcommand = args.shift();
		
		if(command=='critique'){
			switch(subcommand){
				case "update":
					update(message);
				break;
				case "stats":
					getStats(message);
				break;
				case "dir":
					getDir(message, args);
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