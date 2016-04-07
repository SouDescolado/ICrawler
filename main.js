var game;
var queued;
var ticks;
var found;
var gameSpeed = 1;
var refreshSpeed = 1000;
var init = 0;
var inbattle = false;
var resting = true;
var autocrawl = 0;
var player = {
	name:"placeholder",
	hp: {id: "hp", curval: 100, maxval: 100},
	mp: {id: "mp", curval: 10, maxval: 10},
	str: {id: "str", val: 5, xp: 0, next: 90},
	dex: {id: "dex", val: 5, xp: 0, next: 90},
	con: {id: "con", val: 5, xp: 0, next: 90},
	spd: {id: "spd", val: 5, xp: 0, next: 90},
	mgc: {id: "mgc", val: 5, xp: 0, next: 90},
	curfloor: 0,
	excelia: 0
};

var spellbook = [];
spellbook.push({name: "Cure", id: "cure", type: 0, requiredmgc: 5, learned: false, baseMP: 5, xp: 0, next: 100, level: 0});
spellbook.push({name: "Fireball", id: "fireball", type: 1, requiredmgc: 5, learned: false, baseMP: 2, xp: 0, next: 100, level: 0});

var upgrades =[];
upgrades.push({name: "Auto Crawl 1", id: "autocrawl1", desc:"Rest whenever you're below 10% health. Start exploring again when completely healed.", exceliacost: 1000, shown: false, purchased: false});

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

var readSpells = function() {
	document.getElementById("spellbook").innerHTML = '';
	for (var i = 0; i < spellbook.length; i++) {
		if (spellbook[i].learned || spellbook[i].requiredmgc <= player.mgc.val) {
			var btncolor = spellType(spellbook[i].type)
			document.getElementById("spellbook").innerHTML += '<div class="row"><div class="col-xs-5"><button class="btn ' + btncolor + ' btn-block" onClick="cast' + spellbook[i].id + '()">' + spellbook[i].name + '</button></div><div class="col-xs-7"><div class="progress"><div id="' + spellbook[i].id + 'xp" class="progress-bar" role="progressbar" style="width: ' + 100*spellbook[i].xp/spellbook[i].next + '%;"><span id="' + spellbook[i].id + 'prog">' + 100*spellbook[i].xp/spellbook[i].next + '%</span></div></div></div></div><div class="row"><div class="col-xs-5">Level: <span id="' + spellbook[i].id + 'level">0</span></div><div class="col-xs-6"><p class="text-right">Mana Cost: <span id="' + spellbook[i].id + 'cost">0</span></p></div></div>';
			spellbook[i].learned = true;
			document.getElementById(spellbook[i].id + "prog").innerHTML = Math.round(100*(spellbook[i].xp/spellbook[i].next)*100)/100 + "%";
			document.getElementById(spellbook[i].id + "cost").innerHTML = Math.floor(spellbook[i].baseMP + Math.pow(spellbook[i].level, 2));
			document.getElementById(spellbook[i].id + "level").innerHTML = spellbook[i].level;
		}
	}
}

var readUpgrades = function() {
	document.getElementById("upgrades").innerHTML = '';
	for (var i = 0; i < upgrades.length; i++) {
		if ((player.excelia >= upgrades[i].exceliacost || upgrades[i].shown == true) && upgrades[i].purchased == false) {
			upgrades[i].shown = true;
			document.getElementById("upgrades").innerHTML += '<div class="row"><div class="col-xs-12"><button class="btn btn-primary btn-block" onClick="' + upgrades[i].id + 'Buy()">' + upgrades[i].name + '</button><p>' + upgrades[i].desc + ' (Cost: ' + upgrades[i].exceliacost + ')</p></div></div>'
		}
	}
}

var readBuffs = function() {
	document.getElementById("permanent").innerHTML = '';
	if (autocrawl != 0) {
		document.getElementById("permanent").innerHTML += '<li class="list-group-item"><span class="badge">' + autocrawl + '%</span>Auto Crawl</li>'
	}
}

var autocrawl1Buy = function() {
	for (var i = 0; i < upgrades.length; i++) {
		if (upgrades[i].id == "autocrawl1") break;
	}
	if (player.excelia > upgrades[i].exceliacost) {
		updateExcelia(-upgrades[i].exceliacost);
		autocrawl = 10;
		upgrades[i].purchased = true;
		readUpgrades();
	}
}

var spellType = function(number) {
	if (number == 0) {
		return "btn-info";
	}
	else if (number == 1) {
		return "btn-danger";
	}
}

var spellLevel = function(arg, number) {
	arg.xp += number;
	if (arg.xp >= arg.next) {
		arg.level++;
		arg.xp -= arg.next;
		arg.next = 2 * arg.next;
		document.getElementById(arg.id + "cost").innerHTML = Math.floor(arg.baseMP + Math.pow(arg.level, 2));
		readSpells();
	}
	document.getElementById(arg.id + "xp").style.width = 100*(arg.xp/arg.next) + "%";
	document.getElementById(arg.id + "prog").innerHTML = Math.round(100*(arg.xp/arg.next)*100)/100 + "%";
	document.getElementById(arg.id + "level").innerHTML = arg.level;
}

var castcure = function() {
	for (var i = 0; i < spellbook.length; i++) {
		if (spellbook[i].id == "cure") break;
	}
	mpcost = Math.floor(spellbook[i].baseMP + Math.pow(spellbook[i].level, 2));
	if (player.mp.curval >= mpcost) {
		updateCondition(player.mp, -mpcost);
		
		curevalue = 25 * Math.pow(1.5, spellbook[i].level) * Math.pow(1.1, player.mgc.val);
		updateCondition(player.hp, curevalue);
		
		spellLevel(spellbook[i], mpcost/5);
		updateStat(player.mgc, spellbook[i].level+1+mpcost/10);
		updateCondition(player.mp, 0);
	}
}

var castfireball = function() {
	if (inbattle == true) {
		for (var i = 0; i < spellbook.length; i++) {
			if (spellbook[i].id == "fireball") break;
		}
		mpcost = Math.floor(spellbook[i].baseMP + Math.pow(spellbook[i].level, 2));
		if (player.mp.curval >= mpcost) {
			updateCondition(player.mp, -mpcost);
			
			damagevalue = 15 * Math.pow(1.5, spellbook[i].level) * Math.pow(1.1, player.mgc.val);
			if (monster[found].curhp <= damagevalue) {
				damagevalue = monster[found].curhp;
			}
			monster[found].curhp -= damagevalue;
			document.getElementById("monsterbar").style.width = 100*monster[found].curhp/monster[found].hp + "%";
			document.getElementById("monsterhp").innerHTML = Math.floor(monster[found].curhp);
			
			if (monster[found].curhp <= 0) {
				inbattle = false;
				document.getElementById("battlestatus").innerHTML = "You have defeated " + monster[found].name + "!";
				updateStat(player.str, monster[found].str);
				updateStat(player.con, monster[found].con);
				updateStat(player.dex, monster[found].dex);
				monster[found].killed += 1;
				gainExcelia(monster[found]);
				monster[found].curhp = monster[found].hp;
				if (resting) {
					if (tower[player.curfloor].size == tower[player.curfloor].explored && player.curfloor != 0) {
						document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Search for Monsters</button>';
					}
					else if (player.curfloor != 0) {
						document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Explore Floor</button>';
					}
				}
			}
			
			spellLevel(spellbook[i], mpcost/5);
			updateStat(player.mgc, spellbook[i].level+1+mpcost/10);
			updateCondition(player.mp, 0);
		}
	}
}

var gainExcelia = function(arg) {
	var gain = (arg.str + arg.con + arg.dex)/15;
	player.excelia += gain;
	document.getElementById("excelia").innerHTML = Math.round(100*player.excelia)/100;
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

var updateExcelia = function(number) {
	player.excelia += number;
	document.getElementById("excelia").innerHTML = Math.round(100*player.excelia)/100;
}

var changeFloor = function(number) {
	if (inbattle == false) {
		player.curfloor = player.curfloor + number;
		document.getElementById("floor").innerHTML = player.curfloor;
		document.getElementById("floorbar").style.width = 100*(tower[player.curfloor].explored / tower[player.curfloor].size) + "%";
		document.getElementById("explperc").innerHTML = Math.round((100*(tower[player.curfloor].explored / tower[player.curfloor].size))*100)/100 + "%";
		if (tower[player.curfloor].advallowed == 1 && player.curfloor < monster.length) {
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
		if (tower[player.curfloor].explored > tower[player.curfloor].size) {
			tower[player.curfloor].explored = tower[player.curfloor].size;
		}
		document.getElementById("floorbar").style.width = 100*(tower[player.curfloor].explored / tower[player.curfloor].size) + "%";
		document.getElementById("explperc").innerHTML = Math.round((100*(tower[player.curfloor].explored / tower[player.curfloor].size))*100)/100 + "%";
	}
	if (tower[player.curfloor].stairpos <= tower[player.curfloor].explored && tower[player.curfloor].advallowed == 0 && player.curfloor < monster.length) {
		tower[player.curfloor].advallowed = 1;
		document.getElementById("advbut").innerHTML = '<button class="btn btn-default btn-block" onClick="changeFloor(1)">Proceed to Floor <span id="nextfloor">0</span></button>';
		document.getElementById("nextfloor").innerHTML = player.curfloor + 1;
	}
	updateStat(player.spd, player.spd.val/10);
	battleChance();
}

var saving = function() {
	save = {
		player: player,
		tower: tower,
		ticks: ticks,
		monster: monster,
		resting: resting,
		spellbook: spellbook,
		upgrades: upgrades,
		autocrawl: autocrawl
	}
	localStorage.setItem("save",JSON.stringify(save));
}

var load = function() {	
	if (savegame = JSON.parse(localStorage.getItem("save"))) {
		player.name = savegame.player.name;
		player.hp = savegame.player.hp;
		player.mp = savegame.player.mp;
		player.str = savegame.player.str;
		player.dex = savegame.player.dex;
		player.con = savegame.player.con;
		player.spd = savegame.player.spd;
		player.mgc = savegame.player.mgc;
		player.curfloor = savegame.player.curfloor;
		if (savegame.player.excelia != undefined) {
			player.excelia = savegame.player.excelia;
		}
		for (var i = 0; i < savegame.tower.length; i++) {
			if (i == tower.length) break;
			tower[i].size = savegame.tower[i].size;
			tower[i].explored = savegame.tower[i].explored;
			tower[i].advallowed = savegame.tower[i].advallowed;
			tower[i].stairpos = savegame.tower[i].stairpos;
			tower[i].density = savegame.tower[i].density;
		}
		ticks = savegame.ticks;
		for (var i = 0; i < savegame.monster.length; i++) {
			monster[i].killed = savegame.monster[i].killed;
		}
		resting = savegame.resting;
		if (savegame.spellbook != undefined) {
			for (var i = 0; i < savegame.spellbook.length; i++) {
				if (i == spellbook.length) break;
				spellbook[i].learned = savegame.spellbook[i].learned;
				spellbook[i].xp = savegame.spellbook[i].xp;
				spellbook[i].next = savegame.spellbook[i].next;
				spellbook[i].level = savegame.spellbook[i].level;
			}
		}
		if (savegame.upgrades != undefined) {
			for (var i = 0; i < savegame.upgrades.length; i++) {
				if (i == upgrades.length) break;
				upgrades[i].shown = savegame.upgrades[i].shown;
				upgrades[i].purchased = savegame.upgrades[i].purchased;
			}
		}
		if (savegame.autocrawl != undefined) {
			autocrawl = savegame.autocrawl;
		}
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
		playerAttackDamage = (2*player.str.val - arg.con/2) * (player.dex.val/10);
		if (playerAttackDamage > arg.curhp) {
			playerAttackDamage = arg.curhp;
		}
		else if (playerAttackDamage <= 0) {
			playerAttackDamage = 0;
		}
		monsterAttackDamage = (2*arg.str - player.con.val/2) * (arg.dex/10);
		if (monsterAttackDamage > player.hp.curval) {
			monsterAttackDamage = player.hp.curval;
		}
		else if (monsterAttackDamage <= 0) {
			monsterAttackDamage = 0;
		}
		updateCondition(player.hp, (-monsterAttackDamage));
		updateStat(player.str, (arg.str/player.str.val));
		updateStat(player.con, (arg.con/player.con.val));
		updateStat(player.dex, (arg.dex/player.dex.val));
		
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
			gainExcelia(arg);
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
			updateExcelia(-player.excelia);
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
		if (resting && player.hp.curval == player.hp.maxval && player.mp.curval == player.mp.maxval) {
			resting = false;
			document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Rest</button>';
		}
		else if (resting) {
			queued = true;
			document.getElementById("restwalk").innerHTML = '<button class="btn btn-success btn-block" onClick="explore()">Exploration Queued</button>';
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
		document.getElementById("restwalk").innerHTML = '<button class="btn btn-success btn-block" onClick="explore()">Resting Queued</button>';
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
		document.getElementById("explperc").innerHTML = Math.round((100*(tower[player.curfloor].explored / tower[player.curfloor].size))*100)/100 + "%";
		document.getElementById("floorbar").style.width = 100*(tower[player.curfloor].explored / tower[player.curfloor].size) + "%";
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
		document.getElementById("excelia").innerHTML = Math.round(100*player.excelia)/100;
		readSpells();
		readUpgrades();
		readBuffs();
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
			if (queued && player.hp.curval == player.hp.maxval && player.mp.curval == player.mp.maxval) {
				resting = false;
				document.getElementById("restwalk").innerHTML = '<button class="btn btn-default btn-block" onClick="explore()">Rest</button>';
				queued = false;
			}
		}
		else if (100*player.hp.curval/player.hp.maxval <= autocrawl) {
			explore();
			explore();
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
	if (confirm("Are you sure you want to wipe ALL your progress?"))  {
		localStorage.removeItem("save");
		location.reload();
	}
}

var speed = function(number) {
	refreshSpeed = number;
	game = window.clearInterval(game);
	runGame();
	document.getElementById("speed").innerHTML = 1000/number;
}

runGame();