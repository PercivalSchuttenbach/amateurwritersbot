var ti = 10;
var ai = 52;
var fr = 9;
var fs = fr-1;
var fsize = fr*fr;

var u = Math.floor(ai/fr),d=fs-u;
var v = Math.floor(ti/fr)-u;
var tv = Math.floor(ti/fr);
var l = ai%fr,r=fs-l;
var h = (ti%fr)-l;
var th = ti%fr;
var av = Math.abs(v),ah=Math.abs(h);

var path = [];

var objects = [25,,30,32,39,41,43,51,58,59];
var roam = new Array(fsize);

for(var i=0; i<fsize; i++){
	if(objects.indexOf(i)==-1) roam[i]=1;
}

function as(v,h){
	return Math.max(Math.abs(v),Math.abs(h));
}

//addClosest(obj, sort[s], )
function addClosest(obj, sort){
	function addNext(sobj, c1, c2){
		// if(sobj.i==ai || obj.i==ai){
		// 	console.log("::: " + c1 + " :::");
		// 	console.log(obj);
		// 	console.log(sobj);
		// 	console.log('=========');
		// }
		if(sobj[c1] == obj[c1]){
			if(sobj[c2] < obj[c2]){
				obj.next.push(sobj);
				sobj.prev.push(obj);
			}else{
				//sobj is farther away
				sobj.next.push(obj);
				obj.prev.push(sobj);
			}
			return true;
		}
		return false;
	}
	var closest = sort.filter(function(sobj){
		return (sobj.h==obj.h && Math.max(sobj.v,obj.v) - Math.min(sobj.v,obj.v) == 1) || (sobj.v==obj.v && Math.max(sobj.h,obj.h) - Math.min(sobj.h,obj.h) == 1);
	});
	while(closest.length){
		var sobj = closest.shift();
		if(obj.s!=sobj.s){
			console.log(obj);
			console.log(sobj);
			console.log('=======');
		}
		//if(obj.s==sobj.s){
			if(!addNext(sobj, 'th', 'tv')){
				addNext(sobj, 'tv', 'th');
			}
		// }else{
		// 	if(obj.s > sobj.s){
		// 		sobj.next.push(obj);
		// 		sobj.prev.push(obj);
		// 	}else{
		// 		obj.prev.push(sobj);
		// 		obj.next.push(sobj);
		// 	}
		// }
	}
}

var sort = [], target,start;
var test = roam.map(function(val,key){
	var va = Math.floor(key/fr)-u, ha = (key%fr)-l, s = as(va,ha), vt = Math.floor(key/fr)-tv, ht=(key%fr)-th;
	var obj = {'i':key,'t':key==ti,'s':s,'v':va,'h':ha,'tv':vt,'th':ht,'next':[], 'prev':[],'valid':false};
	if(sort[s-1]){
		addClosest(obj, sort[s-1]);
	}
	if(sort[s+1]){
		addClosest(obj, sort[s+1]);
	}
	if(sort[s]){
		addClosest(obj, sort[s]);
	}
	if(!sort[s]||!sort[s].length){
		sort[s] = [];
	}
	if(obj.t){
		target = obj;
	}
	if(obj.i==ai){
		start = obj;
	}
	sort[s].push(obj);	
	return key;
});

var found = false;
function removePaths(obj){
	//if(found) return true;
	//console.log('start with: ' + obj.i);
	//loop through all previous nodes
	for(var i in obj.next){
		var next = obj.next[i];
		console.log(obj.i +'>'+ next.i);
		//check if we found the start
		if(next.i==target.i){
			console.log('found');
			obj.valid = true;
			found = true;
			//break;
		}else{
			//start not found keep looking
			var result = removePaths(next);
			if(!result){
				obj.next.splice(i,1);
			}
			if(result==2){
				obj.valid = true;
			}
		}
	}

	if(found){
		return 2;
	}
	if(!obj.next.length){//&& !obj.next.length
	 	// console.log('end of the road');
	 	//console.log('done with :' + obj.i);
	 	return false;
	}
	//console.log('done with :' + obj.i);
	return 1;
}
//removePaths(start);
console.log(start);

var found = false;
var map = new Array(fsize);
map.fill(0);
for(var i in objects){
	map[objects[i]] = 1;
}
function followPath(step){
	if(found) return;

	var next;
	if(Array.isArray(step)){
		var steps = step.filter(o=>o.valid);
		next = steps[Math.floor(Math.random()*steps.length)];
	}else{
		next = step.next;
		if(step.t){
		 	map[step.i] = 'x';
		 	found = true;
		}else{
		 	map[step.i] = 'o';
		}
	}
	if(next){
	 	followPath(next);
	}
}
map[start.i] = '+';
//followPath(start.next);
var display = '';
for(var i=0;i<test.length;i++){
	display += (!test[i] ? (i==ai ? ' +' : ' %') : (i==ti ? ' o' : '00'.substring(0,2-(test[i]+'').length)+test[i])) + (((i+1)%fr==0)?'\n':'|');
}
console.log(display);