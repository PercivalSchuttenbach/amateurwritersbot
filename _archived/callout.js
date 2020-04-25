function Callout(client, logger, memory){

	function writingCallOut(userId, content, currentTime, channel){
	    //when writing or write is detected run. Writing or Write should be at the start of the word
	    if(content.toLowerCase().search('\\bwriting') > -1 || content.toLowerCase().search('\\bwrite') > -1){
	        logger.info('Writing callout check');
	        //check if memory storage is available
	        if(!memory['AmateurWritersBot']['writing']){
	            memory['AmateurWritersBot']['writing'] = { start: null, count: 0, cooldown: null };
	            logger.info('Created memory store');
	        }
	        var writingMemory = memory['AmateurWritersBot']['writing'];
	        //make sure it's non-obtrusive, run once every hour
	        if( !writingMemory.cooldown || (currentTime >= writingMemory.cooldown) ){
	            //reset start and counter when banter is not resumed within 5 minutes
	            if( !writingMemory.start || (currentTime - writingMemory.start) > (60 * 5 * 1000) ){
	                writingMemory.count = 0;
	                writingMemory.start = currentTime;
	            }

	            //keep incrementing if not yet counted banter 4 times
	            if(writingMemory.count != 4){
	                writingMemory.count++;
	            }else{
	                logger.info('All talk');
	                channel.send('All you guys talk about is writing. When are you going to start? :thinking:');

	                // make sure it's not fired again for at least an hour
	                writingMemory.cooldown = currentTime + (60 * 60 * 1000 * 3);
	                writingMemory.count = 0;
	            }
	        }
	    }
	}

	function initTallyMemory(){
		if(!memory['AmateurWritersBot']['tally']){
            memory['AmateurWritersBot']['tally'] = { run: false, start: null, count: [], cooldown: null, users: {}, timeout: false };
            logger.info('Created memory store for tally');
        }
        return memory['AmateurWritersBot']['tally'];
	}

	function keepTally(tally, user, content){
		console.log(`keep tally ${user.username}`);
		if(!tally.users[user.id]){
			tally.users[user.id] = {'u':user,'wc':0};
		}
		tally.users[user.id].wc += content.split(' ').length;

		return tally;
	}

	function listTally(tally, channel){
		var listing = '',total=0;
		for(var t in tally.users){
			listing += `${tally.users[t].u.username.replace(new RegExp(/\*/,'g'),'')} chatted: ${tally.users[t].wc} words\n`;
			total+=tally.users[t].wc;
		}
		channel.send(`Alright you guys, hands of the keyboards. The 10 minute "sprint" is over.\nThe results are in:\n\n${listing}\nAll chatters combined (total): ${total} words`);
	}

	function popListing(tally, channel, currentTime){
		clearTimeout(tally.timeout);

		listTally(tally, channel);
		tally.cooldown = currentTime + (60 * 60 * 1000 * 3);
		tally.run = false;
        tally.count = [];
        tally.users = {};
	}

	function writingTally(user, content, currentTime, channel){
		var tally = initTallyMemory();

		if( !tally.run ) return;

		console.log('tally running');

		if( !tally.cooldown || (currentTime >= tally.cooldown) ){
			keepTally(tally, user, content);

			if(tally.timeout) return;

			tally.timeout = setTimeout(function(){
				popListing(tally, channel, currentTime);
			}, (20*1000));
		}
	}

	//listeners
	client.on("message", message => {
	  	if(message.author.bot){
	    	return;
	  	}
	  	if(message.channel.id=="522773675263655983"){
		  var currentTime = +new Date();
		  //writingCallOut(message.author.id, message.content, currentTime, message.channel);
		}
		if(message.channel.id=="567068929994784798"){
			writingTally(message.author, message.content, currentTime, message.channel);
		}
	});
	client.on("typingStart", (channel,user) => {
		var currentTime = +new Date();
		if(channel.id=="567068929994784798"){
			var tally = initTallyMemory();
			if(!tally.start || ((currentTime - tally.start) > (60 * 1000)) && tally.count < 1){
				console.log('timer reset');
				tally.count = [];
				tally.start = currentTime;
			}
			if(tally.count.indexOf(user.id)==-1){
				tally.count.push(user.id);
			}
			if(tally.count.length > 0){
				tally.run = true;
			}
		}
	});
}

module.exports = {
  name: 'callout',
  description: 'callout',
  init(client, logger, memory){
    callout = new Callout(client, logger, memory);
  }
};