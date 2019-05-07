/*
* @namespace Battleship
* @param Discord, the Discord class Object
* @param Discord.Client client, the current Discord client
* @param Winston logger, Object that can log to the console or log file
* @param Object memory, contains the memory for the bot
* @const String COMMAND, the command to listen to for starting the game
* @const String GAMECHANNEL, the channel id the game can be started from
* @const Int TIMEOUT, the amount of time the game would wait before timing out and free resources
* @var Array game, contains all current games to be played
* @var Boolean debug, if debug mode is turned on
*/
function Battleship(Discord, client, logger, memory){

    const COMMAND = "battleship";
    const GAMECHANNEL = "568459117417725970";
    const TIMEOUT = 60;

    var game = [];
    var debug = true;

    function Game(player1, player2, key, channel){
        var botmessage;
        var abc = "abcdefghij";
        var gkey = key;
        var boardlength = 10, boardsize = boardlength*boardlength;
        var maxBoats = 10;
        var players = [],currentPlayer,cpi=-1,bot;
        var state = 1;//placement;
        var boats = [
            {'boat':['Destroyer',2,1],'count':4},
            {'boat':['Cruiser',3,2],'count':3},
            {'boat':['Battleship',4,3],'count':2},
            {'boat':['Carrier',5,4],'count':1}
        ];

        var Spectator = new function(){
            var output = {}, started = false;

            this.updateBoards = function(){
                var embed;
                if(!started){
                    showBoards();
                    return;
                }
                players.forEach(p=>{
                    embed = p.getUI().getDisplayUI()[1].getEmbed();
                    embed.setTitle(`${p.getUser().username}'s screen`);
                    output[p.getId()].edit(embed);
                });
            }

            function showBoards(){
                var embed; started = true;
                players.forEach(p=>{
                    embed = p.getUI().getDisplayUI()[1].getEmbed();
                    channel.send(embed).then(m=>output[p.getId()]=m);
                });
            }

        }

        /*
        * @name Boat
        * @description Data Model for a boat
        * @param String n, boat name
        * @param Int s, boat size
        * @param Int i, boat icon to be used on the board
        * @var String name, boat name
        * @var Int size, boat size
        * @var String icon, boat icon
        * @var Boolean destroyed, if the boat is destroyed
        * @var Array location, contains all indexes of the board the boat is placedon
        */
        function Boat(n,s,i){
            var name = n, size = s,icon=i,destroyed=false,effect=false;
            var location = [];

            /*@get size*/
            this.getSize = function(){
                return size;
            }
            /*@add location*/
            this.addToLocation = function(p){
                location[p] = false;
            }
            /*@get location*/
            this.getLocation = function(){
                return location;
            }
            /*@get name*/
            this.getName = function(){
                return name;
            }
            /*@get icon*/
            this.icon = function(){
                return icon;
            }
            /*@set destroyed*/
            this.setDestroyed = function(){
                destroyed=true;
            }
            /*@get destroyed*/
            this.isDestroyed = function(){
                return destroyed;
            }
            /*@set effect*/
            this.effectAdded = function(){
                effect = true;
            }
            /*@get effect*/
            this.isEffectAdded = function(){
                return effect;
            }
        }

        /**
        * @name Player
        * @description Data Model for the player
        * @param Discord.User u
        * @var Allocator allocator, responsible for allocating space for players boats
        * @var UI ui, players UI
        * @var Battlesystem battlesystem, handles firing on the opponents boards
        * @var Array board, player side of the board
        * @var Array target, opponent side of the board, keep track of hits and misses
        * @var Discord.User user
        * @var Array fleet, contains all boats in player's fleet
        * @var Boolean bot, if player is a bot
        **/
        function Player(u){
            var allocator,ui,battlesystem,opponent;
            var board = new Array(boardsize);
            var target = new Array(boardsize);
            var user = u;
            var fleet = [];
            var bot = u.bot;

            /* @set opponent */
            this.setOpponent = function(p){
                opponent = p;
            }
            /* @get opponent */
            this.getOpponent = function(){
                return opponent;
            }
            /* @get board */
            this.getBoard = function(){
                return board;
            }
            /* @set board */
            this.setBoard = function(b){
                board = b;
            }
            /* @get target */
            this.getTarget = function(){
                return target;
            }
            /* @set target */
            this.setTarget = function(t){
                target = t;
            }
            /* @get user */
            this.getUser = function(){
                return user;
            }
            /* @get fleet */
            this.getFleet = function(){
                return fleet;
            }
            /* @get user id */
            this.getId = function(){
                return user.id;
            }
             /* @set allocator */
            this.setAllocator = function(allo){
                allocator = allo;
            }
            /* @get allocator */
            this.getAllocator = function(){
                return allocator;
            }
            /* @set battlesystem */
            this.setBs = function(bs){
                battlesystem = bs;
            }
            /* @get battlesystem */
            this.getBs = function(){
                return battlesystem;
            }
             /* @set ui */
            this.setUI = function(gui){
                ui = gui;
            }
            /* @get ui */
            this.getUI = function(){
                return ui;
            }
            /* @get bot */
            this.isBot = function(){
                return bot;
            }
        }

        /**
        * @name InfoDisplay
        * @description shows a part of the board with additional info
        * @param UI ui, players ui
        * @var String boardtitle
        * @var String infotitle
        * @var String info
        * @var String feedbacktitle
        * @var String feedback
        * @var String display
        */
        function InfoDisplay(ui){
            var message,boardtitle,infotitle,info,feedbacktitle,feedback,display,description;
            this.setBoardTitle=(bt)=>{boardtitle=bt}
            this.setDescription=(d)=>{description=d}
            this.setInfoTitle=(it)=>{infotitle=it}
            this.setInfo=(i)=>{info=i}
            this.setFeedbackTitle=(ft)=>{feedbacktitle=ft}
            this.setFeedback=(f)=>{feedback=f}
            this.setDisplay=(d)=>{display=d}
            this.setMessage=(m)=>{message=m}
            this.getMessage=()=>{return message;}
            this.getEmbed=()=>{
                var embed = new Discord.RichEmbed();
                embed.setTitle("Battleship");
                if(description){
                    embed.setDescription(description);
                }
                embed.addField(boardtitle, display);
                if(info){
                    embed.addField(infotitle, ui.replaceIcons(info));
                }
                if(feedback){
                    embed.addField(feedbacktitle, feedback);
                }
                embed.setFooter("Made by Percy");
                return embed;
            };
        }

        /**
        * @name UI
        * @description handles all UI actions for the player
        * @param Player player, the player the UI is for
        * @var InfoDisplay top, handles displaying of the top part of the board
        * @var InfoDisplay bottom, handles displaying of the bottom part of the board
        * @var Array icons, all icons that are used in displaying of the board
        * @var Array numbers, shortcode equalivant of numbers for emoji's
        **/
        function UI(player){
            var top,bottom;
            var icons = ['🌊','▶️','⏺️','🔘','⏹️','🔲','🐳','🐬','🐋','🐙','♨️','🎇','🌀','🔥','💥','⚱️','☠️'];
            var numbers = ['one','two','three','four','five','six','seven','eight','nine','keycap_ten'];

            top = new InfoDisplay(this);
            bottom = new InfoDisplay(this);

            /*
            * @name getIcon
            * @param Int p, index of icon
            * @return String, icon from Array icons
            */
            function getIcon(p){
                return icons[p];
            }

            /**
            * @name rowN
            * @param Int i, current index
            * @return String emoji shortcode for current row
            **/
            function rowN(i){
                var n = Math.floor(i/boardlength);
                return ':'+numbers[n]+':';
            }

            /**
            * @name getBoatInfo
            * @description get Boat information to display
            * @var Boat boat
            * @var String output
            * @return String output
            **/
            function getBoatInfo(){
                var boat = player.getAllocator().getBoat();
                var output = boat.getName() + "\n";
                for(var i=0;i<boat.getSize();i++){
                    output+=getIcon(boat.icon());
                }
                return output;
            }

            /**
            * @name drawPlayerGrid
            * @description create string representation of board to send ot player
            * @param Array board, the board to turn into a display string
            * @return String, visual string of the board passed
            */
            function drawPlayerGrid(board){
                //map board indexes to icons and make sure a carriage return is used to split the rows
                var draw = board.map((p,i)=>(i%(boardlength)==0?rowN(i):'')+getIcon(p)+((i+1)%boardlength==0?'\n':''));
                return '⬛:regional_indicator_a::regional_indicator_b::regional_indicator_c::regional_indicator_d::regional_indicator_e::regional_indicator_f::regional_indicator_g::regional_indicator_h::regional_indicator_i::regional_indicator_j:\n' + draw.join('');
            }

            /**
            * @name drawBoard
            * @description the board array contains only filled indexes, we need to create a full array
            * @param Array board, the board to copy and fill
            * @var Array display, the full board to display
            * @var Array ks, the keys of the board array
            * @var Int i, iterator
            * @return Array display
            */
            function drawBoard(board){
                var display = new Array(boardsize),ks = Object.keys(board),i;
                display.fill(0);
                while(ks.length){
                    i = ks.shift();
                    display[i] = board[i];
                }
                return drawPlayerGrid(display);
            }

            /**
            * @name mapEffects
            * @description changes icons after interactions, effects
            * @param Array grid, the side of the board to change icons on
            * @var Object effects, a map of icon=>icon
            **/
            function mapEffects(grid){
                var effects = {10:15,11:13};
                grid.forEach(function(v,i){
                    grid[i]=(effects[v]?effects[v]:v);
                });
            }

            /**
            * @name getDisplayUI
            * @description returns InfoDisplay objects to work with
            * @return Mixed InfoDisplay or [InfoDisplay, InfoDisplay]
            */
            function getDisplayUI(){
                if(state==1){
                    return top;
                }else{
                    return [top,bottom];
                }
            }

            /**
            * @name updateEmbed
            * @description update messages with updated embeds
            * @param InfoDisplay o
            * @var Discord.RichEmbed embed 
            **/
            function updateEmbed(o){
                var embed = o.getEmbed();
                if(o.getMessage()){
                    o.getMessage().edit(embed);
                }
            }

            /**
            * @name update
            * @description update output messages
            * @var Mixed outout, InfoDisplay or [InfoDisplay, InfoDisplay]
            **/
            function update(){
                if(player.isBot()) return;

                var output = getDisplayUI();
                if(Array.isArray(output)){
                    //update all InfoDisplays
                    output.forEach(function(o){
                        updateEmbed(o);
                    });
                    return;
                }
                updateEmbed(output);
            }

            /**
            * @name sendEmbed
            * @description send game output to player
            * @param Mixed InfoDisplay or [InfoDisplay, InfoDisplay]
            * @var Mixed current
            * @var InfoDisplay next
            * @var Discord.RichEmbed embed
            **/
            function sendEmbed(output){
                var current = output, next, embed;
                //if both displays need to be display, make sure we have recursion
                if(Array.isArray(output)){
                    current = output[0];
                    next = output[1];
                }
                embed = current.getEmbed();
                player.getUser().send(embed).then((m)=>{
                    //save message for later updating
                    current.setMessage(m);
                    //if next then send next InfoDisplay
                    if(next){
                        sendEmbed(next);
                    }
                });
            }

            /**
            * @name draw
            * @send Output to player
            */
            function draw(){
                if(player.isBot()) return;

                output = getDisplayUI();
                sendEmbed(output);
            }

            /*
            * @name replaceIcons
            * @description parse string and replace icons
            * @param String input
            * @return String output
            */
            this.replaceIcons = function(str){
                var rgx = new RegExp(/\{(\d{1,2})\}/,'g'),arr;
                while(arr = rgx.exec(str)){
                    str = str.replace(arr[0],icons[arr[1]]);
                }
                return str;
            }

            /*
            * @public
            * @name updateBattleUI
            * @description update board information for the player in battle mode
            * @var Array board
            * @var Array target
            */
            this.updateBattleUI = function(){
                console.log('Update battle UI');
                var board = player.getBoard();
                var target = player.getTarget();
                top.setDisplay(drawBoard(board));
                bottom.setDisplay(drawBoard(target));

                update();
            }

            /*
            * @public
            * @name sendBattleUI
            * @description send board information for the player in battle mode
            * @var Array board
            * @var Array target
            */
            this.sendBattleUI = function(){
                console.log('Send battle UI');
                var board = player.getBoard();
                var target = player.getTarget();
                top.setDisplay(drawBoard(board));
                bottom.setDisplay(drawBoard(target));

                draw();
            }

            /**
            * @public
            * @name mapEffects
            * @description call mapEffects for both boards
            **/
            this.mapEffects = function(){
                mapEffects(player.getBoard());
                mapEffects(player.getTarget());
            }

            /**
            * @public
            * @name battleUI
            * @description output battle UI for player
            * @var Array board
            * @var Array target
            **/
            this.battleUI = function(){
                var board = player.getBoard();
                var target = player.getTarget();
                var opponent = player.getOpponent();

                top.setBoardTitle("Your board");
                top.setInfo(false);
                top.setFeedback(false);
                top.setDisplay(drawBoard(board));
                top.setDescription(false);

                bottom.setBoardTitle(`${opponent.getUser().username} board`);
                bottom.setInfoTitle("Battle information");
                bottom.setFeedbackTitle("\u200b");
                bottom.setFeedback("**Choose coordinates to fire on**");
                bottom.setDisplay(drawBoard(target));

                draw();
            }

            /**
            * @public
            * @name placementUI
            * @description output placement UI to player
            * @var Array board
            * @var Boolean done, if the placement is done
            **/
            this.placementUI = function(){
                var board = player.getBoard();
                var done = player.getFleet().length==maxBoats;

                top.setBoardTitle("Your board");
                if(!done){
                    top.setDescription("Type a coordinate to place a boat on (A1 to J10) and the orientation ('V' for vertical and 'H' for horizontal).\n**Example: F5 H**");
                    top.setFeedbackTitle("Setting up your side of the board");
                    top.setInfoTitle("Choose coordinates for:");
                    top.setInfo(getBoatInfo());
                }else{
                    top.setDescription(false);
                    top.setFeedbackTitle("\u200b");
                    top.setFeedback('**:hourglass: Waiting on other player**');
                    top.setInfo(false);
                }

                top.setDisplay(drawBoard(board));
            }

            /* make private methods public */
            this.getDisplayUI = getDisplayUI;
            this.draw = draw;

        }

        /**
        * @name Battlesystem
        * @description handles firing at opponents board
        * @param Player player, the player to handle the battle for
        * @var Array board, oponents side of the board
        * @var Array target, players view of opponents board
        * @var Array efleet, opponents fleet
        * @var Player opponent
        * @var String dcoords, display representation for coordinates fired upon
        */
        function Battlesystem(player){
            var board, target, efleet, opponent, dcoords;

            /**
            * @name informPlayers
            * @description inform players about eachothers actions
            * @param String message
            **/
            function informPlayers(message){
                player.getUI().getDisplayUI()[1].setInfo(`You fired on **${dcoords}**. It was a ${message}`);
                opponent.getUI().getDisplayUI()[1].setInfo(`${player.getUser().username} fired on **${dcoords}**. It was a ${message}`);
            }

            /**
            * @name checkIfDestroyed
            * @description check if the boat is destroyed
            * @param Array location, contains all the indexes the boat is placed on
            * @param Boat boat
            * @return Boolean
            **/
            function checkIfDestroyed(location, boat){
                //If every index of the boat has been hit, the boat has sunk
                if(location.every(v=>v==true)){
                    //boat is destroyed update maps
                    location.forEach(function(v,i){
                        target[i]=14;
                        board[i]=14;
                    });
                    boat.setDestroyed();

                    informPlayers(`**hit**! 🎇 ${boat.getName()} has sunk! 💥 :weary:`);
                    return true;
                }
                return false;
            }


            /**
            * @name checkBoats
            * @description check if a boat has been hit and update one of its indexes
            * @param Int index, the index that was fired upon
            **/
            function checkBoats(index){
                var boat = efleet.find(b=>index in b.getLocation()), location;
                if(!boat){
                    return;//slim chance an index is passed that is not hit. This is an additional check
                }
                location = boat.getLocation();
                location[index] = true;
                //check if boat is destroyed
                if(!checkIfDestroyed(location, boat)){
                   informPlayers('**hit**! 🎇 :open_mouth:');
                }
            }

            /**
            * @name hit
            * @description check if something on the board is hit
            * @param Int index, the index fired upon
            * @var Int type, the icon index
            * @var Int icon, effect icon
            * @return Boolean
            **/
            function hit(index){
                var type,icon;
                if(board[index]){
                    type = board[index];
                    if(type>5&&type<10){
                        //A marine animal was hit
                        icon = 10;
                        informPlayers(`**hit**! 🎇 But it was a {${board[index]}}! :scream:`);
                    }else{
                        //boat was hit
                        icon = 11;
                    }
                    //update maps with effect icon
                    board[index] = icon;
                    target[index] = icon;
                    if(icon==11){
                        checkBoats(index);
                    }
                    //return true if a boat was hit
                    return (icon==11?true:false);
                }
                return false;
            }

            /**
            * @name fire
            * @description playered fired on coordinates
            * @param Int index, index fired upon
            * @return Boolean
            **/
            function fire(index){    
                if(!hit(index)){
                    board[index] = 12;
                    target[index] = 12;

                    informPlayers('**miss**! 🌀 :rolling_eyes:');

                    return false;
                }
            }

            /**
            * @public
            * @name init
            * @description initiate Battle System, set variables
            */
            this.init = function(){
                opponent = player.getOpponent();
                board = opponent.getBoard();
                efleet = opponent.getFleet();
                target = player.getTarget();               
            }

            /**
            * @public
            * @name destroy
            * @description destroys all boats on the board. Used for testing
            **/
            this.destroy = function(){
                efleet.forEach(function(b){
                    b.getLocation().forEach((v,i)=>board[i]=14);
                    b.setDestroyed();
                });
            }

            /**
            * @public
            * @name fire
            * @description parse coordinates and pass index to internal fire method
            * @var index, index to be fired upon
            * @global String dcoords, display coordinates for the battle info
            * @global Array abc, contains indexes for used part of the alphabet
            * @global Int boardlength
            **/
            this.fire = function(coords){
                var index = coords;
                if(!index){
                    return false;//should not happen, but could be a hiccup
                }
                //If coords is not a number it's player input, parse the coordinates
                if(typeof index != 'number'){
                    dcoords = coords.toUpperCase();
                    //last part of the string is Y coordinate, first part is X.
                    index = (coords.substring(1)-1)*boardlength+abc.indexOf(coords[0]);
                    if(!target[index]){
                        //index has not been fired upon before, fire
                        return fire(index);
                    }else{
                        //index has already been fired upon
                        return false;
                    }
                //The bot has fired and passed an index
                }else{
                    //translate index to coordinates to display to human player
                    dcoords = abc[index%boardlength].toUpperCase()+(Math.floor(index/boardlength)+1);
                    //coords is a number, input from the bot
                    return fire(index);
                }
            }
        }

        /**
        * @name Bot
        * @description Runs the battle AI for the bot
        * @param PLayer player, the player object for the bot
        * @var Array queue, the bots queue to fire upon
        * @var Array fired, memory for the bot, what has been fired upon
        * @var Int t, the index to fire on
        * @var Array target, target map for the board
        * @var Battlesystem battlesystem, the battlesystem of the bot
        **/
        function Bot(player){
            var queue =[],fired=[],t;
            var target = player.getTarget();
            var battlesystem = player.getBs();

            /**
            * @name createQueue
            * @description create a queue for the bot to fire on. Using 3d positon strategy
            */
            function createQueue(){
                target.fill(0);
                target.forEach(function(v,i){
                    //fire at every 3rd position
                    if(i%3==0){
                        queue.push(i);
                    }
                });
                shuffle(queue);
            }

            /**
            * @name extendQueue
            * @description extend the queue with 2nd position strategy
            */
            function extendQueue(){
                target.forEach(function(v,i){
                    //fire at every 2nd position
                    if(!v && i%2==0){
                        queue.push(i);
                    }
                });
                shuffle(queue); 
            }

            /**
            * @name addSpread
            * @description if the previous attack was a hit, fire on indexes around it
            * @var Array r, operators for area around index
            * @let Int idx, the index to add to the queue
            * @let Int qi, the index of current position if in queue
            **/
            function addSpread(){
                var r=[-1,1,boardlength,-boardlength];
                for(let i in r){
                    let idx=t+r[i], qi=queue.indexOf(idx);
                    if(fired.indexOf(idx)>-1){
                        break;
                    }
                    if(qi>-1){
                        queue.splice(qi,1);
                    }
                    if(idx>-1&&idx<boardsize){
                        queue.unshift(idx);
                    }
                }
            }

            /**
            * @name attack
            * @description the bot fires at an index from the queue
            */
            function attack(){
                t=queue.shift();
                fired.push(t);
                //if it's a hit check if the both has won and add spread
                if(battlesystem.fire(t)){
                    if(checkWinner()){
                        return false;
                    }
                    addSpread();
                }
                return true;
            }

            /**
            * @fireQueue
            * @description the bot fires at the entire queue in one go
            */
            function fireQueue(queue, fired){
                while(queue.length){
                   return attack();
                }
                return true;
            }

            /**
            * @public 
            * @name botMode
            * @description bot keeps torpedoing the board until nothing is left. Test function
            */
            this.botMode = function(){
                createQueue();
                if(fireQueue(queue, fired)){
                    //if there is no winner, keep firing
                    extendQueue();
                    fireQueue(queue, fired);
                }
            }

            /*
            * @public attack
            * @description calls attack and changes turns
            */
            this.attack = attack;

            createQueue();
        }

        /**
        * @name Allocator
        * @description responsible for allocating space for boats
        * @param Player player
        * @var Array armada, the boats to be placed on the board
        * @var Array board, the board of the player
        * @var Array fleet, the boats of the player
        * @var UI ui, the UI for the player
        * @var Object current, the template for the current boat type
        * @var Boat boat, the current boat to be placed
        * @var Int boatcount, amount of boats of type already placed
        * @var Int start, first/start position of the boat to be placed
        * @var Int boatsize, the size of the current boat to be placed
        * @var String rotate, "h" or "v", orientation of the boat
        **/
        function Allocator(player){       
            var armada = boats.slice();
            var board = player.getBoard();
            var fleet = player.getFleet();
            var ui = player.getUI();
            var current,boat,boatcount;
            var start, boatsize, rotate;

            /**
            * @name next
            * @description create the next boat using the templates in armada
            */
            function next(){
                //if the template is not set, or all boats for template are placed: get new template
                if(!current || !boatcount){
                    current = armada.shift();
                    boatcount = current.count;
                }
                if(current){
                    boat = new Boat(...current.boat);
                    boatcount--;
                }
            }
            /**
            * @name getBoat
            * @description get the current boat to be placed
            * @return Boat boat
            */
            function getBoat(){
                //if there is no boat yet or boat has been placed, request the next one
                if(!boat || boat.getLocation().length){
                    next();
                }
                return boat;
            }

            /**
            * @name getPlacementIndex
            * @description get the index where the boat will be placed on
            * @param Int i, iterator
            **/
            function getPlacementIndex(i){
                return start + (rotate=='v' ? i*boardlength : i);
            }

            /**
            * @name boatInTheWay
            * @description check if another boat is in the way for placement
            * @var Int i, iterator
            * @return Boolean
            */
            function boatInTheWay(){
                for(var i=1;i<=boatsize;i++){
                    if(board[getPlacementIndex(i)]){
                        ui.getDisplayUI().setFeedback('⚠️ Another boat is in the way. Can not place ' + boat.getName());
                        return false; 
                    }
                }
                return true;
            }

            /*
            * @name placeBoat
            * @description place the current boat on the player's board and add it to the fleet
            * @var Int i, iterator
            * @var Int p, index of where boat will be placed
            */
            function placeBoat(){
                for(var i=1;i<=boatsize;i++){
                    var p = getPlacementIndex(i);
                    board[p] = boat.icon();
                    boat.addToLocation(p);
                }
                fleet.push(boat);
            }

            /**
            * @name getStart
            * @description get first index of boat location
            * @param Int x, x coordinate
            * @param Int y, y coordinate
            **/
            function getStart(x,y){
                start=(rotate=='v'?(y*boardlength+x-boardlength):(y*boardlength+x-1));
            }

            /*
            * @name checkFit
            * @description check if boat will fall of the board with give coordinates
            * @param Int x, x coordinate
            * @param Int y, y coordinate
            * @var Boolean fit, does or does not fit
            * @var Int i, last index that the boat occupies
            * @return Boolean fit
            */
            function checkFit(x,y){
                var fit;
                if(rotate=='v'){
                    console.log((start+(boatsize*boardlength)) + ' ' + (boardsize-boardlength+x));
                    fit=!(start+(boatsize*boardlength)>boardsize-boardlength+x);
                }else{
                    fit=!(start+boatsize>(boardlength*y)+boardlength-1);
                }
                if(!fit){
                    ui.getDisplayUI().setFeedback('⚠️ Your boat ' + boat.getName() + ' is sticking past the known ocean.');
                }
                return fit;
            }

            /**
            * @name place
            * @description uses players coordinates and rotation to try and place the current boat
            * @param Array coords, contains x and y coordinate
            * @param String rotate, 'h' or 'v' for boat orientation
            * @return Boolean, boat could or could not be placed
            **/
            function place(coords, rotate){
                var x=coords[0],y=coords[1];
                getBoat();
                boatsize = boat.getSize();

                getStart(x,y);
                if(checkFit(x,y)){
                    if(boatInTheWay()){
                        placeBoat();
                        ui.getDisplayUI().setFeedback(boat.getName() + ' placed from ' + coords + '.');
                        return true;
                    }
                }
                return false;
            }

            /**
            * @name getRandomMarine
            * @return Int, index of random marine animal
            */
            function getRandomMarine(){
                return Math.floor(Math.random()*4+6);
            }

            /**
            * @name addRandomMarine
            * @description add random marine animals to the board
            * @param Array board, the players part of the board
            * @var Int n, random amount of animals to be placed
            * @var Int i, iterator
            * @var Int a, random index to place animal at
            * @var Array b, possible locations to place animals at
            **/
            function addRandomMarine(){
                var n = Math.floor(Math.random() * boardlength + 1);
                var i,a,b = new Array();
                //add indexes that are still free
                for(i=0;i<boardsize;i++){
                    if(!board[i])b[i]=i;
                }
                //place animals on random indexes
                for(i=0;i<n;i++){
                    a = Math.floor(Math.random()*b.length+1);
                    b.splice(a,1);
                    board[b[a]] = getRandomMarine();
                }
            }

            /**
            * @private
            * @name place
            * @description pre processes coordinates before passing them on
            * @param Array|String coords, The generator passes an array, the player passes a string
            * @return Boolean, could or could not be placed
            **/
            this.place = function(coords, r){
                rotate = r;
                if(!Array.isArray(coords)){
                    //turn the string into an array containing coordinates
                    coords = [abc.indexOf(coords[0]),coords.substring(1)-1];
                }
                return place(coords);
            }

            /* Make private method public */
            this.getBoat = getBoat;
            this.addRandomMarine = addRandomMarine;
        }

        /**
        * @name rdx
        * @description return a random Array index of an array
        * @param Array arr
        * @param Int min, the minimum index to be returned
        * @return Int, random array index
        */
        function rdx(arr, min){
            return Math.floor(Math.random() * arr.length+(min?min:0));
        }

        /**
        * @name shuffle
        * @description randomizes given array
        * @param Array array, the array to randomize
        * @var Int currentIndex
        * @var Mixed temporarayValue
        * @var Int randomIndex
        * @return Array array, the randomized array
        **/
        function shuffle(array) {
          var currentIndex = array.length, temporaryValue, randomIndex;

          // While there remain elements to shuffle...
          while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
          }

          return array;
        }

        /**
        * @name generate
        * @description place boats for player on the map at random places.
        * @param Player player
        * @var Object Pos contains possible Vertical and Horizontal locations for the current boat size
        * @var Boat boat the current boat to be placed
        * @var Int boatsize, size of current boat that has to be placed
        * @var Int i, the index of chosen position in the pos array
        * @var Array coords, contains the coodinates for the boat to be placed on
        * @var String or, "v" or "h". The random orientation for the boat
        * @var String strBoard, the player board as a string
        * @var Array board, the board of the player containing boat locations and such
        * @var Array Fleet, contains all placed boats for the player
        * @var Allocator allocator handles the placement of the boat on the generated location
        **/
        function generate(player){
            var pos={'h':[],'v':[]};
            var boat,boatsize,i,coords,or,strBoard;
            var ydistance = boardlength-1;
            var board = player.getBoard();
            var fleet = player.getFleet();
            var allocator = player.getAllocator();

            /**
            * @name getHorizontal
            * @description get available horizontal positions for current boat size
            * @var RegExp test, to check if there is room for the boat in the string
            * @var Array arr, contains the RegExp exec results
            */
            function getHorizontal(){
                //no need to find posibilities when the array is still full
                if(!pos.h.length){
                    //each row of the board is the length of the board. check each row for posibilities
                    strBoard.match(new RegExp(`\\d{${boardlength}}`,'g')).forEach(function(r,i){
                        //use regex to check if one or more boats of this size fit in the current row
                        //need to redeclare for each interation, RegExp object contains the matches
                        var test = new RegExp(`0{${boatsize}}`,'g'),arr;
                        while(arr = test.exec(r)){
                            pos.h.push([arr.index, i]);
                        }
                    });
                }
            }

            /**
            * @name getVertical
            * @description get available vertical positions for current boat size
            * @var RegExp regex, to check against the string to see if the is place for the current boat
            * @var int count, keep track of the current board index
            * @var int p, index of found posibility in the board string
            * @var Array c, contains coordinats to add to the pos array
            */
            function getVertical(){
                //no need to find posibilities when the array is still full
                if(!pos.v.length){
                    var regex = new RegExp(`(0\\d{${ydistance}}0){${boatsize}}`,'g'),count=p=0,c;
                    //We use substring to pick apart the strBoat, if p is -1 then there are no more possible locations for the boat
                    while(p > -1){
                        p = strBoard.search(regex);
                        //found location can be 0 at the start of the string, if 0 then 1
                        p=p?p:1;
                        if(p>-1){
                            //match has been found, increase the index
                            count+=p;
                            //x is calculated using %, y using a floored devision
                            c = [count%boardlength,Math.floor(count/boardlength)];
                            pos.v.push(c);
                            //remove the already checked part from the board string
                            strBoard=strBoard.substring(p);
                        }
                    }
                }
            }

            /**
            * @name getPos
            * @description check the boat size and get the posibilites for current orientation
            */
            function getPos(o){
                //The allocator updates the board array, we need to get a new string for each boat
                strBoard = board.join('');
                if(!boatsize){
                    boatsize = boat.getSize();
                }
                //if the boatsize has changed we need to refresh the related variables 
                if(boatsize!=boat.getSize()){
                    pos={'h':[],'v':[]};
                    boatsize=boat.getSize();
                }
                //get posibilites for the orientation
                if(o=='h'){
                    getHorizontal(strBoard);
                }else{
                    getVertical(strBoard);
                }
            }

            //the first iteration needs a string of zeros for strBoard. On a new instance the array is empty
            board.fill(0);
            //keep running until all boats have been placed
            while(fleet.length<maxBoats){
                //get the next boat from the allocator
                boat = allocator.getBoat();
                //random orientation, horizontal or vertical
                or = Math.round(Math.random())?'h':'v';
                //get the posibilites for the orientation, populate the pos array
                getPos(or);
                //get a random index from the pos array
                i = rdx(pos[or]);
                //remove the random coordinates from the pos array
                coords = pos[or].splice(i,1)[0];
                //sometimes there is a hiccup and no coordinates are returned, better safe than sorry
                if(coords){
                    //use the allocator to place the boat for the given orientation
                    allocator.place(coords,or);
                }
            }
            allocator.addRandomMarine();
        }

        /**
        * @name askForPlacement
        * @description send placement UI to players
        **/
        function askForPlacement(){
            players.forEach((player)=>{
                if(!player.isBot()){
                    var ui = player.getUI();
                    ui.getDisplayUI().setFeedback('Waiting on input.');
                    ui.placementUI();
                    ui.draw();
                }
            });
        }

        /**
        * @name opponentUpdateDisplay
        * @description update opponent UI
        * @param Player opponent
        * @var InfoDisplay output
        */
        function opponentUpdateDisplay(opponent){
            var output = opponent.getUI().getDisplayUI();
            output[1].setFeedbackTitle('It is ' + currentPlayer.getUser().username + ' turn');
            output[1].setFeedback('Waiting on opponent :hourglass:');
            opponent.getUI().sendBattleUI();
            opponent.getUI().mapEffects();
        }

        /**
        * @name currentPlayerUpdateDisplay
        * @description update currentPlayer UI
        * @var InfoDisplay output
        */
        function currentPlayerUpdateDisplay(){
            var output = currentPlayer.getUI().getDisplayUI();
            output[1].setFeedbackTitle('It is your turn');
            output[1].setFeedback('Choose a coordinate to fire on');
            currentPlayer.getUI().updateBattleUI();
            currentPlayer.getUI().mapEffects();
        }

        /**
        * @name turn
        * @description turns the players
        * @var Player opponent
        */
        function turn(){
            var opponent;
            if(cpi==players.length-1){
                cpi=-1;
            }
            currentPlayer = players[++cpi];
            opponent = currentPlayer.getOpponent();

            //have the bot wait a few seconds before firing. Gives the human player time to read his displays
            if(currentPlayer.isBot()){
                console.log('the bot its turn');
                setTimeout(function(){
                    bot.attack();
                    console.log('the bot has fired, update opponent battleUI');
                    turn();
                }, 5000);
            }

            //if(!opponent.isBot()){
                opponentUpdateDisplay(opponent);
            //}
            //if(!currentPlayer.isBot()){
               currentPlayerUpdateDisplay(currentPlayer);
            //}
            Spectator.updateBoards();
        }

        /**
        * @name connectPlayers
        * @description set for each player the opponent object
        **/
        function connectPlayers(){
            players.forEach(p1=>{
                p1.setOpponent(players.find(p2=>p2.getId()!=p1.getId()));
            });
        }

        /**
        * @name createPlayer
        * @description a helper function that creates a player and sets needed objects
        * @param Discord.User user
        * @var Player player
        * @return Player player
        */
        function createPlayer(user){
            var player = new Player(user);
            players.push(player);
            player.setUI(new UI(player));
            player.setAllocator(new Allocator(player));
            player.setBs(new Battlesystem(player));

            //if the player is a bot generate the board and initiate the Bot
            if(player.isBot()){
                generate(player);
                bot = new Bot(player);
            }

            return player;
        }

        /**
        * @name start
        * @description starts the game up
        **/
        function start(){
            logger.info("game started");
            createPlayer(player2);
            createPlayer(player1);
            connectPlayers();

            //The invited player starts first, unless it is the bot
            if(player2.bot){
                players.reverse();
            }
            askForPlacement();
        }

        /**
        * @name handleInvitedResponse
        * @desciption handles response by invited player
        * @param Discord.Message m
        **/
       async function handleInvitedResponse(m){
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
                    m.clearReactions();
                    m.edit(`${player2} accepted. I am sending you and ${player1} a direct message, the game will be played by interacting with me.\nSpectator mode will be start when you are done with placing your boats.`);
                    start();
                }
                else{
                    //no
                    m.edit(`${player2} does not accept the game.`);
                }

            })
            .catch(collected => {
                //no input received, player has not made a move
                m.edit(`${player2} did not respond.`);
            });
        }

        /**
        * @name invite
        * @description show invitation text in channel and ask invited player for response
        * @var String mtext, invitation text
        **/
        function invite(){
            var mtext = `${player1} invited ${player2} for a game of Battleship.\n\n Do you accept? Please choose :white_check_mark: or :no_entry: underneath.`;
            const filter = (reaction, user) => {
                return !user.bot && ["%E2%9C%85", "%E2%9B%94"].indexOf(reaction.emoji.identifier) > -1 && user.id == player2.id;
            };

            channel.send(mtext).then(handleInvitedResponse);
        }

        /**
        * @name checkIfDone
        * @description check if both players are done with placing their boats
        */
        function checkIfDone(){
            return players.filter(p=>p.getFleet().length==maxBoats).length==2;
        }

        /**
        * @name checkCoordinates
        * @description check if coordinates are valid
        * @param String coords, coordinates passed by the player
        * @param UI ui, player ui to pass feedback to
        * @return Boolean
        */
        function checkCoordinates(coords,ui){
            var output = Array.isArray(ui.getDisplayUI())?ui.getDisplayUI()[1]:ui.getDisplayUI();
            if(!/^[a-j]([1-9]|10)$/.test(coords)){
                output.setFeedback('⚠️ Incorrect coordinates "**' + coords + '**". Coordinates should be within the range A-J and 1-10.')
                ui.draw();
                return false;
            }
            return true;
        }

        /**
        * @name checkRotation
        * @description check if rotation valid
        * @param String rotate, rotation passed by the player
        * @param UI ui, player ui to pass feedback to
        * @return Boolean
        */
        function checkRotation(rotate,ui){
            var output = Array.isArray(ui.getDisplayUI())?ui.getDisplayUI()[1]:ui.getDisplayUI();
            if(!['h','v'].includes(rotate)){
               output.setFeedback('⚠️ Incorrect rotation. Or no rotation supplied.\nCoordinates should be follow with V (vertical) or H (horizontal)')
                ui.draw();
                return false;
            }
            return true;
        }

        /**
        * @name finishPlacement
        * @description initiate Battle mode
        */
        function finishPlacement(){
            state=2;
            //@show battleUI to both players
            players.forEach((p)=>{
                p.getBs().init();
                p.getUI().battleUI();
            });
            console.log('show spectator boards');
            console.log('both players done');
            turn();
        }

        /**
        * @name handlePlacementInput
        * @description handles the input for placement
        */
        function handlePlacementInput(args,player, ui){
            if(!checkCoordinates(args[0],ui)){
                return;
            }
            if(!checkRotation(args[1],ui)){
                return;
            }
            player.getAllocator().place(args[0],args[1]);
            if(player.getFleet().length==maxBoats){
                player.getAllocator().addRandomMarine();
            }
        }

        /**
        * @name handlePlacement
        * @desciption updates the placement UI and passes on the users inpit
        * @param Array args, arguments parsed from player input
        * @param Player player
        * @var UI ui, player UI
        */
        function handlePlacement(args,player){
            var ui = player.getUI();
            if(args[0]!='random'){
                handlePlacementInput(args,player, ui)
            }else{
                generate(player);
            }

            //check if players are done with placement
            if(checkIfDone()){
                finishPlacement();
            }else{
                ui.placementUI(player);
                ui.draw();
            }
        }

        /**
        * @name endGame
        * @description show end game screen to player
        **/
        function endGame(p,t,m){
            p.setTarget(t);
            p.getUI().getDisplayUI()[1].setInfo(m);
            p.getUI().updateBattleUI();
        }

        /**
        * @name checkWinner
        * @description check if one of the fleets is destroyed
        * @var Player lose
        * @var Player winner
        * @return Boolean
        */
        function checkWinner(){
            var loser = players.find(p=>p.getFleet().every(b=>b.isDestroyed())),winner;
            if(loser){
                //a player has lost. update maps
                winner = loser.getOpponent();
                endGame(winner, loser.getBoard(), 'You won! :trophy:');
                endGame(loser, winner.getBoard(), 'You lost! :skull_crossbones:');

                //stop game
                game.splice(gkey,1);

                return true;
            }
            return false;
        }

        /**
        * @name handleBattle
        * @description handle Battle for player
        * @param Array args, arguments parsed from player input
        * @param Player player
        * @var UI ui, player UI
        */
        function handleBattle(args, player){
            var ui = player.getUI();
            //check coordinates and fire if valid
            if(!['deceminate','botmode'].includes(args[0])){
                if(!checkCoordinates(args[0],ui)){
                    return;
                }
                player.getBs().fire(args[0]);
            }
            else{
                //Cheatcodes / test codes
                switch(args[0]){
                    case 'deceminate':
                        player.getBs().destroy();
                    break;
                    case 'botmode':
                        players[1].getBs().botMode();
                    break;
                }
            }

            if(checkWinner()){
                return;
            }

            console.log('handleBattle show battleUI');
            turn();
            //ui.updateBattleUI();
        }

        /**
        * @public
        * @nameprocessInput
        * @description handle player input and determine handler
        * @param Discord.User user
        * @var String input
        * @var Player player
        * @var Array args, parsed arguments from string
        **/
        this.processInput = function(user,input){
            var player = players.find(p=>p.getId()==user.id);
            var args = input.toLowerCase().split(/\s/);

            if(state==1 && player.getFleet().length!=maxBoats){
                handlePlacement(args, player);
            }else{
                if(state==2 && player.getId()==currentPlayer.getId()){
                    handleBattle(args, player);
                }else{
                    console.log('not your turn');
                }
            }
        }

        //if player 2 is the bot the game can be started
        if(player2.bot){
            start();
        }else{
            invite();
        }
    }

    //use edited messages as input as well
    client.on("messageUpdate", (old,message) => {
        if(message.channel.type == "dm" && !message.author.bot){
            if(game.length){
                var entry = game.find(g=>g.players.find(p=>p.id==message.author.id));
                if(entry){
                    entry.instance.processInput(message.author,message.content);
                }
            }
        }
    });

    client.on("message", message => {
        if(message.channel.type == "dm" && !message.author.bot){
            if(game.length){
                //check if user is part of an already running game
                var entry = game.find(g=>g.players.find(p=>p.id==message.author.id));
                if(entry){
                    entry.instance.processInput(message.author,message.content);
                }
            }
        }

        if(message.author.bot || message.channel.id!=GAMECHANNEL){
            return;
        }

        const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        
        if(command == COMMAND){
            if(message.mentions.users.size){
                var invited = message.mentions.users.first();
                game.push({'players':[message.author,invited],'instance':new Game(message.author, invited, game.length, message.channel)});
            }else{
                message.reply("No other player was mentioned. To play a game use **~battleship @user** or **~battleship <@562331981007028237>** to play against the bot");
            }
            return;
        }
    });

}

module.exports = {
  name: 'battleship',
  description: 'battleship',
  init(Discord, client, logger, memory){
    battleship = new Battleship(Discord, client, logger, memory);
  }
};