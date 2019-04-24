function Hangman(Discord, client, logger, memory){

	const COMMAND = "hangman";
	const GAMECHANNEL = "568459117417725970";
	const TIME = 60;
	const TIMEOUT = 30;

	var game;
	var canjoin;

	function Game(author, channel){
		var word;
		var players = [];
		var turns = [];
		var tries = {};
		var gameword;
		var maskedword;
		var guessed = "";
		var wrong = "";
		var attempts = 0;
		var text = "A new game of hangman";
		var currentPlayer;
		var words = ["GET BACK TO WRITING. Yes you where bound to lose this one. beep boop","marketing","publisher","agent","novel","book","story","butter","bread","thick","whatamidoingwithmylife","dadjoke","iamabotbeepboop","writing","write","author","description","dialogue","palindrome","boring","thekingsgame","theoracle","bloodfromastone","blackknight","spidermonkey","ooulthululu","cat","shouldntyoubewriting","procrastination","arc","character","paragraph","plot","idiom","macguffin","foreshadowing","chekhov","draft","prose","aesthetics","heterodiegetic","homodiegetic","omniscient","narrator","narrative","protagonist","antagonist","awkward","bagpipes","banjo","bungler","croquet","crypt","dwarves","fervid","fishhook","fjord","gazebo","gypsy","haiku","haphazard","hyphen","ivory","jazzy","jiffy","jinx","jukebox","kayak","kiosk","klutz","memento","mystify","numbskull","ostracize","oxygen","pajama","phlegm","pixel","polka","quad","quip","rhythmic","rogue","sphinx","squawk","swivel","toady","twelfth","unzip","waxy","wildebeest","yacht","zealous","zigzag","zippy","zombie"];

		var TurnTimer = new function(){
			var timeout;
			var timedout = 0;

			function timer(){
				clearTimeout(timeout);
				timedout++;

				if(timedout==players.length){
					//all players timedout
					game = false;
					maskedword = gameword;
					text = "All players unresponsive. Game over! :dizzy_face:";
					UI.draw();
				}else{
					text = currentplayer + " is unresponsive. Turning to the next :upside_down:";
					turn();
					UI.draw();
				}
			}

			this.start = function(){
				timeout = setTimeout(timer, TIMEOUT * 1000);
			};

			this.stop = function(){
				timedout = 0;
				clearTimeout(timeout);
			};
		}

		function start(){
			canjoin = false;

			if(!players.length){
				game = false;
				if(word){
					channel.send("No players joined the game. Sorry " + author + " i did like your word! :upside_down:");
					return;
				}
				else {
					channel.send("No players. I guess I'll hang by myself then :upside_down:");
					return;
				}
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
			TurnTimer.stop();
			if(!game){
				//gameover no need to turn
				return;
			}
			if(players.length){
				if(!turns.length){
					turns = players.slice();
				}
				currentPlayer = turns.shift();

				text += "\n\nit's " + currentPlayer + "'s turn. You have " + TIMEOUT + "sec\nType a letter or guess the entire word.\nor ~leave to stop.";

				TurnTimer.start();
			}else{
				game = false;
				text = "All players have left the game. Game over :dizzy_face:";
			}
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

				//add spaces
				var s = 6-word.length;
				if(s){
					for(var i=0;i<s;i++){
						display += ":black_large_square:";
					}	
				}

				return display;
			}

			function getPlayersString(){
				var display = "";
				for(var i in players){
					display += players[i].username + "\n";
					display += (tries[ players[i].id ] ? tries[ players[i].id ] : "") + "\n";
				}
				return display;
			}

			this.draw = function(){
				const embed = new Discord.RichEmbed();
				embed.setTitle("Playing a game of Hangman");
				embed.setDescription(text);
          		embed.setImage(getImage());
          		embed.addField("players", getPlayersString());
          		embed.addField("Word", getWordEmojis(maskedword, true) );
          		embed.addField("Wrong", wrong ? getWordEmojis(wrong, false) : "n/a");
          		embed.setFooter("Made by Percy");

				channel.send(embed);
			};
		};

		this.takeGuess = function(guess){
			guess = guess.toLowerCase();
			if(guess.search(/[^a-z]/) > -1){
				text = "Word or letter supplied is invalid. Please try again! :open_mouth:"
				UI.draw();
				return;
			}
			if(guess.length > 1){
				//trying to guess whole word
				if(gameword == guess){
					//player guessed the word
					text = currentPlayer + " you guessed it! :trophy:";
					maskedword = guess;
					setTry(true);
					game = false;
				}
				else{
					//wrong guess
					attempts++;
					setTry(false);
					text = "You guessed wrong! try again! :thinking:";	
				}
			}else{
				//geussing one letter
				if(gameword.indexOf(guess) > -1){
					guessed += guess;
					setTry(true);

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
						setTry(false);

						text = "**" + guess + "** is wrong. try again! :weary:";

						logger.info(attempts);
						if(attempts == 6){
							text = "game over! :dizzy_face:";
							game = false;
							maskedword = gameword;
						}
					}else{
						text = "Letter has already been tried. Guess again! :smirk:";
					}
				}
			}
			turn();
			UI.draw();
		}

		function setTry(tried){
			if(!tries[currentPlayer.id]){
				tries[currentPlayer.id] = "";
			}
			tries[currentPlayer.id] += tried ? ":white_check_mark:" : ":x:";
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

		this.leave = function(user){
			players = players.filter(u=>u.id != user.id);
			channel.send(user + " has left the game!");
			if(currentPlayer.id == user.id){
				logger.info("currentplayer has left");
				turn();
				UI.draw();
			}
		};

		this.isAuthor = function(user){
			return author.id == user.id;
		};

		this.setWord = function(chosenWord){
			if(chosenWord.toLowerCase().search(/[^a-z]/) ==- 1){
				word = chosenWord.toLowerCase();
				players = players.filter(u=>u.id!=author.id);
				author.send("Your chosen word is: **" + chosenWord + "**\nenjoy watching the game.");
			}else{
				author.send("**" + chosenWord + "** contains unsupported characters. Give me a new one.");
			}
		};

		this.hasWord = function(){
			return word;
		};

		this.isCurrentPlayer = function(user){
			if(!currentPlayer){
				return false;
			}
			return currentPlayer.id == user.id;
		};

		function run(){
			canjoin = true;
			players.push(author);
			channel.send(author + " started a new game of hangman. The game will be started in " + TIME + "sec.\n" + author + " has auto joined\n~join to join or ~leave to leave (when you are already in game)");
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

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		if(canjoin && message.channel.type == "dm" && game.isAuthor(message.author) && !game.hasWord()){
			game.setWord(message.content);
		}

		if(canjoin && command == "join"){
			game.join(message.author);
			return;
		}
		if(game && command == COMMAND){
			message.channel.send("game already in progress");
			return;
		}
		if(game && (command == "leave" || command == "stop")){
			game.leave(message.author);
			return;
		}
		if(game){
			//game in progress
			if(game.isCurrentPlayer(message.author)){
				game.takeGuess(message.content);
			}
			return;
		}
		
		if(command == COMMAND){
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