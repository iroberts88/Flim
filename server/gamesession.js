//----------------------------------------------------------------
//gamesession.js
//----------------------------------------------------------------

var Player = require('./player.js').Player,
    Enemy = require('./enemy.js').Enemy,
    EventHandler = require('./eventhandler.js').EventHandler,
    SAT = require('./SAT.js'); //SAT POLYGON COLLISSION1


var V = SAT.Vector;
var C = SAT.Circle;
var P = SAT.Polygon;

var GameSession = function (engine) {
    this.engine = engine;

    this.eventHandler = null;

    this.id = null;
    this.lastTime = null;
    this.queue = null;
    this.players = null;
    this.playerList = null;
    this.playerCount = null;
    this.maxPlayers = null;
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
    this.maxPlayers = 4;
    this.enemies = {};
    this.deltaTime = 0;
    this.eventHandler = new EventHandler(this);
    this.eventHandler.init({
        timePerEvent: 30,
        timeBetweenEvents: .25,
        warningTime: .1,
        maxSquares: 4
    });
    this.level = 1;
    this.width = 1920;
    this.height = 1080;
};

GameSession.prototype.addPlayer = function(p) {
    p.tryingToJoinGame = false;
    this.eventHandler.timeBetweenEventsTicker = 0; //reset time between events
    this.eventHandler.warningSent = false;
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
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case 'star':
            //bouncing star
            var x, y = 0;
            eData.pos = this.eventHandler.getRandomPos(true);
            if (eData.pos[0] < 950) {
                x = 1000 + Math.round(Math.random() * 900);
            } else {
                x = Math.round(Math.random() * 900);
            }
            if (eData.pos[1] < 500) {
                y = 550 + Math.round(Math.random() * 500);
            } else {
                y = Math.round(Math.random() * 900);
            }
            eData.speed = 450;
            eData.behaviour = {name: 'star', startMove: [x,y]};
            eData.radius = 20;
            eData.killToStartNextEvent = false;
            break;
        case 'hex':
            //hexagon
            eData.speed = 800;
            eData.behaviour = {name: 'hexagon', targetId: data.target};
            eData.radius = 20;
            eData.killToStartNextEvent = true;
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case "tri":
            //slow circle
            eData.speed = 700;
            eData.behaviour = {name: 'basicMoveTowards', spring: 2, targetId: data.target};
            eData.radius = 30;
            eData.killToStartNextEvent = true;
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case "c1":
            //slow circle
            eData.speed = 400;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case "c2":
            //med circle
            eData.speed = 600;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case "c3":
            //fast circle
            eData.speed = 800;
            eData.behaviour = {name: 'basicMoveTowards', spring: 5, targetId: data.target};
            eData.radius = 8;
            eData.killToStartNextEvent = true;
            eData.pos = this.eventHandler.getRandomPos();
            break;
        case "sq":
            //square
            eData.speed = 0;
            eData.behaviour = {name: 'square'};
            eData.killToStartNextEvent = false;
            eData.hitBoxSize = [60,60];
            eData.pos = [200 + Math.round(Math.random()*1520), 200 + Math.round(Math.random()*680)];
            break;
        case "trap":
            //trapezoid
            eData.speed = 100;
            eData.behaviour = {name: 'trapezoid'};
            eData.killToStartNextEvent = false;
            eData.hd = {pos: data.pos,points:[[-32,-32],[-64,32],[64,32],[32,-32]]};
            break;
        case "par":
            //parallelogram
            eData.speed = 200;
            eData.behaviour = {name: 'parallelogram'};
            eData.killToStartNextEvent = true;
            eData.hd = {pos: data.pos,points:[[-64,-64],[-128,64],[64,64],[128,-64]]};
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

GameSession.prototype.tick = function() {
    var now = Date.now();
    var deltaTime = (now-this.lastTime) / 1000.0;
    this.deltaTime = deltaTime;
    //while(this.queue.length > 0) {
    //    var d = this.queue.shift();
    //    this.emit(d.call, d.data);
    //}
    // emit queue as a single object
    // This should be changed to be more specific next time, calculating deltas etc (so only the most recent move per player etc)
    //this.emit(this.queue);
    this.emit();
    // Empty queue
    this.clearQueue();
    //Tick all players
    for (var i in this.players){
        var player = this.players[i];
        player.tick(this.deltaTime);
        if (player.kill){
            player.killCountDown -= deltaTime;
            if (player.killCountDown <= 0){
                //remove player from session?
                this.removePlayer(player);
            }
        }
    }
    //tick all enemies
    for (var i in this.enemies){
        this.enemies[i].tick(this.deltaTime);
        if (this.enemies[i].kill){
            this.queueData('removeEnemy', {id: this.enemies[i].id});
            delete this.enemies[i];
        }
    }

    //tick eventHandler
    this.eventHandler.tick(deltaTime);

    this.lastTime = now;
}

exports.GameSession = GameSession;
