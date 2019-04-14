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
	            //reset start and counter when banter is not resumed within 15 minutes
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

	//listeners
	client.on("message", message => {
	  	if(message.author.bot){
	    	return;
	  	}
	  	if(message.channel.id=="522773675263655983"){
		  var currentTime = +new Date();
		  writingCallOut(message.author.id, message.content, currentTime, message.channel);
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