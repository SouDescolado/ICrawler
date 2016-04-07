var game;
var ticks;
var found;
var gameSpeed = 1;
var refreshSpeed = 1000;
var init = 0;
var inbattle = false;
var resting = true;
var player = {
	name:"placeholder",
	hp: {id: "hp", curval: 100, maxval: 100},
	mp: {id: "mp", curval: 10, maxval: 10},
	str: {id: "str", val: 5, xp: 0, next: 90},
	dex: {id: "dex", val: 5, xp: 0, next: 90},
	con: {id: "con", val: 5, xp: 0, next: 90},
	spd: {id: "spd", val: 5, xp: 0, next: 90},
	mgc: {id: "mgc", val: 5, xp: 0, next: 90},
	curfloor: 0
};

var tower = [];
for (var i = 0; i <= 1000; i++) {
	if (i == 0) {
		tower.push({size:100, explored:100, advallowed:1, stairpos: 0, density: 0});
	}
	else {
		tempsize = Math.floor(2*tower[i-1].size);
		tempstair = Math.floor(Math.random() * tempsize);
		tempdensity = 10 + Math.random()*40;
		tower.push({size:tempsize, explored:0, advallowed:0, stairpos:tempstair, density:tempdensity});
	}
}

var monster = [];
monster.push({name: "Rat", curhp:50, hp: 50, str: 5, dex: 5, con: 5, killed: 0});
monster.push({name: "Bat", curhp:40, hp: 40, str: 4, dex: 7, con: 4, killed: 0});
monster.push({name: "Slime", curhp: 65, hp: 65, str: 6, dex: 5, con: 7, killed: 0});
monster.push({name: "Kobold", curhp: 180, hp: 180, str: 12, dex: 8, con: 7, killed: 0});
monster.push({name: "Wolf", curhp: 320, hp: 320, str: 20, dex: 15, con: 12, killed: 0});
monster.push({name: "Lizard", curhp: 710, hp: 710, str: 28, dex: 20, con: 25, killed: 0});
monster.push({name: "Goblin", curhp: 1000, hp: 1000, str: 37, dex: 28, con: 35, killed: 0});
monster.push({name: "Bandit", curhp: 1450, hp: 1450, str: 42, dex: 40, con: 25, killed: 0});
monster.push({name: "Giant Wolf", curhp: 2100, hp: 2100, str: 50, dex: 38, con: 40, killed: 0});
monster.push({name: "Armored Slime", curhp: 2750, hp: 2750, str: 25, dex: 5, con: 115, killed: 0});
monster.push({name: "Kobold Leader", curhp: 3800, hp: 3800, str: 84, dex: 72, con: 75, killed: 0});
monster.push({name: "Weakened Minotaur", curhp: 5100, hp: 5100, str: 101, dex: 84, con: 95, killed: 0});
monster.push({name: "Dragon Cub", curhp: 8320, hp: 8320, str: 130, dex: 150, con: 120, killed: 0});
monster.push({name: "Giant Snake", curhp: 13400, hp: 13400, str: 147, dex: 210, con: 95, killed: 0});

var monsterTotal = monster.length - 1;

var updateCondition = function(arg, number) {
	if (arg.id == "hp") {
		arg.maxval = (player.con.val * player.con.val)*4;
	}
	if (arg.id == "mp") {
		arg.maxval = Math.floor(2*(player.mgc.val * player.mgc.val)/5);
	}
	arg.curval = arg.curval + number;
	if (arg.curval < 0) {
		arg.curval = 0;
	}
	if (arg.curval > arg.maxval) {
		arg.curval = arg.maxval;
	}
	document.getElementById(arg.id).innerHTML = Math.floor(arg.curval);
	document.getElementById(arg.id + "max").innerHTML = arg.maxval;
	document.getElementById(arg.id + "bar").style.width = (100 * (arg.curval / arg.maxval)) + "%";
}

var updateStat = function(arg, number) {
	arg.xp = arg.xp + number;
	if (arg.xp >= arg.next) {
		arg.val = arg.val + 1;
		arg.xp = arg.xp - arg.next;
		arg.next = ((arg.val * arg.val) + arg.val)*3;
	}
	document.getElementById(arg.id).innerHTML = arg.val;
	document.getElementById(arg.id + "prog").style.width = (100 * (arg.xp / arg.next)) + "%";
	document.getElementById(arg.id + "per").innerHTML = Math.round(((100 * (arg.xp / arg.next)))*100)/100 + "%";
}

var updateTime = function(number) {
	document.getElementById("seconds").innerHTML = number % 60;
	number = Math.floor(number / 60);
	document.getElementById("minutes").innerHTML = number % 60;
	number = Math.floor(number / 60);
	document.getElementById("hours").innerHTML = number % 24;
	number = Math.floor(number / 24);
	document.getElementById("days").innerHTML = number;
}

var changeFloor = function(number) {
	if (inbattle == false) {
		player.curfloor = player.curfloor + number;
		document.getElementById("floor").innerHTML = player.curfloor;
		document.getElementById("floorbar").style.width = 100*(tower[player.curfloor].explored / tower[player.curfloor].size) + "%";
		document.getElementById("explperc").innerHTML = 100*(tower[player.curfloor].explored / tower[player.curfloor].size);
		if (tower[player.curfloor].advallowed == 1) {
			document.getElementById("advbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(1)">Proceed to Floor <span id="nextfloor">0</span></button>';
			document.getElementById("nextfloor").innerHTML = player.curfloor + 1;
		}
		else {
			document.getElementById("advbut").innerHTML = '';
		}
		if (player.curfloor != 0) {
			document.getElementById("retbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(-1)">Back to Floor <span id="prevfloor">0</span></button>';
			document.getElementById("prevfloor").innerHTML = player.curfloor - 1;
		}
		else {
			document.getElementById("retbut").innerHTML = '';
		}
		if (player.curfloor == 0) {
			resting = true;
			document.getElementById("restwalk").innerHTML = '';
		}
		if (resting) {
			if (tower[player.curfloor].size == tower[player.curfloor].explored && player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Search for Monsters</button>';
			}
			else if (player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Explore Floor</button>';
			}
		}
		else {
			document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Rest</button>';
		}
	}
}

var exploreFloor = function() {
	if (tower[player.curfloor].explored < tower[player.curfloor].size) {
		tower[player.curfloor].explored += player.spd.val/10;
		updateStat(player.spd, player.spd.val/10);
		if (tower[player.curfloor].explored > tower[player.curfloor].size) {
			tower[player.curfloor].explored = tower[player.curfloor].size;
		}
		document.getElementById("floorbar").style.width = 100*(tower[player.curfloor].explored / tower[player.curfloor].size) + "%";
		document.getElementById("explperc").innerHTML = Math.round((100*(tower[player.curfloor].explored / tower[player.curfloor].size))*100)/100 + "%";
	}
	if (tower[player.curfloor].stairpos <= tower[player.curfloor].explored) {
		tower[player.curfloor].advallowed = 1;
		document.getElementById("advbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(1)">Proceed to Floor <span id="nextfloor">0</span></button>';
		document.getElementById("nextfloor").innerHTML = player.curfloor + 1;
	}
	battleChance();
}

var saving = function() {
	save = {
		player: player,
		tower: tower,
		ticks: ticks,
		monster: monster,
		resting: resting
	}
	localStorage.setItem("save",JSON.stringify(save));
}

var load = function() {	
	if (savegame = JSON.parse(localStorage.getItem("save"))) {
		player = savegame.player;
		tower = savegame.tower;
		ticks = savegame.ticks;
		for (var i = 0; i < savegame.monster.length; i++) {
			monster[i].killed = savegame.monster[i].killed;
		}
		resting = savegame.resting;
	}
	else {
		player.name = prompt("Please, enter your name:", "Crawler");
	}
}

var battle = function(arg) {
	if (inbattle == false) {
		document.getElementById("monstername").innerHTML = arg.name;
		document.getElementById("monsterhp").innerHTML = arg.hp;
		document.getElementById("monsterstr").innerHTML = arg.str;
		document.getElementById("monsterdex").innerHTML = arg.dex;
		document.getElementById("monstercon").innerHTML = arg.con;
		document.getElementById("monsterbar").style.width = 100*(arg.curhp/arg.hp) + "%";
		document.getElementById("battlestatus").innerHTML = "You are attacked by a " + arg.name + "!";
		inbattle = true;
	}
	else {
		playerAttackDamage = (2*player.str.val * (player.dex.val/10)) - arg.con/2;
		if (playerAttackDamage > arg.curhp) {
			playerAttackDamage = arg.curhp;
		}
		else if (playerAttackDamage <= 0) {
			playerAttackDamage = 0;
		}
		monsterAttackDamage = (2*arg.str * (arg.dex/10)) - player.con.val/2;
		if (monsterAttackDamage > player.hp.curval) {
			monsterAttackDamage = player.hp.curval;
		}
		else if (monsterAttackDamage <= 0) {
			monsterAttackDamage = 0;
		}
		updateCondition(player.hp, (-monsterAttackDamage));
		updateStat(player.str, playerAttackDamage*(arg.con/player.str.val));
		updateStat(player.con, monsterAttackDamage*(arg.str/player.con.val));
		updateStat(player.dex, player.dex.val/arg.dex);
		
		arg.curhp -= playerAttackDamage;
		document.getElementById("monsterhp").innerHTML = Math.floor(arg.curhp);
		document.getElementById("monsterbar").style.width = 100*(arg.curhp/arg.hp) + "%";
		
		if (arg.curhp <= 0) {
			inbattle = false;
			document.getElementById("battlestatus").innerHTML = "You have defeated " + arg.name + "!";
			updateStat(player.str, arg.str);
			updateStat(player.con, arg.con);
			updateStat(player.dex, arg.dex);
			arg.killed += 1;
			arg.curhp = arg.hp;
			if (resting) {
				if (tower[player.curfloor].size == tower[player.curfloor].explored && player.curfloor != 0) {
					document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Search for Monsters</button>';
				}
				else if (player.curfloor != 0) {
					document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Explore Floor</button>';
				}
			}
		}
		
		if (player.hp.curval <= 0) {
			inbattle = false;
			document.getElementById("battlestatus").innerHTML = "You have been defeated by " + arg.name + "!";
			changeFloor(-player.curfloor);
			player.str.val -= Math.floor(player.str.val/10);
			player.dex.val -= Math.floor(player.dex.val/10);
			player.con.val -= Math.floor(player.con.val/10);
			player.spd.val -= Math.floor(player.spd.val/10);
			player.mgc.val -= Math.floor(player.mgc.val/10);
			updateStat(player.str, -player.str.xp);
			updateStat(player.dex, -player.dex.xp);
			updateStat(player.con, -player.con.xp);
			updateStat(player.spd, -player.spd.xp);
			updateStat(player.mgc, -player.mgc.xp);
		}
	}
}

var battleChance = function() {
	check = Math.random()*100;
	if (check <= tower[player.curfloor].density) {
		found = player.curfloor + (Math.floor(Math.random()*6))-4;
		if (found < 0) {
			found = 0;
		}
		if (found > monsterTotal) {
			found = monsterTotal;
		}
		battle(monster[found]);
	}
}

var explore = function() {
	if (inbattle == false) {
		if (resting) {
			resting = false;
			document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Rest</button>';
		}
		else {
			resting = true;
			if (tower[player.curfloor].size == tower[player.curfloor].explored && player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Search for Monsters</button>';
			}
			else if (player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Explore Floor</button>';
			}
		}
	}
	else {
		resting = true;
		document.getElementById("restwalk").innerHTML = '<button class="btn btn-success btn-block" onClick="explore()">Resting after Battle</button>';
	}
}

var main = function() {
	if (init == 0) {
		ticks = 31536000;
		load();
		document.getElementById("name").innerHTML = player.name;
		updateStat(player.str, 0);
		updateStat(player.dex, 0);
		updateStat(player.con, 0);
		updateStat(player.spd, 0);
		updateStat(player.mgc, 0);
		updateCondition(player.hp, 0);
		updateCondition(player.mp, 0);
		document.getElementById("floor").innerHTML = player.curfloor;
		document.getElementById("explperc").innerHTML = 100*(tower[player.curfloor].explored / tower[player.curfloor].size);
		if (tower[player.curfloor].advallowed == 1) {
			document.getElementById("advbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(1)">Proceed to Floor <span id="nextfloor">0</span></button>';
			document.getElementById("nextfloor").innerHTML = player.curfloor + 1;
		}
		if (player.curfloor != 0) {
			document.getElementById("retbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(-1)">Back to Floor <span id="prevfloor">0</span></button>';
			document.getElementById("prevfloor").innerHTML = player.curfloor - 1;
		}
		if (resting) {
			if (tower[player.curfloor].size == tower[player.curfloor].explored && player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Search for Monsters</button>';
			}
			else if (player.curfloor != 0) {
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Explore Floor</button>';
			}
		}
		else {
			document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Rest</button>';
		}
		refreshSpeed = 1000;
		game = window.clearInterval(game);
		runGame();
		init = 1;
	}
	ticks = ticks - 1;
	if (inbattle == false) {
		if (resting) {
			updateCondition(player.hp, 1*player.con.val);
			updateCondition(player.mp, 1*player.mgc.val);
		}
		else {
			exploreFloor();
		}
	}
	else {
		battle(monster[found]);
	}
	updateTime(ticks);
	saving();
}

var runGame = function() {
	game = window.setInterval(function(){ main() }, refreshSpeed);
}

var hardReset = function() {
	localStorage.removeItem("save");
	location.reload();
}

var speed = function(number) {
	refreshSpeed = number;
	game = window.clearInterval(game);
	runGame();
	document.getElementById("speed").innerHTML = 1000/number;
}

runGame();