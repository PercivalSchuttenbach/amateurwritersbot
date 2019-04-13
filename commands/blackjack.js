var logger;
var bot;
var channelID;

var Blackjack = new function(){
  var deck = [];
  var dealer;
  var players = {};
  var currentPlayer;
  var turns = [];

  function Dealer(){
    var cards = [];
    var suits = [];
    var dealerCards;

    this.clearCards = function(){
      cards = [];
      suits = [];
    }
    this.addCard = function(card){
      cards.push(card);
    };
    this.addSuit = function(suit){
      suits.push(suit);
    };
    this.getCards = function(){
      return cards;
    };
    this.getSuits = function(){
      return suits;
    };
    this.showCards = function(){
      //player can't know the value of the dealer's cards, replace with a -- placeholder
      //document.getElementById("dealerscore").innerHTML = "--";
      if (cards.length > 1) {
        var passcards = cards.slice(1, 2);
        var passsuits = suits.slice(1, 2);
        return drawcards(passcards, suits);
        //sendMessage("dealer cards");
        //sendMessage(dealerCards);
      }
    }

  }

  function Player(user){
    //player properties
    var userDiscordId = null;
    var joined = true;
    var money = 100;
    var cards = [];
    var suits = [];
    var bet = 5;
    var playerCards;
    var name = user;

    //user methods
    this.getName = function(){
      logger.info('player name:' + name);
      return name;
    };

    //Methods
    //joining & leaving
    this.hasJoined = function(){
      return joined;
    };
    this.join = function(){
      joined = true;  
    };
    this.leave = function(){
      joined = false;  
    };

    //cards
    this.clearCards = function(){
      cards = [];
      suits = [];
    };
    this.addCard = function(card){
      cards.push(card);
    };
    this.addSuit = function(suit){
      suits.push(suit);
    };
    this.getCards = function(){
      return cards;
    };
    this.getSuits = function(){
      return suits;
    };
    this.showCards = function(){
      return drawcards(cards, suits);
    }

    //money functions
    this.getMoney = function(){
      return money;
    };
    this.getBet = function(){
      return bet;
    };
    this.raise = function(amount){
      if( (money - (bet + amount) ) < 0){
        //not enough money to cover the raise
        return false;
      }
      else {
        //increase bet
        bet += amount;
      }
      return true;
    };
    this.canCoverBet = function(){
      return bet > money;
    };
    this.deductBet = function(){
      money -= bet;
    } 
  }


  //var elems = document.getElementsByClassName('debutton');

  /////
  function getUser(user){
    if(!players[user]){
      players[user] = new Player(user);
    }
    return players[user];
  }

  function turn(toDeal){
    logger.info('turning player');

    //all players had a turn, repopulate
    if(!turns.length){
      for(var player in players){
        turns.push(players[player]);
      }
      //restart game / reshuffle deck
    }
    if(toDeal){
      deal();
    }
    //first item in array is the current player
    currentPlayer = turns.shift();
  }

  function checkTurn(user){
    return currentPlayer == user;
  }

  function inSession(){
    //if turns array is populated a game is in session
    return turns.length;
  }

  /*PUBLIC METHODS */

  this.inSession = inSession;

  this.join = function(user){
    //get user from memory
    var player = getUser(user);
    if(player.hasJoined()){
      //player has already joined the game
    }else{
      player.join();
    }
  };
  
  this.leave = function(user){
    var player = getUser(user);
    if(!player.hasJoined()){
      //player already left the game
    }else{
      player.leave();
      //if the current turn is that of the user, go to next turn
      if(checkTurn(user)){
        turn();
      }
    }
  };

  this.raise = function(user, amount){
    var player = getUser(user);
    var raised = player.raise(amount);
    var bet = player.getBet();

    if(raised){
      //sufficient funds
    }else{
      //insufficient funds
    }
  };

  //play methods
  this.hit = function(user){
    if(checkTurn(user)){
      //process
    }else{
      //await your turn
    }
  };

  this.stay = function(user){
    if(checkTurn(user)){
      //process
    }else{
      //await your turn
    }
  };

  this.deal = function(user){
    var player = getUser(user);
    //check if game is in session
    if(inSession()){
      //game already in session, fold or hit?
      sendMessage("Game already in session");
    }else{
      logger.info('turn with deal');

      turn(true);
    }
  };

  //////////

  function sendMessage(m){
    //logger.info('sending message:' + m);
    
    bot.sendMessage({
        to: channelID,
        message: m
    });
  }

  //Deal button clicked
  function deal() {
    var message;
    deck = [];
    //dealer
    dealer.clearCards();
    pullcard(dealer);
    pullcard(dealer);

    logger.info('turning for: ' + turns.join('|'));

    for(var p in turns){
      var player = turns[p];
      //make sure player has enough money to play
      logger.info('check if player can cover bet');
      if(player.canCoverBet()){

        //document.getElementById("message").innerHTML = "Not enough money!";
        sendMessage(player.getName() + ": Not enough money!");
        return true;
      }
      logger.info('player can cover bet');
      player.clearCards();
      logger.info('cards cleared');
      pullcard(player);
      pullcard(player);
      logger.info('cards pulled');

      //transfers the bet amount to the bet variable
      bet = player.getBet();
      //Sets play buttons back to visable and hides bet buttons
      //document.getElementById("ddbutton").style.visibility = "visible";
      //document.getElementById("stbutton").style.visibility = "visible";
      //document.getElementById("htbutton").style.visibility = "visible";
      //elementclasses are stupid and return a set, so i have to iterate through the array to hide them all
      //for(var i = 0; i != elems.length; ++i)
      //{
      //  elems[i].style.visibility = "hidden"; 
      //}
      //changes under message to display the bet amount
      //document.getElementById("message").innerHTML = "You bet $" + bet;
      sendMessage("You bet $" + bet);
      //takes bet amount from money
      player.deductBet();
      logger.info('bet deducted');

      //updates money html
      //document.getElementById("playermoney").innerHTML = "$" + money;
      //updates double down cost
      //document.getElementById("ddbutton").innerHTML = "Double Down -$" + bet;
    }

    //sendMessage('dealercards:\n' + dealerCards);
    logger.info('next step is drawing cards');
    drawAllCards();
  }

  function drawAllCards(){
    for(var p in turns){
      var player = turns[p];
      sendMessage(player.getName() + ": " + player.showCards() );
    }
    sendMessage('dealer: ' + dealer.showCards() );

  }

  //pulls a card for 0 (dealer) or 1 (player)
  function pullcard(player) {
    var keepgoing = true;
    var cardpull;
    var suit;
    var value = 0;
    //makes sure all cards haven't been played yet.
    if (deck.length < 52) {
      while (keepgoing) {
        cardpull = Math.floor((Math.random() * 52) + 1);
        keepgoing = false;
        //checks to see if that card was pulled from the deck previously
        for (i = 0; i < deck.length; i++) {
          if (cardpull == deck[i]) {
            keepgoing = true;
          }
        }
      }
      deck.push(cardpull);
      //checks the suit of the card
      if (cardpull <= 13) {
        suit = "♠"
      } else if (cardpull <= 26) {
        suit = "♥"
        cardpull -= 13;
      } else if (cardpull <= 39) {
        suit = "♦"
        cardpull -= 26;
      } else if (cardpull <= 52) {
        suit = "♣"
        cardpull -= 39;
      }
      //checks who the game is pulling cards for and pushes the card value and suit into the arrays

      player.addCard(cardpull);
      player.addSuit(suit);
      //document.getElementById("playerscore").innerHTML = calcscore(playercards);
      //document.getElementById("playercards").innerHTML = drawcards(playercards, playersuits);

      //sendMessage("player cards");
      //sendMessage(playerCards);
    
      return true;
    }
    return "ERROR";
  }

  //hit button clicked
  function hit() {
    //adds a card for the player
    pullcard(1);

    sendMessage('playercards:\n' + playerCards);

    //document.getElementById("ddbutton").style.visibility = "hidden";
    //calculate the score to see if the game is over
    if (calcscore(playercards) > 21) {
      stand();
    }

  }

  //stand button clicked (ends round)
  function stand() {
    //hides play buttons, reveals bet buttons
    //document.getElementById("ddbutton").style.visibility = "hidden";
    //document.getElementById("stbutton").style.visibility = "hidden";
    //document.getElementById("htbutton").style.visibility = "hidden";
    //for(var i = 0; i != elems.length; ++i)
    //{
    //  elems[i].style.visibility = "visible"; // hidden has to be a string
    //}
    //plays the dealer's turn, hits up to 17 then stands
    dealerplay();
    
    //calculates the scores and compares them
    var playerend = calcscore(playercards);
    var dealerend = calcscore(dealercards);
    if (playerend > 21) {
      //document.getElementById("message").innerHTML = "YOU BUSTED!";
      logger.info("YOU BUSTED!");
      sendMessage("YOU BUSTED!");
    } else if (dealerend > 21 || playerend > dealerend) {
      //document.getElementById("message").innerHTML = "YOU WIN! $" + 2 * bet;
      logger.info("YOU WIN! $" + 2 * bet);
      sendMessage("YOU WIN! $" + 2 * bet);
      money += 2 * bet;
    } else if (dealerend == playerend) {
      //document.getElementById("message").innerHTML = "PUSH! $" + bet;
      logger.info("PUSH! $" + bet);
      sendMessage("PUSH! $" + bet);
      money += bet;
    } else {
      //document.getElementById("message").innerHTML = "DEALER WINS!";
      logger.info("DEALER WINS!");
      sendMessage("DEALER WINS!");
    }
    //document.getElementById("playermoney").innerHTML = "$" + money;
  }

  //double down button clicked, hits once then immediately stands after doubling the bet.
  function doubledown() {
    //makes sure the player have enough money to double down
    if(money < bet){
      //document.getElementById("message").innerHTML = "Not enough money to double down!";
      logger.info("Not enough money to double down!");
      return true;
    }
    //doubles the bet
    money -= bet;
    bet *= 2;
    hit();
    stand();
  }

  //called once a stand() is reached, could shove this code in stand as that's the only time it's called, but I kind of like it seperate
  function dealerplay() {
    while (calcscore(dealercards) < 17) {
      pullcard(0);
    }
    sendMessage('dealercards:\n' + dealerCards);
    //document.getElementById("dealerscore").innerHTML = calcscore(dealercards);
    //document.getElementById("dealercards").innerHTML = drawcards(dealercards, dealersuits);
  }

  //takes in an array of card values and calculates the score
  function calcscore(cards) {
    var aces = 0;
    var endscore = 0;

    //count cards and check for ace
    for (i = 0; i < cards.length; i++) {
      if (cards[i] == 1 && aces == 0) {
        aces++;
      } else { //if it's not an ace
        if (cards[i] >= 10) {
          endscore += 10;
        } else {
          endscore += cards[i];
        }
      }
    }

    //add ace back in if it existed
    if (aces == 1) {
      if (endscore + 11 > 21) {
        endscore++;
      } else {
        endscore += 11;
      }
    }
    return endscore;
  }

  //ascii drawing, takes the number of cards in the array and draws 5 lines
  function drawcards(cards, suits) {
    var showcards = [];
    if(cards === undefined){
      return;
    }

    if (cards.length == 1){
      showcards.push("/////");
    }
    
    for(var i in cards){
      showcards.push("/ " + cardvalue(cards[i]) + ' ' + suits[i] + " /");
    }
    return showcards.join(' __ ');
  }

  //fixes for ace jack queen and king cards from their 1 11 12 13 values, used for drawing ascii
  function cardvalue(cardnum) {
    if (cardnum == 1) {
      return "A";
    }
    if (cardnum == 11) {
      return "J";
    }
    if (cardnum == 12) {
      return "Q";
    }
    if (cardnum == 13) {
      return "K";
    } else return cardnum;
  }

  dealer = new Dealer();
};

module.exports = {
  name: 'blackjack',
  description: 'blackjack',
  init(client, log){
    logger = log;
    bot = client; 
  },
  execute(message, args, user, channel) {
    channelID = channel;
    logger.info('blackjack called');

    logger.info('blackjack handler args: ' + args.join('|'));
    switch(args[0]){
      case "deal":
         logger.info('blackjack deal');
         Blackjack.deal(user);
      break;
      case "hit":
       logger.info('blackjack hit');
        Blackjack.hit(user);
      break;
      case "stand":
        logger.info('blackjack stand');
        Blackjack.stand(user);
      break;
    }

  },
};