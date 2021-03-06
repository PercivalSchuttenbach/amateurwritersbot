function ConnectFour(Discord, client, logger, memory){

	const COMMAND = "connectfour";
	const GAMECHANNEL = "652184396819857448";//"568459117417725970";
	const TIMEOUT = 60;

	var game;

	function Game(player1, player2, channel){
		var bot;
		var players = [];
		var turns = [];
		var text = "A new game of connect four";
		var currentPlayer;
		var botmessage;
		var winner = false;
		var winrgx ='1{4}|(1.{7}){3}1|(1.{8}){3}1|(.{6}1){4}';

		var board = [
			/*0*/[0,0,0,0,0,0,0,0],
			/*1*/[0,0,0,0,0,0,0,0],
			/*2*/[0,0,0,0,0,0,0,0],
			/*3*/[0,0,0,0,0,0,0,0],
			/*4*/[0,0,0,0,0,0,0,0],
			/*5*/[0,0,0,0,0,0,0,0],
		];

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

		function Bot(){
			var watch = [];

			function checkPlayerStrategy(){
				//1{4}|(1.{7}){3}1|(1.{8}){3}1|(.{6}1){4}

				var strategies = new RegExp('(?=((.{6}[02]){3}2)|(2(.{6}[02]){3})|(([02]{8}){3}2)|(2([02]{8}){3})(([02].{7}){3}2)|(2([02].{7}){3})|([02]{3}2)|(2[02]{3})(([02].{7}){3}2)|(2([02].{7}){3})|([02]{3}2)|(2[02]{3}))','g');
				var pboard = '';

				for(var r in board){
			       pboard += board[r].join('');
			    }

			    console.log(pboard);
			    console.log(pboard.match(strategies));
			}

			this.drop = function(){
				console.log('bot drops');
				checkPlayerStrategy();
			}
		}

		function checkWinner(){
		    var pboard = "";
		    var cp = currentPlayer.id == player2.id ? 1 : 2;

		    for(var r in board){
		       pboard += board[r].map(p=>p==cp?1:0).join('');
		    }

		    if(pboard.search(new RegExp(winrgx)) > -1){
		    	game = false;
		    	winner = true;
		    	text = currentPlayer + " has won!:trophy:";
		    }else{
		    	if(board[0].join('').search(/0/g)==-1){
		    		game = false;
		    		text = "GAME OVER\nNo winner";
		    		UI.draw();
		    	}
		    }
		    return;
		}

		function start(){
			logger.info("game started");

			players.push(player2);
			players.push(player1);

			if(player2.bot){
				players.reverse();
			}

			turn();
			UI.draw();
		}

		function turn(){
			logger.info("turn");
			//TurnTimer.stop();
			if(!game){
				//gameover no need to turn
				return;
			}
			if(players.length){
				if(!turns.length){
					turns = players.slice();
				}
				currentPlayer = turns.shift();

				text = "it's " + currentPlayer + "'s turn.";

				if(currentPlayer.bot){
					console.log('current player is the bot');
					bot.drop();
				}

				//TurnTimer.start();
			}else{
				game = false;
				text = "All players have left the game. Game over :dizzy_face:";
			}
		}

		var UI = new function(){
			var steps = 0;
			var controls = ["1%E2%83%A3","2%E2%83%A3","3%E2%83%A3","4%E2%83%A3","5%E2%83%A3","6%E2%83%A3","7%E2%83%A3","8%E2%83%A3"];
   			var numberMap = [":one:",":two:",":three:",":four:",":five:",":six:",":seven:",":eight:"];
   			var icons = ["⬛","🔴",'🔵',"⚪"];

   			function drawBoard(){
				var pboard = "";
				for(var r in board){
				   pboard += board[r].join('');
				}

				if(winner){
					var cp = currentPlayer.id == player2.id ? 1 : 2;			
					var rgx = new RegExp(winrgx.replace(/1/g,cp));
					pboard = pboard.replace(rgx,function(a,b,c,d){
						return a.replace(new RegExp(cp,"g"),3);
					});
				}
				pboard = pboard.replace(/./g,function(m,o,s){
					return (o > 7 ? icons[m] : numberMap[o]) + (o!=s.length-1 ? !((o+1)%8) ? '\n' : '|' : '');
				});
				return pboard;
		   }

			function getPlayersString(){
				var display = "";
				for(var i=0;i<players.length;i++){
					display += icons[i+1] + " " + players[i].username + "\n";
				}
				return display;
			}

			this.draw = function(){
				const embed = new Discord.RichEmbed();
				embed.setTitle("Playing a game of Connect Four");
				embed.setDescription(text);
          		embed.addField("players", getPlayersString());
          		embed.addField("--", drawBoard());
          		embed.setFooter("Made by Percy");

				botmessage.clearReactions().then( async function(){
					botmessage.edit(embed);
					if(game){
						buildControls();
						awaitInput();
					}
				});
			};

			async function buildControls(){
				for(var mvc in controls){
					if(!board[0][mvc]){
						steps++;
						await botmessage.react(controls[mvc]).then(()=>steps--);
					}
				}
			}

			function awaitInput(){
				const filter = (reaction, user) => {
					//logger.info(user.toString() + " " + currentPlayer);
				    return !user.bot && controls.includes(reaction.emoji.identifier) && user.id==currentPlayer.id && steps==0;
				};

				botmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
				    const reaction = collected.first();
				    const emoji = reaction.emoji.identifier;

				    var n = controls.indexOf(emoji);
				    if(n  > -1 ){
				    	logger.info("can be dropped");
				    	drop(n);
				    }

				})
				.catch(collected => {
				    //no input received, player has not made a move
				    game = false;
				    text = currentPlayer + " is not responding and has forfeited.\n" + turns.shift() + " has won :trophy:";
				    UI.draw();
				});
			}
		};

		function drop(n){
			var cp = currentPlayer.id == player2.id ? 1 : 2;
			var j = board.length;
		    while(j--){
		        if(!board[j][n]){
		            board[j][n] = cp;
		            break;
		        }
		    }
		    logger.info("dropped");
		    checkWinner();
			turn();
			UI.draw();
		}

		function invite(){
			var mtext = player1.toString() + " invited " + player2.toString() + " for a game of Connect Four.\n\n Do you accept? Please choose :white_check_mark: or :no_entry: underneath.";
			const filter = (reaction, user) => {
			    return !user.bot && ["%E2%9C%85", "%E2%9B%94"].indexOf(reaction.emoji.identifier) > -1 && user.id == player2.id;
			};

			channel.send(mtext).then(async function(m){
				botmessage = m;

				await m.react("%E2%9C%85");
				await m.react("%E2%9B%94");

				m.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
				    const reaction = collected.first();
				    const emoji = reaction.emoji.identifier;

				    if(emoji=="%E2%9C%85"){
				    	//yes
				    	logger.info("game accepted");
				    	start();
				    }
				    else{
				    	//no
				    	m.edit(player2 + " does not accept the game.");
				    }

				})
				.catch(collected => {
				    //no input received, player has not made a move
				    m.edit(player2 + " did not respond.");
				});
			});
		}

		if(!player2.bot){
			invite();
		}else{
			bot = new Bot();
			channel.send('Starting up the game').then((m)=>{
				botmessage=m;
				start();
			});
		}
		//start();

	}

	client.on("message", message => {
		if(message.author.bot){
			return;
		}

		if(message.channel.id!=GAMECHANNEL){
			return;
		}

		const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		
		if(command == COMMAND){
			if(message.mentions.users.size){
				var invited = message.mentions.users.first();
           		game = new Game(message.author, invited, message.channel);
           	}else{
           		message.reply("No other player was mentioned. To play a game use **~connectfour @user**");
           	}
            return;
		}
	});
}

module.exports = {
  name: 'connectfour',
  description: 'connectfour',
  init(Discord, client, logger, memory){
    connectfour = new ConnectFour(Discord, client, logger, memory);
  }
};