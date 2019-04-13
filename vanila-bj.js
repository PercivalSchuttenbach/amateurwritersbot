var money = 100;
var deck = [];
var dealercards = [];
var playercards = [];
var dealersuits = [];
var playersuits = [];
var bet = 10;
var elems = document.getElementsByClassName('debutton');

//Deal button clicked
function deal(playerbet) {
  //make sure player has enough money to play
  if(playerbet > money){
    document.getElementById("message").innerHTML = "Not enough money!";
    return true;
  }
  deck = [];
  dealercards = [];
  playercards = [];
  pullcard(0);
  pullcard(0);
  pullcard(1);
  pullcard(1);
  //transfers the bet amount to the bet variable
  bet = playerbet;
  //Sets play buttons back to visable and hides bet buttons
  document.getElementById("ddbutton").style.visibility = "visible";
  document.getElementById("stbutton").style.visibility = "visible";
  document.getElementById("htbutton").style.visibility = "visible";
  //elementclasses are stupid and return a set, so i have to iterate through the array to hide them all
  for(var i = 0; i != elems.length; ++i)
  {
    elems[i].style.visibility = "hidden"; 
  }
  //changes under message to display the bet amount
  document.getElementById("message").innerHTML = "You bet $" + bet;
  //takes bet amount from money
  money -= bet;
  //updates money html
  document.getElementById("playermoney").innerHTML = "$" + money;
  //updates double down cost
  document.getElementById("ddbutton").innerHTML = "Double Down -$" + bet;
}

//pulls a card for 0 (dealer) or 1 (player)
function pullcard(playernum) {
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
      suit = "@"
    } else if (cardpull <= 26) {
      suit = "*"
      cardpull -= 13;
    } else if (cardpull <= 39) {
      suit = "%"
      cardpull -= 26;
    } else if (cardpull <= 52) {
      suit = "!"
      cardpull -= 39;
    }
    //checks who the game is pulling cards for and pushes the card value and suit into the arrays
    if (playernum == 0) {
      dealercards.push(cardpull);
      dealersuits.push(suit);
      //player can't know the value of the dealer's cards, replace with a -- placeholder
      document.getElementById("dealerscore").innerHTML = "--";
      if (dealercards.length > 1) {
        var passcards = dealercards.slice(1, 2);
        var passsuits = dealersuits.slice(1, 2);
        document.getElementById("dealercards").innerHTML = drawcards(passcards, dealersuits);
      }

    }
    if (playernum == 1) {
      playercards.push(cardpull);
      playersuits.push(suit);
      document.getElementById("playerscore").innerHTML = calcscore(playercards);
      document.getElementById("playercards").innerHTML = drawcards(playercards, playersuits);
    }
    return true;
  }
  return "ERROR";
}

//hit button clicked
function hit() {
  //adds a card for the player
  pullcard(1);
  document.getElementById("ddbutton").style.visibility = "hidden";
  //calculate the score to see if the game is over
  if (calcscore(playercards) > 21) {
    stand();
  }

}

//stand button clicked (ends round)
function stand() {
  //hides play buttons, reveals bet buttons
  document.getElementById("ddbutton").style.visibility = "hidden";
  document.getElementById("stbutton").style.visibility = "hidden";
  document.getElementById("htbutton").style.visibility = "hidden";
  for(var i = 0; i != elems.length; ++i)
  {
    elems[i].style.visibility = "visible"; // hidden has to be a string
  }
  //plays the dealer's turn, hits up to 17 then stands
  dealerplay();
  
  //calculates the scores and compares them
  var playerend = calcscore(playercards);
  var dealerend = calcscore(dealercards);
  if (playerend > 21) {
    document.getElementById("message").innerHTML = "YOU BUSTED!";
  } else if (dealerend > 21 || playerend > dealerend) {
    document.getElementById("message").innerHTML = "YOU WIN! $" + 2 * bet;
    money += 2 * bet;
  } else if (dealerend == playerend) {
    document.getElementById("message").innerHTML = "PUSH! $" + bet;
    money += bet;
  } else {
    document.getElementById("message").innerHTML = "DEALER WINS!";
  }
  document.getElementById("playermoney").innerHTML = "$" + money;
}

//double down button clicked, hits once then immediately stands after doubling the bet.
function doubledown() {
  //makes sure the player have enough money to double down
  if(money < bet){
    document.getElementById("message").innerHTML = "Not enough money to double down!";
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
  document.getElementById("dealerscore").innerHTML = calcscore(dealercards);
  document.getElementById("dealercards").innerHTML = drawcards(dealercards, dealersuits);
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
  var lines = ["", "", "", "", ""];
  var value = [];
  if (cards.length == 1) { //if only one card is passed we draw the first card face down
    lines = [".---.", "|///|", "|///|", "|///|", "'---'"];
  }
  //topline
  for (i = 0; i < cards.length; i++) {
    lines[0] += ".---.";
  }
  lines[0] += "</br>";

  //2nd line (contains value)
  for (i = 0; i < cards.length; i++) {
    lines[1] += "|" + cardvalue(cards[i]);
    if (cardvalue(cards[i]) == 10) {
      lines[1] += " |";
    } else {
      lines[1] += "&nbsp; |";
    }
  }
  lines[1] += "</br>";

  //3rd line (contains suit)
  for (i = 0; i < cards.length; i++) {

    lines[2] += "| " + suits[i] + " |";
  }
  lines[2] += "</br>";

  //4th line (contains value)
  for (i = 0; i < cards.length; i++) {
    if (cardvalue(cards[i]) == 10) {
      lines[3] += "| " + cardvalue(cards[i]) + "|";
    } else {
      lines[3] += "| &nbsp;" + cardvalue(cards[i]) + "|";
    }

  }
  lines[3] += "</br>";

  //bottom line
  for (i = 0; i < cards.length; i++) {
    lines[4] += "'---'";
  }
  lines[4] += "</br>";
  return lines[0] + lines[1] + lines[2] + lines[3] + lines[4];
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