function TicTacToe(Discord, client, logger, memory){

	const GAMECHANNEL = "568459117417725970";

	function Game(player1, player2, channel){
		var displaytext;
		var botmessage;

		var wintable = [
			[true,false,false,false,true,false,false,false,true],
			[true,true,true,false,false,false,false,false,false],
			[true,false,false,true,false,false,true,false,false],
			[false,false,false,true,true,true,false,false,false],
			[false,false,true,false,true,false,true,false,false],
			[false,true,false,false,true,false,false,true,false],
			[false,false,false,false,false,false,true,true,true],
			[false,false,true,false,false,true,false,false,true]
		];

		var players = [0];//[player1Id, player2Id];
		var moves = [0,0,0,0,0,0,0,0,0];//[1,0,2,0,1,2,0,0,1];
		var icons = [0,":o:",":x:"];

		//emoji controls 1 to 9
		var moveControls = ["1%E2%83%A3","2%E2%83%A3","3%E2%83%A3","4%E2%83%A3","5%E2%83%A3","6%E2%83%A3","7%E2%83%A3","8%E2%83%A3","9%E2%83%A3"];
		var mvcMap = {"1%E2%83%A3":':one:',"2%E2%83%A3":":two:","3%E2%83%A3":":three:","4%E2%83%A3":":four:","5%E2%83%A3":":five:","6%E2%83%A3":":six:","7%E2%83%A3":":seven:","8%E2%83%A3":":eight:","9%E2%83%A3":":nine:"};
		var optionControls = [];
		var controls; /*add help & close*/

		var currentPlayer;

		var UI = new function(){

			var steps = 0;

			var title = "";
			var game = "";
			var gametemplate = ":one: | :two: | :three:\n\n:four: | :five: | :six:\n\n:seven: | :eight: | :nine:\n\n";

			this.new = function(){
				logger.info("new game");

				title = "Tic Tac Toe\n" + players[1] + " " + icons[1] + " vs " + players[2] + " " + icons[2] + "\n\n";
				//start a fresh game
				game = gametemplate;
				controls = moveControls.concat(optionControls);

				UI.next();
			};

			this.next = function(){
				turntext = "It's " + currentPlayer + "'s turn";

				botmessage.clearReactions().then( async function(){
					botmessage.edit(title + game + turntext);
					buildControls();
					awaitInput();
				});
			};

			async function buildControls(){
				for(var mvc in controls){
					steps++;
					await botmessage.react(controls[mvc]).then(()=>steps--);
				}
			}
			
			this.move = function(emoji){
				var player = players.indexOf(currentPlayer);
				var move = moveControls.indexOf(emoji);

				if(makeMove(move, player)){
					//turn
					game = game.replace(mvcMap[emoji], icons[player]);
					turn();
				}
				else
				{
					//can't make move, try again
					pauseMessage("Can not make move for" + currentPlayer + ". try again");
				}

				//remove move from possible moves
				controls.splice(controls.indexOf(emoji),1);
			};

			this.reset = function(){
				botmessage.clearReactions().then(function(m){
					botmessage = m;

					UI.build();
					awaitInput();
				});
			};

			this.winner = function(){
				botmessage.clearReactions().then(m=>m.edit(title + game + currentPlayer + " has won!"));
			};

			this.tied = function(){
				botmessage.clearReactions().then(m=>m.edit(title + game + "It's a tie!"));
			};

			function pauseMessage(text){
				botmessage.edit(text);

				setTimeout(function(){
					UI.reset();
				}, 5000);
			}

			function awaitInput(){
				const filter = (reaction, user) => {
					//logger.info(user.toString() + " " + currentPlayer);
				    return !user.bot && controls.includes(reaction.emoji.identifier) && user.toString()==currentPlayer;
				};

				botmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
				    const reaction = collected.first();
				    const emoji = reaction.emoji.identifier;

				    if( moveControls.indexOf(emoji) > -1 ){
				    	UI.move(emoji);
				    }

				})
				.catch(collected => {
				    //no input received, player has not made a move
				    logger.info("A booboo?");
				});
			}

		};

		function start(){
			logger.info("game started");

			players.push(player2.toString());
			players.push(player1.toString());

			logger.info("players assigned");

			currentPlayer = player2.toString();

			UI.new();
		}

		function turn(){
			if(!checkWinner()){
				currentPlayer = players[ !currentPlayer ? 1 : ( (players.indexOf(currentPlayer) == 1) ? 2 : 1 ) ];
				UI.next();
			}
		}

		/* moves 0 to 9 */
		function makeMove(move, player){
			if(moves[move]==false){
				moves[move] = player;
				return true;
			}
			return false;
		}

		function compareToWinTable(pmoves){
			logger.info("run compare function");

			for(var t in wintable){
				var table = wintable[t];
				var count = 0;
				for(var p in table){
					if(table[p] && pmoves[p]){
						count++;
					}
				}
				if(count==3){
					return true;
				}
			}

			logger.info("no win match found");

			return false;
		}

		function checkWinner(){
			var pmoves = moves.map(n=>n==players.indexOf(currentPlayer));
			var gameover = moves.filter(n=>n!=0).length == moves.length;

			if( compareToWinTable(pmoves) ){
				//player 1 has won
				UI.winner();
				return true;
			}
			if(gameover){
				UI.tied();
				return true;
			}

			return false;
		}

		function invite(){
			var mtext = player1.toString() + " invited " + player2.toString() + " for a game of Tic Tac Toe.\n\n Do you accept? Please choose :white_check_mark: or :no_entry: underneath.";
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
				    m.edit(player2 + " dit not respond.");
				});
			});
		}

		invite();
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

		switch(command){
			case 'tictactoe':
            	//message.channel.send("command is setup properly").then((m)=>botmessage = m);
            	var invited = message.mentions.members.first();

            	var test = new Game(message.author, invited, message.channel);
            break;
		}
	});
}

module.exports = {
  name: 'tictactoe',
  description: 'tictactoe',
  init(Discord, client, logger, memory){
    tictactoe = new TicTacToe(Discord, client, logger, memory);
  }
};