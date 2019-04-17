function Hangman(Discord, client, logger, memory){

	const GAMECHANNEL = "567351040186515456";
	const TIME = 60;

	var game;
	var canjoin;

	function Game(author, channel){
		var word;
		var players = [];
		var turns = [];
		var gameword;
		var maskedword;
		var guessed = "";
		var wrong = "";
		var attempts = 0;
		var text = "A new game of hangman";
		var currentPlayer;
		var words = ["awkward","bagpipes","banjo","bungler","croquet","crypt","dwarves","fervid","fishhook","fjord","gazebo","gypsy","haiku","haphazard","hyphen","ivory","jazzy","jiffy","jinx","jukebox","kayak","kiosk","klutz","memento","mystify","numbskull","ostracize","oxygen","pajama","phlegm","pixel","polka","quad","quip","rhythmic","rogue","sphinx","squawk","swivel","toady","twelfth","unzip","waxy","wildebeest","yacht","zealous","zigzag","zippy","zombie"];

		function start(){
			canjoin = false;

			if(!players.length){
				game = false;
				channel.send("No players joined the game. Sorry " + author + " i did like your word! :upside_down:");
				return;
			}

			if(!word){
				word = words[Math.floor(Math.random() * words.length)];
			}

			if(word){
				gameword = word;
				maskedword = gameword.replace(/./gi,'#');

				logger.info(gameword + " " + maskedword);
				turn();
				UI.draw();
			}
		}

		function turn(){
			if(!game){
				//gameover no need to turn
				return;
			}
			if(!turns.length){
				turns = players.slice();
			}
			currentPlayer = turns.shift();

			text += "\n\nit's " + currentPlayer + "'s turn\nType a letter or guess the entire word.";
		}

		var UI = new function(){
			var images = [
				"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Hangman-0.png/60px-Hangman-0.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Hangman-1.png/60px-Hangman-1.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Hangman-2.png/60px-Hangman-2.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Hangman-3.png/60px-Hangman-3.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Hangman-4.png/60px-Hangman-4.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Hangman-5.png/60px-Hangman-5.png",
				"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Hangman-6.png/60px-Hangman-6.png"
			];

			var prefix = "regional_indicator_";

			function getImage(){
				return images[ attempts ];
			}

			function getWordEmojis(word, good){
				var display = "";
				for(var l=0;l<word.length;l++){
					if(word[l]!="#"){
						display += ":" + prefix + word[l] + ":";
					}else{
						display += ":hash:";
					}
				}
				return display;
			}

			this.draw = function(){
				const embed = new Discord.RichEmbed();
				embed.setTitle("Playing a game of Hangman");
				embed.setDescription(text);
          		embed.setImage(getImage());
          		embed.addField("Word", getWordEmojis(maskedword, true) );
          		embed.addField("Wrong", wrong ? getWordEmojis(wrong, false) : "n/a");

				channel.send(embed);
			};
		};

		this.takeGuess = function(guess){
			if(guess.length > 1){
				//trying to guess whole word
				if(gameword == guess){
					//player guessed the word
					text = currentPlayer + " you guessed it! :trophy:";
					maskedword = guess;
					game = false;
				}
				else{
					//wrong guess
					attempts++;
					text = "You guessed wrong! try again! :thinking:";	
				}
			}else{
				//geussing one letter
				if(gameword.indexOf(guess) > -1){
					guessed += guess;

					text = "**" + guess + "** is correct. keep going! :smiley:";
					//the guess was correct
					maskedword = gameword.replace(new RegExp("[^" + guessed + "]","gi"),'#');

					logger.info(maskedword);
					if(maskedword == gameword){
						text = currentPlayer + " you won! :trophy:";
						game = false;
					}
				}else{
					if(wrong.indexOf(guess) == -1){
						//the guess was incorrect
						wrong += guess;
						attempts++;

						text = "**" + guess + "** is wrong. try again! :weary:";

						logger.info(attempts);
						if(attempts == 6){
							text = "game over! :dizzy_face:";
							game = false;
						}
					}else{
						text = "Letter has already been tried. Guess again! :smirk:";
					}
				}
			}
			turn();
			UI.draw();
		}

		this.join = function(user){
			if(players.length){
				if(players.filter(p=>p.id==user.id).length){
					channel.send(user + " has already joined the game.");
					return;
				}
			}
			players.push(user);
			channel.send(user + " has joined the game!");
		};

		this.isAuthor = function(user){
			return author.id == user.id;
		};

		this.setWord = function(chosenWord){
			word = chosenWord;

			players = players.filter(u=>u.id!=author.id);
		};

		this.isCurrentPlayer = function(user){
			return currentPlayer.id == user.id;
		};

		function run(){
			canjoin = true;
			players.push(author);
			channel.send(author + " started a new game of hangman. The game will started in " + TIME + "sec.\n~join to join");
			author.send("You can supply me with a word that will be used in game.\nIf you do, you will not participate yourself.\nReply your chosen word within " + TIME + "sec or ignore.");
			setTimeout(function(){
				start();
			}, TIME * 1000);
		}

		run();

	}

	client.on("message", message => {
		if(message.author.bot){
			return;
		}

		if(canjoin && message.channel.type == "dm" && game.isAuthor(message.author)){
			message.reply("Your chosen word is: **" + message.content + "**\nenjoy watching the game.");
			game.setWord(message.content);
		}

		if(message.channel.id!=GAMECHANNEL){
			return;
		}

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		if(canjoin && command == "join"){
			game.join(message.author);
			return;
		}
		if(game && command == 'hangman'){
			message.channel.send("game already in progress");
			return;
		}
		if(game){
			//game in progress
			if(game.isCurrentPlayer(message.author)){
				game.takeGuess(message.content);
			}
			return;
		}
		
		if(command == 'hangman'){
            game = new Game(message.author, message.channel);
            return;
		}
	});
}

module.exports = {
  name: 'hangman',
  description: 'hangman',
  init(Discord, client, logger, memory){
    tictactoe = new Hangman(Discord, client, logger, memory);
  }
};