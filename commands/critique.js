var stcritique;

function Critique(Discord, client, logger, memory){
	const UPDATEAFTER = 60 * 60 * 1000;//1 hour
	const CRITIQUED = "%F0%9F%92%AC";
	const TOREAD = "%E2%8C%9B";
	const READING = "%F0%9F%91%93";
	const CHANNELID = ["522776615462109186", "522777307161559061","567351235699671043"]; //567068879944155139

	var icons = {"reading":":eyeglasses:","toread":":hourglass:"};

	function Work(workId, workTitle){
		var id = workId;
		var name = "";
		var reading = {};
		var critique = {};
		var toread = {};
		var description;
		var link;
		var thread;
		var users = false;

		this.checkForRemoval = function(userId){
			if(!reading[userId] && !critique[userId] && !toread[userId]){
				return true;
			}
			return false;
		};

		this.setUsers = function(us){
			users = us;
		};

		this.getUsers = function(){
			return users;
		};

		this.setMessage = function(m){
			thread = m;
		};

		this.getMessage = function(){
			return thread;
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

		this.setReading = function(userId, flag){
			reading[userId] = flag;
		};

		this.setCritique = function(userId, flag){
			critique[userId] = flag;
		};

		this.setToread = function(userId, flag){
			toread[userId] = flag;
		};
		this.getReading = function(userId){
			return reading[userId];
		};

		this.getCritique = function(userId){
			return critique[userId];
		};

		this.getToread = function(userId){
			return toread[userId];
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
		this.set = function(workId, work){
			works[workId] = work;
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
		this.setLastUpdated = function(timestamp){
			lastupdated = timestamp;
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
			var update = false;

			this.get = function(writerId){
				if(!writers[writerId]){
					return false;
				}
				
				return writers[writerId];
			};

			function compileList(checkFlag){
				var reading = [];
				for(var w in writers){
					var works = writers[w].getAll();
					for(var wi in works){
						if( works[wi][checkFlag](id) ){
							reading.push(works[wi]);
						}
					}
				}
				return reading;
			}

			this.getReading = function (){
				return compileList('getReading');
			}

			this.getToread = function (){
				return compileList('getToread');
			}

			this.getId = function(){
				return id;
			};

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

			this.getUpdate = function(){
				return update;
			};

			this.list = function(){
				var message = "";
				for(var writerId in writers){
					var name;
					var works = writers[writerId].getAll();
					message += "** " + writers[writerId].getName() + " **\n";
					for(var workId in works){
						var work = works[workId];
						message+= "* " + work.getName() + " * ";
						if(work.getReading(id)){
							message+= ":eyeglasses:";
						}
						if(work.getCritique(id)){
							message+= ":speech_balloon:";
						}
						if(work.getToread(id)){
							message+= ":hourglass:";
						}
						message+= "\n";
					}
					message+="\n"
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

		this.has = function(critquerId){
			if(critiqueStore[critquerId]){
				return true;
			}
			return false;
		};
	};

	function checkIfDocs(message){
		return message.content.indexOf("https://docs.google.com/") > -1;
	}

	function clearWork(critiquer, writer, work){
		if(work.checkForRemoval(critiquer.getId())){
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
				botmessage.edit("Retrieving for " + message.author.toString() + " " + stats + "..." + (twirl ? ":hourglass:" : ":hourglass_flowing_sand:"));
				twirl = !twirl;
				setTimeout(function(){
					checkPromises(fn);
				}, 1000);
			}else{
				fn();
			}
		}

		function fetchAllMessages(channelId, options, user, fn){
			if(client.channels.has(channelId)){
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
		}

		function loopChannels(step, finalStep){
			var channels = CHANNELID.slice();

			function next(){
				var channel = channels.shift();
				if(channel){
					fetchAllMessages(channel, {limit: 100}, message.author, step);
					setTimeout(function(){
						checkPromises(next);
					},1000);
				}
				else{
					finalStep();
				}
			}

			next();
		}

		this.getDir = function(){
			stats = "directory";
			var updated = DirStore.getLastUpdated();
			if(!updated || ( (+new Date() - updated) > UPDATEAFTER ) ){
				logger.info("No directory in memory");
				//botmessage.delete();

				loopChannels(buildDir, dirBuild);
			}else{
				showDir(botmessage, message.author);
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
					work.setMessage(m);
				}
			});
		}

		function dirBuild(){
			DirStore.setLastUpdated(+new Date());
			showDir(botmessage, message.author);
		}

		function updateStats(){
			DirStore.setLastUpdated(+new Date());
			getCritiquedStats();
			setTimeout(function(){
				checkPromises(showStats);
			},1000);
		}

		function updateListing(fn){
			return function (){
				DirStore.setLastUpdated(+new Date());
				getCritiquedStats();
				setTimeout(function(){
					checkPromises(fn);
				},1000);
			}
		}

		

		this.getCritiqued = function(){
			var updated = DirStore.getLastUpdated();
			if(!updated || ( (+new Date() - updated) > UPDATEAFTER ) ){
				//build a new
				stats = "directory";
				loopChannels(buildDir, updateStats);

				logger.info("have to build a new one");
			}else{
				stats = "critiques"
				getCritiquedStats();
				setTimeout(function(){
					checkPromises(showStats);
				},1000);
			}
		};

		this.getCritiquedListing = function(fn){
			var updated = DirStore.getLastUpdated();
			if(!updated || ( (+new Date() - updated) > UPDATEAFTER ) ){
				//build a new
				stats = "directory";
				loopChannels(buildDir, updateListing(fn));

				logger.info("have to build a new one");
			}else{
				stats = "critiques";
				getCritiquedStats();
				setTimeout(function(){
					checkPromises(fn);
				},1000);
			}
		};

		this.getDirListing = function(fn){
			var updated = DirStore.getLastUpdated();
			if(!updated || ( (+new Date() - updated) > UPDATEAFTER ) ){
				//build a new
				stats = "directory";
				loopChannels(buildDir, updateListing(fn));

				logger.info("have to build a new one");
			}else{
				fn();
			}
		};

		this.updateAll = function(){
			loopChannels(addReactions, doneReacting);
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

		function getCritiquedStats(){
			var writers = DirStore.getAll();

			for(var w in writers){
				var writer = writers[w];
				var works = writer.getAll();
				for(var wi in works){
					(function(writer, work){
						m = work.getMessage();
						m.reactions.forEach(function(r){
							if(	r.emoji.identifier == CRITIQUED ||
								r.emoji.identifier == TOREAD ||
								r.emoji.identifier == READING){
								userPromises++;

								r.fetchUsers().then(function(users){
									users.forEach(function(user){
										if(!user.bot){
											addUserReaction(user, writer, work, r.emoji.identifier);
										}
									});
									userPromises--;
								});

							}
						});
					}(writer, works[wi]));
				}
			}
		}

		function addUserReaction(user, writer, work, emoji){
			var critiquer = CritiqueStore.get(user.id);
			var cwriter = critiquer.get(writer.getId());
			if(!cwriter){
				cwriter = critiquer.create(writer.getId(), writer.getName());
			}
			logger.info(user.username + " " + writer.getName() + work.getName());
			if(!cwriter.get(work.getId())){
				logger.info("add work to critique dir for user " + user.username);
				cwriter.set(work.getId(), work);
			}

			switch(emoji){
				case CRITIQUED:
					work.setCritique(user.id, true);
					logger.info(user.username + ' critiqued');
				break;
				case READING:
					work.setReading(user.id, true);
					logger.info(user.username + ' reading');
				break;
				case TOREAD:
					work.setToread(user.id, true);
					logger.info(user.username + ' to read');
				break;
			}

			critiquer.setUpdate(+new Date());
		}

		function showStats(){
			var critiquer = CritiqueStore.get(message.author.id);
			var list = critiquer.list();
			if(!list){
				list = "You have nothing in your critique listings at the moment. Click on :hourglass: :eyeglasses: :speech_balloon: underneath a message in the critique channels.";
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
		if(!critiquer.getUpdate()){
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

	function getNextWorkByAuthor(message){
		if(!DirStore.getLastUpdated()){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getCritiquedListing(function(){
					getNextWorkByAuthor(message);
				});
			});
		}else{
			var author = message.author;
			var writer = message.mentions.users.first();
			if(writer){
				var writerStore = DirStore.get(writer.id);
				if(writerStore){
					var works = writerStore.getAll();
					if(!getNextWorkOfAuthor(message, author, works)){
						//no work found
						message.reply("You have read all by " + writer.username + " in the critique channel.");
					}
				}else{
					message.reply("No works by " + writer.username + " have been posted in the critique channel.");
				}
			}else{
				message.reply("Command does not exits or username specified is not on this server.");
			}
		}
	}

	function getNextWorkOfAuthor(message, author, works){
		for(var w in works){
			var work = works[w];
			logger.info(work.getName());
			if(!work.getCritique(author.id)){
				//work found not critiqued by user
				message.reply("the link for " + work.getName() + " by " + work.getMessage().author.username + " will be sent by DM.");
				author.send(work.getLink());
				return true;
			}
		}
		return false;
	}

	function getRandomItem(items){
		var keys = Object.keys(items);
		var id = keys[Math.floor(Math.random() * keys.length)];
		return items[id];
	}

	function getRandomWork(message) {
		if(!DirStore.getLastUpdated()){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getCritiquedListing(function(){
					getRandomWork(message);
				});
			});
		}else{
			var author = message.author;
			var works = getRandomItem(DirStore.getAll()).getAll();
			if(!getNextWorkOfAuthor(message, author, works)){
				getRandomWork(message);
			}
		}
	}

	function getReading(message){
		var author = message.author;
		var critiquer = CritiqueStore.get(message.author.id);
		if(!critiquer.getUpdate()){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getCritiquedListing(function(){
					getReading(message);
				});
			});
		}else{
			var works = critiquer.getReading();
			handleCritiqueListing(message, author, works, "reading");
		}
	}

	function getToread(message){
		var author = message.author;
		var critiquer = CritiqueStore.get(message.author.id);
		if(!critiquer.getUpdate()){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getCritiquedListing(function(){
					getToread(message);
				});
			});
		}else{
			var works = critiquer.getToread();
			handleCritiqueListing(message, author, works, "toread");
		}
	}

	function handleDirListing(message, author, works, writer){
		if(!works.length){
			message.reply("There are no items for " + writer + " listed in the directory.");
			return;
		}
		if(works.length==1){
			var work = works[0];
			message.reply("the link for " + work.getName() + " by " + work.getMessage().author.username + " will be sent by DM.");
			author.send(work.getLink());
		}
		else{
			//more than one. List the bugger
			message.reply("retrieving titles of " + writer ).then(function(botmessage){
				var  test = new DirUI(botmessage, author);
				test.listDir(works, "These are the works that are listed for " + writer);
			});
		}
	}

	function handleCritiqueListing(message, author, works, action, flag){
		if(!works.length){
			message.reply("You have not marked anything as " + action + " " + (icons[action] ? icons[action] : "") + " at this moment.");
			return;
		}
		if(works.length==1){
			var work = works[0];
			message.reply("the link for " + work.getName() + " by " + work.getMessage().author.username + " will be sent by DM.");
			author.send(work.getLink());
		}
		else{
			//more than one. List the bugger
			message.reply("retrieving titles you have marked as " + action + " " + (icons[action] ? icons[action] : "") ).then(function(botmessage){
				var  test = new DirUI(botmessage, author);
				test.listDir(works, "These are the works you are currently " + action + " " + (icons[action] ? icons[action] : "") + ":", true);
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

	function DirUI(botmessage, author){

		var ui;

		function UI(collection, title, showAuthor){

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
				var steps = 0;
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
						text+= getIndicator(n) + " " + (showAuthor ? item.getMessage().author.username + " : " : "") + item.getName() + (item['getCount'] ? ": " + item.getCount() : "") + "\n";
						n++;
					}
				}
				next = count;

				botmessage.edit("**Listing directory for " + author.toString() + "**\n*" + title + "*\n" + text);

				logger.info(i + " " + next + " " + ids.length);

				//add reactions
				botmessage.clearReactions().then(async function(){
					if(prev){
						steps++;
						await botmessage.react("%E2%AC%85").then(()=>steps--);
					}
					try{
						for(var i=1;i<n;i++){
							steps++;
							await botmessage.react(getIndicatorReact(i)).then(()=>steps--);
						}
					}catch(error){
						logger.info(error);
					}
					if(next<=ids.length){
						try{
							steps++;
							await botmessage.react("%E2%9E%A1").then(()=>steps--);
						}catch(error){
							logger.info("failed");
						}
					}
					if(next > 0){
				    	prev = true;
				    }
				    //check using the last item what the depth is
				    if(!showAuthor && item['getLink']){
				    	steps++;
				    	await botmessage.react("%E2%AC%86").then(()=>steps--);
				    }

				    steps++;
				    await botmessage.react("%F0%9F%87%BD").then(()=>steps--);
				    steps++;
				    await botmessage.react("%F0%9F%86%98").then(()=>steps--);

				    const filter = (reaction, user) => {
				    	return !user.bot && user.id == author.id && steps==0;
					};

					botmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
				    .then(collected => {
				        const reaction = collected.first();

				        switch (reaction.emoji.identifier){

				        	case "%F0%9F%86%98":
				        		botmessage.clearReactions().then(function(){
				        			botmessage.edit(author.toString() + " I am sending you a DM");
				        		});
				        		help(author);
				        	break;
					        case "%E2%AC%86":
					        	ui.reset();
					        break;
					        case '%E2%9E%A1':
					            logger.info('next');
					            showList();
				            break;
					        case "%E2%AC%85":
					        	logger.info('prev');
					        	next -=20;
					            showList();
					        break;
					        case "%F0%9F%87%BD":
					        	botmessage.clearReactions().then(()=>botmessage.edit("aborted by user " + author.toString()));
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
				    					botmessage.clearReactions().then(function(){
				    						botmessage.edit(author.toString() + " the link for " + item.getName() + " by " + item.getMessage().author.username + " will be sent by DM.");
				    					});
				    				}
					        	}
					        break;
					    }
				        
				    })
				    .catch(collected => {
				       //botmessage.delete();
				    });
				});
			}

			this.reset = function(){
				prev = null;
				next = 0;
				showList();
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


			botmessage.edit("The directory is build for " + author.toString());
			showList();

		}

		this.listDir = function(items, title, showAuthor){
			ui = new UI(items, title, showAuthor);
		};
	}

	function showDir(botmessage, author){
		var  test = new DirUI(botmessage, author);
		test.listDir(DirStore.getAll(), "Listing writers:");
	}

	function getDir(message){

		if(message.mentions.users){
			getDirByAuthor(message);
		}else{
			logger.info("get entire doc");

			message.channel.send("Fetching whole directory for " + message.author.toString() + " ...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getDir();
			});

			return;
		}
	}

	function getDirByAuthor(message){
		if(!DirStore.getLastUpdated()){
			message.channel.send("Retrieving stats...:hourglass:").then(function(botmessage){
				var fd = new FetchDate(message, botmessage);
				fd.getDirListing(function(){
					getDirByAuthor(message);
				});
			});
		}else{
			var author = message.author;
			var writer = message.mentions.users.first();
			if(writer){
				var writerStore = DirStore.get(writer.id);
				if(writerStore){
					var works = Object.values(writerStore.getAll());
					handleDirListing(message, author, works, writer.username);
				}else{
					message.reply("No works by " + writer.username + " have been posted in the critique channel.");
				}
			}else{
				message.reply("Username specified is not on this server.");
			}
		}
	}

	function processMessage(user, message, emoji){
		var writerId = message.author.id;
		var workId = message.id;
		var critiquer = CritiqueStore.get(user.id);
		var cwriter = critiquer.get(writerId);
		if(!cwriter){
			cwriter = critiquer.create(writerId, message.author.username);
		}
		var work = cwriter.get(workId);
		if(!work){
			work = DirStore.get(writerId).get(workId);
			cwriter.set(workId, work);
		}

		switch(emoji){
			case CRITIQUED:
				work.setCritique(user.id, true);
				logger.info(user.username + ' critiqued');
			break;
			case READING:
				work.setReading(user.id,true);
				logger.info(user.username + ' reading');
			break;
			case TOREAD:
				work.setToread(user.id,true);
				logger.info(user.username + ' to read');
			break;
		}

		critiquer.setUpdate(+new Date());
	}

	function help(author){
		author.send("**~critique dir**: lists all authors => works\n**~critique stats**: check who you have critiqued.");
	}

	client.on("messageReactionAdd", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){
			if(CritiqueStore.has(user.id)){
				processMessage(user, message, emoji);
			}
		}
	});

	client.on("messageReactionRemove", function(messageReaction, user){
		if(user.bot) return;

		var message = messageReaction.message;
		var emoji = messageReaction.emoji.identifier;

		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){
			if(CritiqueStore.has(user.id)){
				var critiquer = CritiqueStore.get(user.id);
				var writer = critiquer.get(message.author.id);
				var work = writer.get(message.id);

				switch(emoji){
					case CRITIQUED:
						logger.info("removed critique state for " + user.username + " " + work.getName());
						work.setCritique(user.id, false);
					break;
					case READING:
						logger.info("removed reading state for " + user.username + " " + work.getName());
						work.setReading(user.id, false);
					break;
					case TOREAD:
						logger.info("removed toread state for " + user.username + " " + work.getName());
						work.setToread(user.id, false);
					break;
				}

				clearWork(critiquer, writer, work);

				critiquer.setUpdate(+new Date());
			}
		}

	});

	client.on("messageUpdate", function(oldmessage, message){
		if(CHANNELID.indexOf(message.channel.id) > -1 && checkIfDocs(message)){

			var writer = DirStore.get(message.author.id);
			if(!writer){
				writer = DirStore.create(message.author.id, message.author.username);
			}
			
			var work = writer.get(message.id);
			if(!work){
				work = writer.create(message.id);
				work.setLink(message.url);
				work.setMessage(message);

				message.react(TOREAD)
				.then(()=>message.react(READING))
				.then(()=>message.react(CRITIQUED));
			}

			if(message.embeds.length){
				if(message.embeds[0].title){
					work.setName(message.embeds[0].title);
				}
				if(message.embeds[0].description){
					work.setDescription(message.embeds[0].description);
				}
			}
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
			var writer = DirStore.get(message.author.id);
			if(!writer){
				writer = DirStore.create(message.author.id, message.author.username);
			}
			var work = writer.create(message.id);
			work.setLink(message.url);
			work.setMessage(message);

			message.react(TOREAD)
			.then(()=>message.react(READING))
			.then(()=>message.react(CRITIQUED));
		}

		if(message.channel.id == "567351040186515456" || message.channel.id == "567068929994784798"){
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
						getDir(message);
					break;
					case "reading":
						getReading(message);
					break;
					case "toread":
						getToread(message);
					break;
					case "help":
						message.channel.send(message.author.toString() + " I am sending you a DM");
						help(message.author);
					break;
					case "random":
						getRandomWork(message);
					break;
					default:
						if(message.mentions){
							getNextWorkByAuthor(message);
						}
						else{
							message.reply("unknown ~critique command");
						}
					break;
				}
			}
		}
	});

}

module.exports = {
  name: 'critique',
  description: 'critique',
  init(Discord, client, logger, memory){
    stcritique = new Critique(Discord, client, logger, memory);
  }
};