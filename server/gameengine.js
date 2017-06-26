//----------------------------------------------------------------
//gameengine.js
//----------------------------------------------------------------

var GameSession = require('./gamesession.js').GameSession

var self = null;

var GameEngine = function() {
    this.DBINDEX = {};
    this.gameTickInterval = 20;

    this.sessions = {}; //List of currently active gameSessions
    this.players = {}; //List of players that do not have a gameSession
    this.nextOpenSession = null;

    //variables for ID's
    this.ids = {};
    this.possibleIDChars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    //TODO get rid of these?
    this.enemies = {};
}

GameEngine.prototype.init = function () {
    this.start();
};

GameEngine.prototype.start = function () {
    console.log('Starting Game Engine.');
    console.log('Ready. Waiting for players to connect...');
    self = this;
    setInterval(this.tick, this.gameTickInterval);
}

GameEngine.prototype.tick = function() {
    //update all sessions
    self.nextOpenSession = null;
    for(var i in self.sessions) {
        var openSession = false;
        if (self.sessions[i].playerCount > 0){
            self.sessions[i].tick();
            if (self.sessions[i].playerCount < self.sessions[i].maxPlayers){
                //this session is open
                self.nextOpenSession = self.sessions[i];
                openSession = true;
            }
        }else{
            //empty session. remove it!
            delete self.sessions[i];
        }
        if (!openSession){
            //no open sessions available for players;
            self.nextOpenSession = null;
        }
    }
    for (var player in self.players){
        var p = self.players[player];
        if(p.tryingToJoinGame){
            if (self.nextOpenSession){
                //there is an open session
                //add the player if it is between rounds!
                if (self.nextOpenSession.eventHandler.betweenEvents){
                    console.log('Adding ' + p.id + ' to next open session');
                    self.nextOpenSession.addPlayer(p);
                    delete self.players[player];
                }
            }else{
                //no open session, create a new one!
                console.log('Creating a new session for player ' + p.id);
                var s = new GameSession(self);
                s.init({sid:self.getID()});
                self.sessions[s.id] = s;
                s.addPlayer(p);
                delete self.players[player];
            }
        }
    }
    self.emit();
    self.clearQueue();
}

GameEngine.prototype.singlePlayerSession = function(p, secret){
    console.log('Creating single player session for ' + p.id);
    var s = new GameSession(self);
    s.init({sid:self.getID()});
    s.maxPlayers = 1;
    if (secret){
        s.maxPlayers = 10;
        s.eventHandler.eventEnemyArray = ['c1','c2','c3','tri','hex','star'];
        s.level = 1000;
    }
    self.sessions[s.id] = s;
    s.addPlayer(p);
    delete self.players[p.id];
}

GameEngine.prototype.getID = function() {
    var id = '';
    for( var i=0; i < 6; i++ ){
        id += this.possibleIDChars.charAt(Math.floor(Math.random() * this.possibleIDChars.length));
    }
    if (!this.ids[id]){
        this.ids[id] = 1;
        return id;
    }else{
        return this.getID();
    }
    return id;
}

// ----------------------------------------------------------
// Data loading functions (from db etc)
// ----------------------------------------------------------

GameEngine.prototype.loadEnemies = function(arr) {
    for (var i = 0; i < arr.length; i++){
        this.enemies[arr[i]._id] = arr[i];
        this.DBINDEX[arr[i]._dbIndex] = arr[i]._id;
    }

    console.log("loaded " + (i+1) + ' enemies from db');
}

// ----------------------------------------------------------
// Socket Functions
// ----------------------------------------------------------

GameEngine.prototype.newConnection = function(socket) {
    console.log('New Player Connected');
    console.log('Socket ID: ' + socket.id);
    //Initialize new player and add to the proper session
    var p = Player();
    p.id = self.getID();
    p.setGameEngine(self);
    console.log('Player ID: ' + p.id);
    p.init({socket:socket});
    self.queuePlayer(p,'connInfo', {});
    self.players[p.id] = p;
}

GameEngine.prototype.emit = function() {
    var i;
    try{
        for(i in this.players) {
            if (this.players[i].netQueue.length > 0){
                this.players[i].socket.emit('serverUpdate', this.players[i].netQueue);
            }
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
GameEngine.prototype.queueData = function(c, d) {
    var data = { call: c, data: d};
    var i;
    for(i in this.players) {
        this.players[i].netQueue.push(data);
    }
}

//Queue data to a specific player
GameEngine.prototype.queuePlayer = function(player, c, d) {
    var data = { call: c, data: d};
    player.netQueue.push(data);
}

GameEngine.prototype.clearQueue = function() {
    //this.queue = [];
    var i;
    for(i in this.players) {
        this.players[i].netQueue = [];
    }
}

exports.GameEngine = GameEngine;