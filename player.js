//----------------------------------------------------------------
//player.js
//----------------------------------------------------------------

var SAT = require('./SAT.js'), //SAT POLYGON COLLISSION1
    Unit = require('./unit.js').Unit,
    User = require('./user.js').User,
    AWS = require("aws-sdk");
    
const crypto = require('crypto');

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var P = SAT.Polygon;
var V = SAT.Vector;
var C = SAT.Circle;

Player = function(){

    var player = Unit()

    player.radius = null;
    player.targetPosition = null;
    //variables for movement
    player.xDistance = null;
    player.yDistance = null;
    player.hyp = null;
    player.move = null;
    player.actualMoveX = null;
    player.actualMoveY = null;
    player.actualMoveHyp = null;

    player.vectorHitbox = null;

    player.tryingToJoinGame = null;
    player.tryingToJoinSession = null;

    player.kill = null;
    player.revive = null;
    player.killCountDown = null;
    player.god = false;
    player.godTimer = 0;
    player.godTemp = false;

    player.score = 0;

    player.user = null;

    player.enemiesToAdd = null;

    player.init = function (data) {
        //init player specific variables
        this.speed = 6000;
        this.score = 0;
        this.god = false;
        this.godTimer = 0;
        this.godTemp = false;
        this.radius = 20;
        this.kill = false;
        this.revive = false;
        this.killCountDown = 5; //seconds before returned to main menu
        this.netQueue = [];
        this.hitData = new P(new V(960, 540),   [new V(Math.round(-.8*this.radius),Math.round(-.8*this.radius)),
                                             new V(Math.round(-.8*this.radius),Math.round(.8*this.radius)),
                                             new V(Math.round(.8*this.radius),Math.round(.8*this.radius)),
                                             new V(Math.round(.8*this.radius),Math.round(-.8*this.radius))]);
        this.targetPosition = new V(960,540);

        this.vectorHitbox = new P(new V(960,540),[new V(0,-1),new V(0,1),new V(10,1),new V(10,-1)]);

        this.tryingToJoinGame = false;

        this.enemiesToAdd = [];

        if (typeof data.socket != 'undefined'){
            this.socket = data.socket;
            this.setupSocket();
        }
    };
    player.tick = function(deltaTime){
        if (this.godTimer > 0){
            this.godTimer -= deltaTime;
            this.godTemp = true;
        }else if(this.godTemp){
            this.godTemp = false;
            this.god = false;
        }
        //Move closer to targetPosition
        this.xDistance = this.targetPosition.x - this.hitData.pos.x;
        this.yDistance = this.targetPosition.y - this.hitData.pos.y;
        this.hyp = Math.sqrt(this.xDistance*this.xDistance + this.yDistance*this.yDistance);
        this.move = new V(this.xDistance/this.hyp,this.yDistance/this.hyp);
        this.actualMoveX = this.move.x*this.speed*deltaTime;
        this.actualMoveY = this.move.y*this.speed*deltaTime;
        this.actualMoveHyp = Math.sqrt(this.actualMoveX*this.actualMoveX + this.actualMoveY*this.actualMoveY);
        if (this.hyp < this.actualMoveHyp){
            this.vectorHitbox = new P(new V(this.hitData.pos.x,this.hitData.pos.y),[new V(0,this.radius*-1),new V(0,this.radius),new V(this.hyp+1,this.radius),new V(this.hyp+1,this.radius*-1)]);
            this.hitData.pos = new V(this.targetPosition.x, this.targetPosition.y);
        }else{
            this.vectorHitbox = new P(new V(this.hitData.pos.x,this.hitData.pos.y),[new V(0,this.radius*-1),new V(0,this.radius),new V(this.actualMoveHyp+1,this.radius),new V(this.actualMoveHyp+1,this.radius*-1)]);
            this.hitData.pos.x += this.actualMoveX;
            this.hitData.pos.y += this.actualMoveY;
        }
        this.vectorHitbox.rotate(Math.atan2(this.yDistance,this.xDistance));
    };

    player.onDisconnect = function(callback) {
        this.onDisconnectHandler = callback;
    };

    player.setupSocket = function() {

        // On playerUpdate event
        var that = this;

        this.socket.on('playerUpdate', function (data) {
            if (that.gameSession){
                //if the player is in a gameSession - deal with received data
                if (data.newMouseLoc){
                    //need to track player movement on server
                    for (var p in that.gameSession.players){
                        var player = that.gameSession.players[p];
                        if (that.id != p){
                            that.gameSession.queuePlayer(player,'updatePlayerLoc', {playerId: that.id, newLoc: data.newMouseLoc});
                        }
                    }
                    //update the new location
                    that.targetPosition.x = data.newMouseLoc[0];
                    that.targetPosition.y= data.newMouseLoc[1];
                }else if(data.requestEnemies){
                    var enemiesToAdd = [];
                    that.gameSession.queuePlayer(that,'addEnemies',{enemies: that.enemiesToAdd, received: Date.now()});
                    that.enemiesToAdd = [];
                }else if (data.killedEnemy){
                    try{
                        var enemy = that.gameSession.enemies[data.killedEnemy];
                        var near = false; //see if enemy is near a square
                        for (var i = 0; i < that.gameSession.gameModeManager.squares.length;i++){
                            var square = that.gameSession.gameModeManager.squares[i];
                            var distance = 400; //enemy must be within <distance> pixels for the kill to be confirmed
                            var dX = square.hitData.pos.x-enemy.hitData.pos.x;
                            var dY = square.hitData.pos.y-enemy.hitData.pos.y;
                            if (Math.sqrt(dX*dX+dY*dY) < distance){
                                near = true;
                            }
                        }
                        enemy.kill = true;
                    }catch(e){
                    }
                }else if (data.killedPlayer){
                    if (!that.god && !that.kill){
                        that.gameSession.gameModeManager.killPlayerFunc(that);
                    }
                }
            }else{
                if (data.requestPlayerCount){
                    that.gameEngine.queuePlayer(that,'updatePlayerCount', {p: that.gameEngine.playerCount});
                }else if (data.logout){
                    try{
                        that.gameEngine.queuePlayer(that,'logout', {});
                        that.user.unlock();
                        that.user.updateDB();
                        that.user = null;
                    }catch(e){
                        console.log('error - unable to logout user');
                        console.log(e.stack);
                    }
                }else if (data.requestHighScores){
                    that.gameEngine.queuePlayer(that,'highScores', {
                        solo: that.gameEngine.soloHighScores,
                        coop: that.gameEngine.coopHighScores,
                        vs: that.gameEngine.vsHighScores,
                        stars: that.gameEngine.starsHighScores
                    });
                }
            }
        });

        this.socket.on('clientCommand', function(data) {
            // this needs to be parsed: data.command
            // format: >COMMAND ID AMOUNT
            //commands:
            try{
                var commandBool = false;
                var c = data.command;
                var commands = [];
                var from = 0;
                for (var i = 0; i < c.length; i++){
                    if (c.charAt(i) === ' '){
                        commands.push(c.substring(from,i))
                        from = i+1;
                    }
                }
                commands.push(c.substring(from,c.length));
                switch (commands[0]){
                    case 'say':
                        commandBool = true
                        that.gameSession.queueData("say", {playerId: that.id,text: c.substring(4)});
                        break;
                    case 'god':
                        //toggle god mode
                        if (that.user.userData.admin){
                            commandBool = true
                            if (that.god){
                                that.god = false;
                            }else{
                                that.god = true;
                            }
                            break;
                        }else{
                            console.log('Not an admin');
                        }
                    case 'how':
                        commandBool = true;
                        if (commands[1] == 'do'){
                            if (commands[2] == 'you'){
                                if (commands[3] == 'turn'){
                                    if (commands[4] == 'this'){
                                        if (commands[5] == 'on'){
                                            if (!that.gameSession){
                                                that.tryingToJoinGame = 'chaos';
                                            }
                                        }   
                                    }
                                }
                            }
                        }
                        break;
                    case 'test':
                        if (that.user.userData.admin){
                            commandBool = true;
                            if (!that.gameSession){
                                that.tryingToJoinGame = 'secret';
                            }
                        }
                        break;
                    case 'stars':
                        commandBool = true;
                        if (!that.gameSession){
                            that.gameEngine.singlePlayerSession(that, 'star');
                        }
                        break;
                    case 'setlevel':
                        if (that.user.userData.admin){
                            commandBool = true;
                            try{
                                that.gameSession.level = parseInt(commands[1]);
                            }catch(e){

                            }
                        }
                        break;
                    case 't':
                        if (that.user.userData.admin){
                            commandBool = true;
                            try{
                                that.gameSession.level = 666;
                            }catch(e){
                                
                            }
                        }
                        break;
                    case 'ping':
                        commandBool = true;
                        if (!that.gameSession){
                            that.gameEngine.queuePlayer(that,"ping", {});
                        }else{
                            that.gameSession.queuePlayer(that,"ping", {});
                        }
                        break;
                }
                if (!commandBool && c != ''){
                    if (c.length > 40){
                        c = c.substring(0,40);
                    }
                    var d = new Date().toString();
                    that.user.userData.chatLog.push({text: c, timeStamp:d});
                    that.gameSession.queueData("say", {playerId: that.id,text: c});
                }
            }catch(e){
                console.log(e);
            }
        });
        this.socket.on('log', function (data) {
            if (that.admin){
                console.log(data);
            }
        });
        this.socket.on('disconnect', function () {
            try{
                that.gameEngine.playerCount -= 1;
                that.user.unlock();
                console.log('Player ' + that.id + ' (' + that.user.userData.username + ') has disconnected.');
                that.user.updateDB();
                if (that.gameSession){
                    that.gameSession.queueData('removePlayer', that.id);
                    that.gameSession.removePlayer(that);
                }
                // If callback exists, call it
                if(that.onDisconnectHandler != null && typeof that.onDisconnectHandler == 'function' ) {
                    that.onDisconnectHandler();
                }
            }catch(e){
                console.log('error on disconnect ( will error out on guest or user = null)');
            }
        });

        this.socket.on('join', function (data) {
            console.log('Player ' + that.id + ' wants to join a game.');
            if (!that.gameSession){
                if (data.solo){
                    that.gameEngine.singlePlayerSession(that);
                }else if (data.coop){
                    that.tryingToJoinGame = 'coop';
                }else if (data.vs){
                    that.tryingToJoinGame = 'vs';
                }else if (data.stars){
                    that.gameEngine.singlePlayerSession(that, 'star');
                }
            }
        });

        
        this.socket.on('loginAttempt', function (d) {

            try{
                if (!that.gameSession){
                    if (d.guest){
                        //SET USER DATA TO GUEST
                        that.user = User();
                        that.user.setOwner(that);
                        that.user.init({guest: true});
                        that.user.setLastLogin(Date.now());
                    }else if (d.sn && d.pw){
                        d.sn = d.sn.toLowerCase();
                        if (!that.gameEngine.users[that.gameEngine._userIndex[d.sn]].loggedin){
                            var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                            var params = {
                                TableName: 'users',
                                Key: {
                                    username: d.sn
                                }
                            }
                            docClient.get(params, function(err, data) {
                                if (err) {
                                    console.error("Unable to find user. Error JSON:", JSON.stringify(err, null, 2));
                                } else {
                                    const hash = crypto.createHmac('sha256', d.pw);
                                    if (hash.digest('hex') == data.Item.password){
                                        //SET USER DATA TO EXISTING USER
                                        that.user = User();
                                        that.user.setOwner(that);
                                        that.user.init(data.Item);
                                        that.user.lock();
                                        that.user.setLastLogin(Date.now().toJSON);
                                    }else{
                                        that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'wp'});
                                    }
                                }
                            });
                        }else{
                            that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'l'});
                        }
                    }
                }
            }catch(e){
                console.log('Login Attempt failed');
                console.log(e);
                that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'wp'});
            }
        });
        //TODO - set player variable to show they are logged in
        //on the client - catch "loggedIn" and move to the main menu, display stats, add logout button
        this.socket.on('createUser', function (d) {
            console.log(d);
            try{
                d.sn = d.sn.toLowerCase();
                if (!that.gameSession && d.sn != 'guest' && d.pw){
                    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                    var params = {
                        TableName: 'users',
                        Key: {
                            username: d.sn
                        }
                    }
                    docClient.get(params, function(err, data) {
                    if (err) {
                    } else {
                        //check password lengths, and if item exists
                        console.log("Create user succeeded:", JSON.stringify(data, null, 2));
                        if (d.sn.length >= 3 && d.sn.length <= 16 && d.pw.length >= 8 && d.pw.length <= 16 && typeof data.Item == 'undefined'){
                            console.log('valid account info - creating account');
                            //hash the password
                            const hash = crypto.createHmac('sha256', d.pw);
                            var u = {
                                username: d.sn,
                                password: hash.digest('hex')
                            };
                            that.user = User();
                            that.user.setOwner(that);
                            that.user.init(u);
                            var params3 = {
                                TableName: 'users',
                                Item: {
                                    'username': d.sn,
                                    'password': that.user.userData.password,
                                    'admin': false,
                                    'chatlog': [],
                                    'loggedin': true,
                                    'createDate': new Date().toJSON(),
                                    'lastLogin': new Date().toJSON()
                                }
                            }
                            docClient.put(params3, function(err, data3) {
                                if (err) {
                                    console.error("Unable to add user. Error JSON:", JSON.stringify(err, null, 2));
                                } else {
                                    console.log("Create user succeeded:", JSON.stringify(data3, null, 2));
                                    that.gameEngine.users[d.sn] = params3.Item;
                                    that.gameEngine._userIndex[d.sn] = d.sn;
                                }
                            });
                            
                        }else if (typeof data.Item != 'undefined'){
                            that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'uiu'});
                        }else if (d.sn.length < 3 || d.sn.length > 16){
                            that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'ule'});
                        }else if (d.pw.length < 8 || d.pw.length > 16){
                            that.gameEngine.queuePlayer(that,"setLoginErrorText", {text: 'ple'});
                        }
                    }
                    });
                }
            }catch(e){
                console.log('error creating user');
                console.log(e.stack);
            }
        });
    };

    return player;
}

exports.Player = Player;