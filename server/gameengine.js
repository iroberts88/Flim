//----------------------------------------------------------------
//gameengine.js
//----------------------------------------------------------------

var GameSession = require('./gamesession.js').GameSession

var self = null;

var GameEngine = function() {
    this.soloHighScores = {};
    this.coopHighScores = {};
    this.users = {};
    this._userIndex = {};
    this.gameTickInterval = 20;
    this.lastTime = Date.now();
    this.sessions = {}; //List of currently active gameSessions
    this.players = {}; //List of players that do not have a gameSession
    this.openSessions = null;

    this.playerCount = 0;
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
    var now = Date.now();
    var deltaTime = (now-this.lastTime) / 1000.0;
    //update all sessions
    self.openSessions = [];
    for(var i in self.sessions) {
        self.sessions[i].tick(deltaTime);
        if (self.sessions[i].playerCount < self.sessions[i].maxPlayers){
            //this session is open
            self.openSessions.push(self.sessions[i]);
        }
        if (self.sessions[i].playerCount + self.sessions[i].playersToAdd.length <= 0){
            self.sessions[i].emptyFor += deltaTime;
            if (self.sessions[i].emptyFor > 0.1){
                console.log("deleting session " + self.sessions[i].id);
                delete self.sessions[i];
            }
        }
    }
    for (var player in self.players){
        var p = self.players[player];
        if(p.tryingToJoinGame){
            var openSession = false;
            for (var session = 0;session < self.openSessions.length;session++){
                if (self.openSessions[session].gameModeManager.gameMode == p.tryingToJoinGame){
                    //there is an open session of the correct type
                    //add the player if it is between rounds!
                    openSession = true;
                    if (self.openSessions[session].gameModeManager.betweenEvents && self.openSessions[session].playerCount + self.openSessions[session].playersToAdd.length <= self.openSessions[session].maxPlayers){
                        self.openSessions[session].playersToAdd.push(p);
                        p.tryingToJoinGame = false;
                        p.tryingToJoinSession = self.openSessions[session];
                    }
                }
            }
            if (!openSession){
                console.log('Creating a new ' + p.tryingToJoinGame + ' session');
                var s = new GameSession(self);
                s.init({ sid: self.getID(), gameMode: p.tryingToJoinGame });
                console.log('session id: ' + s.id);
                self.sessions[s.id] = s;
            }
        }
    }
    self.emit();
    self.clearQueue();
    this.lastTime = now;
}

GameEngine.prototype.singlePlayerSession = function(p, type){
    console.log('Creating single player session for ' + p.id);
    if (typeof type == 'undefined'){type = 'solo'}
    var s = new GameSession(self);
    s.init({ sid: self.getID(), gameMode: type });
    console.log('session id: ' + s.id);
    s.maxPlayers = 1;
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

GameEngine.prototype.loadHighScores = function(arr) {
    this.soloHighScores = arr[0].solo;
    this.coopHighScores = arr[0].coop;
    console.log('loaded High Scores from db');
}

GameEngine.prototype.loadUsers = function(arr) {
    for (var i = 0;i < arr.length;i++){
        this.users[arr[i]._id] = arr[i];
        this._userIndex[arr[i].userName] = arr[i]._id;
    }
    console.log("loaded " + (i) + ' users from db');
}

// ----------------------------------------------------------
// Socket Functions
// ----------------------------------------------------------

GameEngine.prototype.newConnection = function(socket) {
    console.log('New Player Connected');
    console.log('Socket ID: ' + socket.id);
    self.playerCount += 1;
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