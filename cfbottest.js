var board = [
	/*0*/[0,0,0,0,0,0,0,0],
	/*1*/[0,0,0,0,0,0,0,0],
	/*2*/[0,0,0,0,0,0,0,0],
	/*3*/[0,0,0,0,0,0,0,0],
	/*4*/[0,0,0,2,2,0,0,0],
	/*5*/[0,2,3,3,2,3,0,0],
];
var look = [[0,-4],[0,4],[-4,0],[-4,-4],[-4,4],[4,0],[4,-4],[4,4]];

//var drop = 5;

function fdrop(n){
	var cp = 3;
	var j = board.length;
    while(j--){
        if(!board[j][n]){
            board[j][n] = cp;
            break;
        }
    }
    console.log('dropped');
}

var strategies = [];

function checkPosibility(j,d,v,h,sv,sh){
	var r=j,c=d,chance=0,possibility=[];
	while(r!=v||c!=h){
		if(board[r][c]==3){
			chance=0;
			break;
		}
		if(board[r][c]==2)chance++;
		if(board[r][c]==0)possibility.push([r,c]);

		r+=sv;
		c+=sh;
	}
	return {chance,possibility};
}

function lookAround(j,d){
	console.log('look');
	if(board[j][d]!=2)return;
	look.forEach((l)=>{
		let v = j+l[0],h=d+l[1], sv = Math.sign(l[0]), sh = Math.sign(l[1]);
		if(v<0||h<0||v>5||h>7)return;

		var {chance,possibility} = checkPosibility(j,d,v,h,sv,sh);
		
		if(chance==3){
			//console.log(':scream:');
			var t = possibility[0];
			if(board[t[0]+1][t[1]]){
		 		console.log(':scream:');
		 		fdrop(t[1]);
		 	}
		}
		if(chance==2){
			possibility = possibility.filter((p)=>board[p[0]+1][p[1]]!=0);
			console.log(possibility);
		}
		//board[v][h]=1;
	});
}

// var j = board.length,i=0;
// while(j--){
//     if(board[j][drop]==2){
//     	i=j;
//     }
//     if(board[j][drop]==0)break;
// }
// lookAround(i,drop);

var j=board[0].length,i;
//moving from left to right
while(j--){
	i=board.length;
	//moving from bottom to top
	while(i-- && board[i][j]){
		lookAround(i,j);
	}
}

console.log(board);
