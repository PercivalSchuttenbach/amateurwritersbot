function RPGGame(){
    var idnr = 0;
    var areas = [];
    var crts = [{'name':'rat','type':'c','speed':1,'sight':3, 'icon':2}];

    function AI(id, opt, field, index){
        var name = opt['name'],speed=opt['speed'],sight=opt['sight'],icon=opt['icon'],mvs=[];
        var ran = false;
        var dir = field.getDir();
        var grid = field.getGrid();
        var fr = field.getFr();
        var bndrs = field.getBndrs();

        function gnrtMvs(){
            var n = Math.floor((Math.random() * fr)+1);

            function newDir(i){
                debugger;
            	i = i ? i : 1;//make sure its a number
            	var d, di,ks = Object.keys(dir);
				//need to work in boundaries
				while(typeof d == 'undefined' || (grid[di] && di!=index) || di<0 || di>grid.length){
					var k = ks.splice(Math.floor(Math.random() * ks.length),1);
					d = dir[k];
					di = d*i+index;
				}
				return d;
            }
            
            mvs = [];
            var nd = newDir();
            for(var i=1;i<=n;i++){
            	var step = nd*i+index;
            	if(!grid[step] || step==index || step<0 || step>grid.length){
                    
                    debugger;
                	mvs.push(step);
            	}else{
            		nd = newDir(i);
                    
                    debugger;
            		mvs.push(nd*i+index);
            	}
            }
            return mvs;
        }

        /**
        * @name move
        * @description checks if AI sees a player and follows or moves towards, or moves in sequence
        **/
        function move(){

            /**
            * @name removeBehindAI
            * @description make sure AI has no eyes in the back of his head
            * @var cdir int or false, direction AI was moving in. If already following it's false
            * @dirs the directions to check
            * @return dirs
            **/
            function removeBehindAI(){
                //check if there are planned movements, if so the AI is facing a direction
                var cdir = mvs.length ? mvs[0]-index : false;
                var dirs = dir;
                if(cdir){
                    //get the opposite the direction of what the AI is facing by reversing direction
                    var opposite = Object.values(dir).indexOf( (cdir<0 ? Math.abs(cdir) : 0-cdir) );
                    var dirs = Object.keys(dir).filter(d,i=>i!=opposite);
                }
                return dirs;
            }

            /**
            * @getSField
            * @description get field of vision
            * @var Array sfield contains sight indexes
            * @return Array sfield
            **/
            function getSField(){
                var sfield = [];
                var dirs = removeBehindAI();
                //loop over directions
                for(var d in dirs){
                    //loop over sight distance
                    for(var i=0;i<sight.length;i++){
                        //inmovables block vision
                        var fi = index + dir[d]*i;
                        if(grid[fi]!=1){
                            sfield.push(fi);
                        }else{
                            //object in the way, cannot see any farther
                            break;
                        }
                    }
                }
                return sfield;
            }

            /**
            * @name getInSight
            * @description check if player is in field of vision
            * @var sighted null or Player Object
            * @var sfield Array sight indexes
            * @return sighted
            **/
            function getInSight(){
                var sighted = null;
                var sfield = getSField();
                var plrs = field.getPlrs();
                //follow players and other AI 
                var targets = plrs.concat(field.getAis().filter(ai=>ai.getId()!=id));

                //loop through players
                var i = plrs.length;
                while(i--){
                    //check if player is standing in field of vision
                    if(sfield.includes(plrs[i].getIndex())){
                        sighted = plrs[i];
                        break;
                    }
                }
                return sighted;
            }

            /**
            * @name follow
            * @description AI moves to or after player/AI
            * @param pi Player index
            * @param v is -/+ root of field
            * @param v is -/+ 1
            **/
            function follow(pi,v,h){
                if(pi%fr==index%fr){
                    //player is above or below of AI
                    index+=v;
                }else{
                    //player is to the right or left of AI.
                    index+=h;
                }
            }

            /**
            * @name checkIfToFollow
            * @description check if there is a player to follow, if so follow first encountered
            * @var sighted null or Player Object
            * @var pi is Player index
            **/
            function checkIfToFollow(){
                var sighted = getInSight();
                if(sighted){
                    //index 5%3 = 2
                    var pi = sighted.getIndex(); //8%3 = 2
                    if(pi > index){
                        //player is below or to the right of AI
                        follow(pi, fr,1);
                    }else{
                        //player is above or to the left of AI
                        follow(pi, -fr,-1);
                    }
                    return true;
                }
                return false;
            }
            //if following, clear planned movements
            //@todo
//             if(checkIfToFollow()){
//                 mvs = [];
//                 return index;
//             }
            if(!mvs.length){
                gnrtMvs();
            }
            return mvs.shift();
        }

        this.getNxtMove = function(){
            return move();
        }
        this.gnrtNMvs = function(){
            gnrtMvs();
            return mvs.shift();
        }
        this.setRan = function(){
            ran!=ran;
        }
        this.hasRan = function(){
            return ran;
        }
        this.getId = function(){
            return id;
        }
        this.getIcon = function(){
            return icon;
        }
        this.setIndex = function(i){
        	index = i;
        }
        this.getIndex = function(){
        	return index;
        }
    }


    function Player(){
        var index = 0;

        this.getIndex = function(){
            return index;
        }
    }

    function Area(ar){
        var asize = ar*ar;
        var as = ar-1;
        var fields = new Array(asize);

		function dtmBdrs(i){
			//top left
			if(!i){
				return ['l','u'];
			}
			//top
			if(i<as){
				return ['u'];
			}
			//top right
			if(i==as){
				return ['r','u'];
			}
						//bottom right
			if(i==asize-1){
				return ['r','d'];
			}
			//right
			if((i+1)%ar==0){
				return ['r'];
			}
            //bottom left
			if(i==asize-ar){
				return ['l','d'];
			}
			//left
			if(i%ar==0){
				return ['l'];
			}
			//bottom
			if(i>asize-ar-1 && i<asize-1){
				return ['d'];
			}
			return false;
		}

		function generateObjects(field){
		    
		    var grid = field.getGrid();
			function rdix(){
				var ri = 0;
				while(grid[ri]){
					ri = Math.floor(Math.random() * grid.length);
				}
				return ri;
			}
			
			var n =  Math.floor(Math.random() * (Math.sqrt(grid.length) * 2));
			while(n--){
				grid[rdix()] = 1;
			}
		}

		function generateMovables(field){
		    
		    var grid = field.getGrid();
			function rdix(){
				var ri = 0;
				while(grid[ri]){
					ri = Math.floor(Math.random() * grid.length);
				}
				return ri;
			}
			
			var n =  Math.floor(Math.random() * Math.sqrt(grid.length));
			while(n--){
			    var ri = rdix();
			    var ai = new AI(++idnr, crts[0], field, ri);
				grid[ri] = 'a'+ai.getId();
				field.addAi(ai);
			}
		}

		function fillIn(field){
		    var grid = field.getGrid();
			var j = grid.length;
			while(j--){
				if(typeof grid[j] == "undefined"){
                    grid[j] = 0;
                }
			}
		}

        function gnrFields(){
            
            var i = fields.length;
            while(i--){
                
                var field = new Field(9,dtmBdrs(i));
                generateObjects(field);
                generateMovables(field);
                fillIn(field);
                
                fields[i] = field;
            }
        }

        this.getFields=function(){
            return fields;
        }

        gnrFields();
    }

    function Field(fr,bndrs){   
        var fsize=fr*fr;
        var fs=fr-1;
        var plrs = [];
        var ais = [];
        var grid = new Array(fsize);
        var dir = {'u':-fr,'d':fr,'l':-1,'r':1,'p':0};
        var btest = {'u':(j)=>j,'d':(j)=>(fsize-fr)+j,'l':(j)=>j*fr,'r':(j)=>j*fr+fs};
        var boundaries = [];

		//save boundaries with field for later testing
		function setBoundaries(){
			if(!bndrs) return;
     
			for(var j=0; j<fr; j++){
				var bi = bndrs.length;
				while(bi--){
					var fkey = bndrs[bi];
					boundaries[btest[fkey](j)] = 1;
				}
			}
		}

        this.hasPlrs = function(){
            return !!plrs.length;
        }

        this.getPlrs = function(){
            return plrs;
        }

        this.addPlr = function(plr){
            plrs.push(plr);
        }
        this.addAi = function(ai){
            ais.push(ai);
        }
        this.getAis = function(){
            return ais;
        }
        this.getAi = function(aid){
            return ais.find(ai=>ai.getId()==aid);
        }

        this.getGrid = function(){
            return grid;
        }

        this.getBndrs = function(){
            return boundaries;
        }
        this.getFr = function(){
            return fr;
        }
        this.getDir = function(){
            return dir;
        }
        
        function generateBoundaries(){
            setBoundaries();
            for(var i in boundaries){
                grid[i] = 1;
            }
        }

        generateBoundaries();
        

        //generate grid with AI ++idnr
    }

    var UI = new function(){
        var o = ["⬛","🌳","🐀"];

        this.drawField = function(field){
            var grid = field.getGrid();
            var fr = field.getFr();
            var display = "";

            for(var j=0; j<grid.length; j++){
                var icon = typeof grid[j]=='number' ? grid[j] : field.getAi(grid[j].substring(1)).getIcon();
                display += icon + (((j+1)%fr)==0 ? '\n' : '');
            }
            render(display);
        }

        function render(display){
        	console.log(display);
        }
    }

    function gameloop(){

        function getFields(){
            var i = areas.length;
            var fields = [];
            while(i--){
                //only run fields that have players
                fields = fields.concat(areas[i].getFields().filter(f=>f.hasPlrs()));
            }
            
            
            return fields;
        }

        function runField(field){
        	
            var grid = field.getGrid();
            var bndrs = field.getBndrs();
            var ais = field.getAis();

            function AICollisionDetection(){
                var ais = field.getAis().slice();

                function set(ai, index){
                    grid[index] = 'a'+ai.getId();
                    grid[ai.getIndex()]=0;
                    ai.setIndex(index);
                }

                function newIndex(ai){
                     index = ai.gnrtNMvs();
                     set(ai, index);
                }

                function clear(ai){
                    var aisI = ais.findIndex(oai=>oai.getId()==ai.getId());
                    ais.splice(aisI,1);
                }

                function clearRanFlag(){
                    var ais = field.getAis();
                    var i = ais.length;
                    while(i--){
                        ais[i].setRan();
                    }
                }

                function runOtherAI(ai, otherAi, index){
                	//other AI has not ran yet, run it
					var oIndex = runAI(otherAi);
					if(oIndex==index){
						
						//other AI stays, get nex index
						newIndex(ai);
					}
					else{
						//other Ai has moved, set index
						
						set(ai, index);
					}
                }

                function solveAICollision(ai,index){
                    if(typeof grid[index]=='string' && grid[index][0]=='a'){
                       //collided with other AI
                       var otherAi = field.getAi(grid[index].substring(1));
                       if(otherAi.hasRan()){
                       		
                           //other AI has already ran, get newIndex
                           newIndex(ai);
                       }
                       else{
                       		
                            runOtherAI(ai,otherAi,index);
                       }
                    }else{
                       //collided with inmovable object
                       
                       newIndex(ai); 
                    }
                }

                function solveCollision(ai,index){
                    if(bndrs[index]){
                    	
                        //mv away because in bndrs
                       newIndex(ai);
                     }else{
                     	
                        solveAICollision(ai,index);
                     }
                }

                function runAI(ai){
                	try{
                    
                     var index = ai.getNxtMove();
                     if(!grid[index] && !bndrs[index]){
                        //no other AI in the way and movement within boundaries
                        
                        set(ai, index);
                     }else{
                         //collided with inmovable or ai
                         
                         solveCollision(ai,index);
                     }
                     //flag AI as ran
                     ai.setRan(true);
                     //remove from array
                     clear(ai);
                	}catch(e){
                		console.log(e);
                	}
                     return index;
                }

                function loopAI(){
                    while(ais.length){
                        runAI(ais[0]);
                    }
                }

                loopAI();
                
                clearRanFlag();
            }

            AICollisionDetection();
        }

        function run(){
            var fields = getFields();
            var i = fields.length;
            //run fields
            while(i--){
                runField(fields[i]);
            }
        }
        run();
    }

    function generate(){
        
        var area = new Area(3);
        areas.push(area);

        //UI.drawField(area.getFields()[0]);
    }

    generate();

    var  field = areas[0].getFields()[0];
    field.addPlr(1);
	
	var runs = 0;
    var interval = setInterval(function(){
		gameloop();
		UI.drawField(field);
		runs++;

		if(runs==5){
			clearInterval(interval);
		}
    },500);

 //    gameloop();
	// UI.drawField(field);
    

}

var game = new RPGGame();