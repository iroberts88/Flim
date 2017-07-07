//----------------------------------------------------------------
//gamesession.js
//----------------------------------------------------------------

var Player = require('./player.js').Player,
    Enemy = require('./enemy.js').Enemy,
    GameModeManager = require('./gamemodemanager.js').GameModeManager,
    SAT = require('./SAT.js'); //SAT POLYGON COLLISSION1


var V = SAT.Vector;
var C = SAT.Circle;
var P = SAT.Polygon;

var GameSession = function (engine) {
    this.engine = engine;

    this.gameModeManager = null;

    this.id = null;
    this.lastTime = null;
    this.queue = null;
    this.players = null;
    this.playerList = null;
    this.playerCount = null;
    this.maxPlayers = null;
    this.minPlayers = null;
    this.enemies = null;
    this.deltaTime = null;
    this.level = null;
    this.width = null;
    this.height = null;
};

GameSession.prototype.init = function (data) {
    this.id = data.sid;
    this.lastTime = Date.now();
    this.queue = [];
    this.players = {};
    this.playerList = [];
    this.playerCount = 0;
    this.level = 1;
    this.minPlayers = 1;
    this.enemies = {};
    this.deltaTime = 0;
    this.playersToAdd = [];
    this.emptyFor = 0;
    this.gameModeManager = new GameModeManager(this);
    //Set up Game mode depending on type -
    switch(data.gameMode){
        case 'solo':
            this.maxPlayers = 1;
            this.gameModeManager.init({
                timePerEvent: 35,
                timeBetweenEvents: .5,
                warningTime: .4,
                maxSquares: 4
            });
            this.gameModeManager.tickFunc = this.gameModeManager.normalTick;
            this.gameModeManager.eventFunc = this.gameModeManager.newEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayer;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayers;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemies;
            break;
        case 'coop':
            this.maxPlayers = 4;
            this.minPlayers = 2;
            this.gameModeManager.init({
                timePerEvent: 40,
                timeBetweenEvents: 5,
                warningTime: 3,
                maxSquares: 4
            });
            this.gameModeManager.tickFunc = this.gameModeManager.normalTick;
            this.gameModeManager.eventFunc = this.gameModeManager.newEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayerCoop;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayersCoop;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemiesCoop;
            break;
        case 'secret':
            this.maxPlayers = 10;
            this.gameModeManager.init({
                timePerEvent: 35,
                timeBetweenEvents: .5,
                warningTime: .4,
                maxSquares: 4
            });
            this.gameModeManager.eventEnemyArray = ['c1','c2','c3','tri'];
            this.gameModeManager.tickFunc = this.gameModeManager.normalTick;
            this.gameModeManager.eventFunc = this.gameModeManager.newEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayerCoop;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayersCoop;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemies;
            this.level = 1111;
            break;
        case 'vs':
            this.maxPlayers = 2;
            this.minPlayers = 2;
            this.gameModeManager.init({
                timePerEvent: 35,
                timeBetweenEvents: 5,
                warningTime: 3,
                maxSquares: 4
            });
            this.gameModeManager.tickFunc = this.gameModeManager.normalTick;
            this.gameModeManager.eventFunc = this.gameModeManager.newEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayerVersus;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayers;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemies;
            break;
        case 'star':
            this.maxPlayers = 1;
            this.gameModeManager.init({
                timePerEvent: 35,
                timeBetweenEvents: .5,
                warningTime: .4,
                maxSquares: 0
            });
            this.gameModeManager.tickFunc = this.gameModeManager.starsTick;
            this.gameModeManager.eventFunc = this.gameModeManager.newEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayerStars;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayers;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemies;
            break;
        case 'chaos':
            this.maxPlayers = 100;
            this.gameModeManager.init({
                timePerEvent: 35,
                timeBetweenEvents: .5,
                warningTime: .4,
                maxSquares: 8
            });
            this.gameModeManager.tickFunc = this.gameModeManager.normalTick;
            this.gameModeManager.eventFunc = this.gameModeManager.chaosEvent;
            this.gameModeManager.killPlayerFunc = this.gameModeManager.killPlayer;
            this.gameModeManager.tickPlayersFunc = this.gameModeManager.tickPlayers;
            this.gameModeManager.tickEnemiesFunc = this.gameModeManager.tickEnemies;
            this.gameModeManager.eventEnemyArray = ['c1','c2','c3','tri','trap','hex','chaos','star'];
            break;
    }
    this.gameModeManager.gameMode = data.gameMode;
    this.width = 1920;
    this.height = 1080;
};

GameSession.prototype.addPlayer = function(p) {
    p.tryingToJoinGame = false;
    p.god = false;
    this.gameModeManager.timeBetweenEventsTicker = 0; //reset time between events
    this.gameModeManager.warningSent = false;
    p.setGameSession(this);
    this.playerCount += 1;

    //send the new player data to players already in the session
    for (var i in this.players){
        var d = {
                id: p.id,
                x: p.hitData.pos.x,
                y: p.hitData.pos.y,
                radius: p.radius,
                speed: p.speed
            };
        this.queuePlayer(this.players[i],'addPlayerWisp', d);
    }

    //send session info to the new player
    var players = [];
    var enemies = [];
    for (var i in this.players){
        var player = this.players[i];
        players.push({
            id: i,
            x: player.hitData.pos.x,
            y: player.hitData.pos.y,
            radius: player.radius,
            speed: player.speed
        })
    }
    var enemies = [];
    for (var enemy in this.enemies){
        var e = this.enemies[enemy];
        enemies.push({type: e.type, id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
    }
    //gameInfo data will init the game state for the new player
    this.queuePlayer(p,'gameInfo', {id: p.id, x: 960, y: 540, players: players, radius: p.radius, speed: p.speed, enemies: enemies});
    this.playerList.push(p.id);
    this.players[p.id] = p;
}

GameSession.prototype.removePlayer = function(p) {
    for (var j = 0; j < this.playerList.length;j++){
        if (this.playerList[j] == p.id){
            this.playerList.splice(j,1);
            break;
        }
    }
    this.engine.players[p.id] = p;
    p.init({});
    //return the player back to the main menu
    this.engine.queuePlayer(p,'backToMainMenu',{id:p.id});
    p.gameSession = null;
    delete this.players[p.id];
    this.playerCount -= 1;
}


GameSession.prototype.addEnemy = function(eCode, data) {
    var e = Enemy();
    //Data to initialize enemy
    var eData = {
        speed: null,
        behaviour: null,
        pos: null,
        type: eCode
    };

    switch(eCode){
        case "chaos":
            //slow circle
            eData.speed = 0;
            eData.behaviour = {name: 'chaos', spring: 2+ Math.floor(Math.random()*4), targetId: data.target,speed: 400+(100*Math.floor(Math.random()*6))};
            eData.radius = 10;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 10;
            break;
        case 'star':
            //bouncing star
            var x, y = 0;
            eData.pos = this.gameModeManager.getRandomPos(true);
            if (eData.pos[0] < 950) {
                x = 1000 + Math.round(Math.random() * 900);
            } else {
                x = Math.round(Math.random() * 900);
            }
            if (eData.pos[1] < 500) {
                y = 550 + Math.round(Math.random() * 500);
            } else {
                y = Math.round(Math.random() * 500);
            }
            eData.speed = 450;
            eData.behaviour = {name: 'star', startMove: [x,y]};
            eData.radius = 20;
            eData.killToStartNextEvent = false;
            eData.scoreBase = 0;
            break;
        case 'hex':
            //hexagon
            eData.speed = 800;
            eData.behaviour = {name: 'hexagon', targetId: data.target};
            eData.radius = 20;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 5;
            break;
        case "tri":
            //slow circle
            eData.speed = 700;
            eData.behaviour = {name: 'basicMoveTowards', spring: 2, targetId: data.target};
            eData.radius = 30;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 4;
            break;
        case "c1":
            //slow circle
            eData.speed = 400;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 1;
            break;
        case "c2":
            //med circle
            eData.speed = 600;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 2;
            break;
        case "c3":
            //fast circle
            eData.speed = 800;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.gameModeManager.getRandomPos();
            eData.scoreBase = 3;
            break;
        case "sq":
            //square
            eData.speed = 0;
            eData.behaviour = {name: 'square'};
            eData.killToStartNextEvent = false;
            eData.hitBoxSize = [60,60];
            eData.pos = [200 + Math.round(Math.random()*1520), 200 + Math.round(Math.random()*680)];
            eData.scoreBase = 1;
            break;
        case "sq2":
            //square
            eData.speed = 150;
            eData.killToStartNextEvent = false;
            eData.hitBoxSize = [60,60];
            eData.pos = [200 + Math.round(Math.random()*1520), 200 + Math.round(Math.random()*680)];
            var x,y;
            if (eData.pos[0] < 950) {
                x = 1000 + Math.round(Math.random() * 900);
            } else {
                x = Math.round(Math.random() * 900);
            }
            if (eData.pos[1] < 500) {
                y = 550 + Math.round(Math.random() * 500);
            } else {
                y = Math.round(Math.random() * 500);
            }
            eData.behaviour = {name: 'square2', startMove: [x,y]};
            eData.scoreBase = 1;
            break;
        case "trap":
            //trapezoid
            eData.speed = 100;
            eData.behaviour = {name: 'trapezoid'};
            eData.killToStartNextEvent = false;
            eData.hd = {pos: data.pos,points:[[-32,-32],[-64,32],[64,32],[32,-32]]};
            eData.scoreBase = 1;
            break;
        case "par":
            //parallelogram
            eData.speed = 200;
            eData.behaviour = {name: 'parallelogram'};
            eData.killToStartNextEvent = true;
            eData.hd = {pos: data.pos,points:[[-64,-64],[-128,64],[64,64],[128,-64]]};
            eData.scoreBase = 1;
            break;
    }
    e.setGameSession(this);
    e.init(eData);
    e.id = this.engine.getID();
    this.enemies[e.id] = e;
    return e;
}

GameSession.prototype.removeEnemy = function(e) {
    for(var i = 0; i < this.enemies.length; i++) {
        if(this.enemies[i] === p) {
            this.enemies.splice(i, 1);
        }
    }
}

GameSession.prototype.emit = function() {
    try{
        var i;
        for(i in this.players) {
            this.players[i].socket.emit('serverUpdate', this.players[i].netQueue);
        }
    }catch(e){
        try{
            console.log(this.players[i].netQueue);
        }catch(e){}
        console.log(e);
        console.log(i);
    }
}
//Queue data to all players in the session
GameSession.prototype.queueData = function(c, d) {
    var data = { call: c, data: d};
    var i;
    for(i in this.players) {
        this.players[i].netQueue.push(data);
    }
}

//Queue data to a specific player
GameSession.prototype.queuePlayer = function(player, c, d) {
    var data = { call: c, data: d};
    player.netQueue.push(data);
}

GameSession.prototype.clearQueue = function() {
    //this.queue = [];
    var i;
    for(i in this.players) {
        this.players[i].netQueue = [];
    }
}

GameSession.prototype.log = function(data) {
    this.queueData('debug', data);
}

GameSession.prototype.tick = function(deltaTime) {
    this.deltaTime = deltaTime;
    
    if (this.playerCount <= 0){
        this.emptyFor += deltaTime;
    }
    this.emit();
    // Empty queue
    this.clearQueue();
    // add players waiting to join
    var added = false;

    if (this.playerCount < this.minPlayers) {
        // a player has disconnected... remove the last player
        for (var i in this.players) {
            var winner = this.players[i];
            winner.god = true;
            winner.kill = true;
            this.queuePlayer(winner, 'disconnect', {});
        }
    }
    if (this.playerCount+this.playersToAdd.length >= this.minPlayers){
        for (var i = 0; i < this.playersToAdd.length; i ++){
            this.addPlayer(this.playersToAdd[i]);
            added = true;
            delete this.engine.players[this.playersToAdd[i].id];
        }
    }
    if (added){
        this.playersToAdd = [];
    }
    //Tick all players
    this.gameModeManager.tickPlayersFunc(this.deltaTime);
    //tick all enemies
    this.gameModeManager.tickEnemiesFunc(this.deltaTime);

    //tick gameModeManager
    this.gameModeManager.tick(deltaTime);
}

exports.GameSession = GameSession;
