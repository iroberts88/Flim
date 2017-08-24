(function(window) {

    AcornSetup = {
    
        net: function() {
            Acorn.Net.on('connInfo', function (data) {
              console.log('Connected to server: Info Received');
              console.log(data);
              Acorn.Net.ready = true;
              checkReady();
            });

            Acorn.Net.on('gameInfo', function (data) {
              console.log('Connected to game session: Info Received');
              console.log(data);
              Acorn.changeState('inGame');
              //Init Player
              mainObj.playerId = data.id;
              Player.init(data);
              Player.id = data.id;
              Party.init();
              Enemies.init();
              for (var i = 0; i < data.players.length; i++){
                if (data.players[i].id != data.playerId){
                    data.players[i].tint = 0xff1924;
                    Party.addNewMember(data.players[i]);
                }
              }

              for (var i = 0; i < data.enemies.length; i++){
                Enemies.addEnemy(data.enemies[i]);
              }
            });

            Acorn.Net.on('addPlayerWisp', function (data) {
              if (data.id != mainObj.playerId){
                data.tint = 0xff1924;
                Party.addNewMember(data);
              }
            });

            Acorn.Net.on('loggedIn', function (data) {
              Player.userData = data;
              Settings.toggleCredentials(false);
              Acorn.changeState('mainMenu');
            });

            Acorn.Net.on('logout', function (data) {
              Player.userData = null;
              Acorn.changeState('loginScreen');
            });

            Acorn.Net.on('setLoginErrorText', function (data) {
              try{
                var state = Acorn.states['loginScreen'];
                switch(data.text){
                    case 'wp':
                        state.loginErrorText.text = 'Username or password incorrect.';
                        break;
                    case 'ple':
                        state.loginErrorText.text = 'Password must be between 8 and 16 characters.';
                        break;
                    case 'ule':
                        state.loginErrorText.text = 'Username must be between 3 and 16 characters.';
                        break;
                    case 'uiu':
                        state.loginErrorText.text = 'Username is already in use.';
                        break;
                    case 'l':
                        state.loginErrorText.text = 'User is already logged in.';
                        break;
                }
              }catch(e){}
            });

            Acorn.Net.on('warning', function (data) {
              Player.addWarning(data.time, data.level);
            });

            Acorn.Net.on('backToMainMenu', function (data) {
                try{
                    Player.userData = data.userData;
                    Acorn.changeState('mainMenu');
                }catch(e){
                    console.log(e);
                }
            });

            Acorn.Net.on('youLose', function (data) {
                if (!Player.gameEnded) {
                    Player.gameEnded = true;
                    var uLost = new PIXI.Text('You Lose', { font: '100px Audiowide', fill: 'white', align: 'left' });
                    uLost.position.x = (Graphics.width / 2);
                    uLost.position.y = (Graphics.height / 4);
                    uLost.anchor.x = 0.5;
                    uLost.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(uLost);
                    if (data.score){
                        var score = new PIXI.Text('Final Score: ' + data.score, { font: '100px Audiowide', fill: 'white', align: 'left' });
                        score.position.x = (Graphics.width / 2);
                        score.position.y = (Graphics.height / 4 + 100);
                        score.anchor.x = 0.5;
                        score.anchor.y = 0.5;
                        Graphics.uiContainer.addChild(score);
                    }
                }
            });

             Acorn.Net.on('youLasted', function (data) {
                if (!Player.gameEnded) {
                    Player.gameEnded = true;
                    var uLost = new PIXI.Text('You Lasted ' + data.time + ' Seconds', { font: '100px Audiowide', fill: 'white', align: 'left' });
                    uLost.position.x = (Graphics.width / 2);
                    uLost.position.y = (Graphics.height / 4);
                    uLost.anchor.x = 0.5;
                    uLost.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(uLost);
                }
            });

            Acorn.Net.on('highScores', function (data) {
                Player.highScores = data;
                Acorn.states['highScoreScreen'].gotHighScores = true;
            });

            Acorn.Net.on('youWin', function (data) {
                if (!Player.gameEnded) {
                    Player.gameEnded = true;
                    var uLost = new PIXI.Text('You Win!', { font: '100px Audiowide', fill: 'white', align: 'left' });
                    uLost.position.x = (Graphics.width / 2);
                    uLost.position.y = (Graphics.height / 4);
                    uLost.anchor.x = 0.5;
                    uLost.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(uLost);
                }
            });

            Acorn.Net.on('disconnect', function (data) {
                if (!Player.gameEnded) {
                    Player.gameEnded = true;
                    var uLost = new PIXI.Text('Disconnect', { font: '100px Audiowide', fill: 'white', align: 'left' });
                    uLost.position.x = (Graphics.width / 2);
                    uLost.position.y = (Graphics.height / 4);
                    uLost.anchor.x = 0.5;
                    uLost.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(uLost);
                }
            });

            Acorn.Net.on('killPlayer', function (data) {
              if (data.id != mainObj.playerId){
                Party.removeMember(data);
              }else{
                //you died!
                var dustAmount = 100;
                for (var i = 0; i < dustAmount; i ++){
                    Dust.addDust({
                        vector: [1,0],
                        pos: [Player.loc.x,Player.loc.y],
                        angle: 180,
                        color: Player.tint
                    })
                }
                Player.kill = true;
                Graphics.worldContainer.removeChild(Player.player);
              }
            });

            Acorn.Net.on('unKillPlayer', function (data) {
                Player.kill = false;
                Graphics.worldContainer.addChild(Player.player);
            });

            Acorn.Net.on('updatePlayerLoc', function (data) {
              //update player position
              try{
                  Party.members[data.playerId].updateLoc(data.newLoc[0], data.newLoc[1]);
              }catch(e){
                //console.log("client error - could not update player location");
                //console.log(e);
              }
            });

            Acorn.Net.on('updateEnemyLoc', function (data) {
              //update player position
              if (typeof data.visible != 'undefined'){
                if (data.visible){
                    Enemies.enemyList[data.id].sprite.visible = true;
                }
              }
              try{
                  Enemies.enemyList[data.id].sprite.position.x = data.newPos[0];
                  Enemies.enemyList[data.id].sprite.position.y = data.newPos[1];
                  Enemies.enemyList[data.id].moveVector.x = data.newDir[0];
                  Enemies.enemyList[data.id].moveVector.y = data.newDir[1];
              }catch(e){
                //console.log("client error - could not update player location");
                //console.log(e);
              }
            });

            Acorn.Net.on('updatePlayerCount', function(data) {
                try{
                    Player.playerCount = data.p;
                }catch(e){
                    console.log(e);
                }
            });
            Acorn.Net.on('say', function (data) {
              if (data.playerId == mainObj.playerId){
                Player.addSayBubble(data.text);
              }else{
                for (var i in Party.members){
                    if (Party.members[i].id == data.playerId){
                        Party.members[i].addSayBubble(data.text);
                    }
                }
              }
            });

            Acorn.Net.on('addEnemies', function (data) {
                console.log(data);
                Player.receivedEnemies = true;
                var serverScriptTime = data.timeStamp - data.received;
                var responseTime = (Date.now() - Player.erTime);
                var ms = 0;
                ms = Math.min(0,(responseTime - serverScriptTime)/2000);
                if (!Player.gameEnded){
                  for (var i = 0; i < data.enemies.length; i++){
                    Enemies.addEnemy(data.enemies[i],ms);
                  }
                }
            });

            Acorn.Net.on('enemiesReady', function (data) {
                //the server is ready to send down a batch of enemies
                Player.erTime = Date.now();
                Player.receivedEnemies = false;
                Acorn.Net.socket_.emit('playerUpdate', {requestEnemies: true});
            });

            Acorn.Net.on('removeEnemy', function (data) {
                Enemies.killEnemy(data.id);
            });

            Acorn.Net.on('enemyNewTarget', function (data) {
                try{
                    Enemies.enemyList[data.id].behaviour.targetId = data.targetId;
                }catch(e){
                    console.log(e);
                }
            });

            Acorn.Net.on('debug', function (data) {
              console.log(data);
            });

            Acorn.Net.on('ping', function (data) {
              Settings.stats.pingReturn();
            });
        },

        states: function(){
            //Set up all states
            //-----------------------------------------------------------------------------------------------|
            //                              Game States (Acorn.states)
            //-----------------------------------------------------------------------------------------------|

            //Initial State
            Acorn.addState({
                stateId: 'loginScreen',
                init: function(){
                    console.log('Initializing login screen');
                    document.body.style.cursor = 'default';
                    Graphics.clear();
                    Player.gameEnded = false;
                    this.wispLogo = new PIXI.Text('W.I.S.P.' , {font: '200px Orbitron', fill: 'white', align: 'left'});
                    this.wispLogo.position.x = (Graphics.width / 2);
                    this.wispLogo.position.y = (Graphics.height / 4);
                    this.wispLogo.anchor.x = 0.5;
                    this.wispLogo.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.wispLogo);

                    this.guestText = new PIXI.Text('PLAY AS GUEST', {font: '65px Orbitron', fill: 'white', align: 'left'});
                    this.guestText.position.x = (Graphics.width / 2 - this.guestText.width);
                    this.guestText.position.y = (Graphics.height * .75);
                    this.guestText.anchor.x = 0.5;
                    this.guestText.anchor.y = 0.5;
                    this.guestText.interactive = true;
                    this.guestText.buttonMode = true;
                    Graphics.uiContainer.addChild(this.guestText);

                    this.guestText.on('click', function onClick(){
                        Acorn.Net.socket_.emit('loginAttempt',{guest: true});
                    });
                    this.guestText.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('loginAttempt',{guest: true});
                    });

                    this.loginText = new PIXI.Text('          LOGIN          ', {font: '65px Orbitron', fill: 'white', align: 'left'});
                    this.loginText.position.x = (Graphics.width / 2 + this.loginText.width);
                    this.loginText.position.y = (Graphics.height * .75);
                    this.loginText.anchor.x = 0.5;
                    this.loginText.anchor.y = 0.5;
                    this.loginText.interactive = true;
                    this.loginText.buttonMode = true;
                    Graphics.uiContainer.addChild(this.loginText);

                    this.newUser = new PIXI.Text('     New User     ', {font: '65px Orbitron', fill: 'white', align: 'left'});
                    this.newUser.position.x = (Graphics.width / 2);
                    this.newUser.position.y = (Graphics.height * .9);
                    this.newUser.anchor.x = 0.5;
                    this.newUser.anchor.y = 0.5;
                    this.newUser.interactive = true;
                    this.newUser.buttonMode = true;
                    Graphics.uiContainer.addChild(this.newUser);

                    this.loginErrorText = new PIXI.Text('', {font: '45px Orbitron', fill: 'white', align: 'left'});
                    this.loginErrorText.position.x = (Graphics.width / 2);
                    this.loginErrorText.position.y = (Graphics.height * .65);
                    this.loginErrorText.anchor.x = 0.5;
                    this.loginErrorText.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.loginErrorText);

                    this.submitButton = new PIXI.Text('     Submit     ', {font: '65px Orbitron', fill: 'white', align: 'left'});
                    this.submitButton.position.x = (Graphics.width / 2) - this.submitButton.width;
                    this.submitButton.position.y = (Graphics.height * .75);
                    this.submitButton.anchor.x = 0.5;
                    this.submitButton.anchor.y = 0.5;
                    this.submitButton.interactive = true;
                    this.submitButton.buttonMode = true;

                    this.cancelButton = new PIXI.Text('     Cancel     ', {font: '65px Orbitron', fill: 'white', align: 'left'});
                    this.cancelButton.position.x = (Graphics.width / 2 + this.cancelButton.width);
                    this.cancelButton.position.y = (Graphics.height * .75);
                    this.cancelButton.anchor.x = 0.5;
                    this.cancelButton.anchor.y = 0.5;
                    this.cancelButton.interactive = true;
                    this.cancelButton.buttonMode = true;

                    this.cancelButton.on('click', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.addChild(state.newUser);
                        Graphics.uiContainer.addChild(state.loginText);
                        Graphics.uiContainer.addChild(state.guestText);
                        Graphics.uiContainer.removeChild(state.cancelButton);
                        Graphics.uiContainer.removeChild(state.submitButton);
                        Settings.toggleCredentials(false);
                        state.loginClicked = false;
                        state.loginErrorText.text = '';
                    });
                    this.cancelButton.on('tap', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.addChild(state.newUser);
                        Graphics.uiContainer.addChild(state.loginText);
                        Graphics.uiContainer.addChild(state.guestText);
                        Graphics.uiContainer.removeChild(state.cancelButton);
                        Graphics.uiContainer.removeChild(state.submitButton);
                        Settings.toggleCredentials(false);
                        state.loginClicked = false;
                        state.loginErrorText.text = '';
                    });

                    this.submitButton.on('click', function onClick(){
                        if (Settings.credentials.getType() == 'login'){
                            Acorn.Net.socket_.emit('loginAttempt',{sn: document.getElementById('usrInput').value,pw:document.getElementById('pwInput').value});
                        }else if (Settings.credentials.getType() == 'new'){
                            Acorn.Net.socket_.emit('createUser',{sn: document.getElementById('usrInput').value,pw:document.getElementById('pwInput').value});
                        }
                    });
                    this.submitButton.on('tap', function onClick(){
                        if (Settings.credentials.getType() == 'login'){
                            Acorn.Net.socket_.emit('loginAttempt',{sn: document.getElementById('usrInput').value,pw:document.getElementById('pwInput').value});
                        }else if (Settings.credentials.getType() == 'new'){
                            Acorn.Net.socket_.emit('createUser',{sn: document.getElementById('usrInput').value,pw:document.getElementById('pwInput').value});
                        }
                    });

                    this.loginClicked = false;

                    this.loginText.on('click', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.removeChild(state.newUser);
                        Graphics.uiContainer.removeChild(state.loginText);
                        Graphics.uiContainer.removeChild(state.guestText);
                        Graphics.uiContainer.addChild(state.cancelButton);
                        Graphics.uiContainer.addChild(state.submitButton);
                        Settings.credentials.setType('login');
                        Settings.toggleCredentials(true);
                        state.loginClicked = true;
                        document.getElementById('usrInput').focus();
                    });
                    this.loginText.on('tap', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.removeChild(state.newUser);
                        Graphics.uiContainer.removeChild(state.loginText);
                        Graphics.uiContainer.removeChild(state.guestText);
                        Graphics.uiContainer.addChild(state.cancelButton);
                        Graphics.uiContainer.addChild(state.submitButton);
                        Settings.credentials.setType('login');
                        Settings.toggleCredentials(true);
                        state.loginClicked = true;
                        document.getElementById('usrInput').focus();
                    });
                    this.newUser.on('click', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.removeChild(state.newUser);
                        Graphics.uiContainer.removeChild(state.loginText);
                        Graphics.uiContainer.removeChild(state.guestText);
                        Graphics.uiContainer.addChild(state.cancelButton);
                        Graphics.uiContainer.addChild(state.submitButton);
                        Settings.credentials.setType('new');
                        Settings.toggleCredentials(true);
                        state.loginClicked = true;
                        document.getElementById('usrInput').focus();
                    });
                    this.newUser.on('tap', function onClick(){
                        var state = Acorn.states['loginScreen'];
                        Graphics.uiContainer.removeChild(state.newUser);
                        Graphics.uiContainer.removeChild(state.loginText);
                        Graphics.uiContainer.removeChild(state.guestText);
                        Graphics.uiContainer.addChild(state.cancelButton);
                        Graphics.uiContainer.addChild(state.submitButton);
                        Settings.credentials.setType('new');
                        Settings.toggleCredentials(true);
                        state.loginClicked = true;
                        document.getElementById('usrInput').focus();
                    });
                },
                update: function(dt){
                    Graphics.worldPrimitives.clear();
                    if (this.loginClicked){
                        Graphics.drawBoxAround(this.cancelButton,Graphics.worldPrimitives,-5,-5);
                        Graphics.drawBoxAround(this.submitButton,Graphics.worldPrimitives,-5,-5);
                    }else{
                        Graphics.drawBoxAround(this.loginText,Graphics.worldPrimitives,-5,-5);
                        Graphics.drawBoxAround(this.guestText,Graphics.worldPrimitives,-5,-5);
                        Graphics.drawBoxAround(this.newUser,Graphics.worldPrimitives,-5,-5);
                    }
                    if (Acorn.Input.isPressed(Acorn.Input.Key.BACKSPACE)){
                        if (Settings.credentialsOn){
                            if (document.activeElement.id == 'usrInput'){
                                document.getElementById('usrInput').value = document.getElementById('usrInput').value.substring(0, document.getElementById('usrInput').value.length-1);
                            }else if (document.activeElement.id == 'pwInput'){
                                document.getElementById('pwInput').value = document.getElementById('pwInput').value.substring(0, document.getElementById('pwInput').value.length-1);
                            }
                        }
                        Acorn.Input.setValue(Acorn.Input.Key.BACKSPACE, false);
                    }
                    ChatConsole.update(dt);
                }
            });

            //Main Menu
            Acorn.addState({
                stateId: 'mainMenu',
                init: function(){
                    console.log('Initializing main menu');
                    if (!Player.userData){
                        console.log('user hasnt been set up. returning to login screen');
                        Acorn.changeState('loginScreen');
                        return;
                    }
                    document.body.style.cursor = 'default';
                    Graphics.clear();
                    Player.gameEnded = false;
                    this.wispLogo = new PIXI.Text('W.I.S.P.' , {font: '200px Orbitron', fill: 'white', align: 'left'});
                    this.wispLogo.position.x = (Graphics.width / 2);
                    this.wispLogo.position.y = (Graphics.height / 4);
                    this.wispLogo.anchor.x = 0.5;
                    this.wispLogo.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.wispLogo);
                    //set up the Solo button
                    this.singlePlayerButton = new PIXI.Text('SOLO' , {font: '64px Audiowide', fill: 'white', align: 'center'});
                    this.singlePlayerButton.anchor.x = .5;
                    this.singlePlayerButton.anchor.y = .5;
                    this.singlePlayerButton.position.x = Graphics.width/2;
                    this.singlePlayerButton.position.y = Graphics.height/1.5;
                    Graphics.uiContainer.addChild(this.singlePlayerButton);
                    this.singlePlayerButton.interactive = true;
                    this.singlePlayerButton.buttonMode = true;
                    this.singlePlayerButton.on('click', function onClick(){
                        Acorn.Net.socket_.emit('join',{solo: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });
                    this.singlePlayerButton.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('join',{solo: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });

                    //set up player stats
                    this.userName = new PIXI.Text("Logged in as: \n" + Player.userData.name, {font: '32px Audiowide', fill: 'white', align: 'center'});
                    this.userName.anchor.x = 0;
                    this.userName.anchor.y = 0.5;
                    this.userName.position.x = 10;
                    this.userName.position.y = Graphics.height/5;
                    Graphics.uiContainer.addChild(this.userName);
                    
                    this.soloGP = new PIXI.Text("Solo Games Played: " + Player.userData.stats.soloGamesPlayed, {font: '16px Audiowide', fill: 'white', align: 'right'});
                    this.soloGP.anchor.x = 0;
                    this.soloGP.anchor.y = 0;
                    this.soloGP.position.x = 10;
                    this.soloGP.position.y = Graphics.height/5 + this.userName.height;
                    Graphics.uiContainer.addChild(this.soloGP);
                    this.soloHS = new PIXI.Text("Solo High Score: " + Player.userData.stats.soloHighScore, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.soloHS.anchor.x = 0;
                    this.soloHS.anchor.y = 0;
                    this.soloHS.position.x = 10;
                    this.soloHS.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height;
                    Graphics.uiContainer.addChild(this.soloHS);
                    this.soloHL = new PIXI.Text("Solo Highest Level Reached: " + Player.userData.stats.soloLevelRecord, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.soloHL.anchor.x = 0;
                    this.soloHL.anchor.y = 0;
                    this.soloHL.position.x = 10;
                    this.soloHL.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*2;
                    Graphics.uiContainer.addChild(this.soloHL);
                    this.coopGP = new PIXI.Text("Coop Games Played: " + Player.userData.stats.coopGamesPlayed, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.coopGP.anchor.x = 0;
                    this.coopGP.anchor.y = 0;
                    this.coopGP.position.x = 10;
                    this.coopGP.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*3;
                    Graphics.uiContainer.addChild(this.coopGP);
                    this.coopHS = new PIXI.Text("Coop High Score: " + Player.userData.stats.coopHighScore, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.coopHS.anchor.x = 0;
                    this.coopHS.anchor.y = 0;
                    this.coopHS.position.x = 10;
                    this.coopHS.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*4;
                    Graphics.uiContainer.addChild(this.coopHS);
                    this.coopHL = new PIXI.Text("Coop Highest Level Reached: " + Player.userData.stats.coopLevelRecord, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.coopHL.anchor.x = 0;
                    this.coopHL.anchor.y = 0;
                    this.coopHL.position.x = 10;
                    this.coopHL.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*5;
                    Graphics.uiContainer.addChild(this.coopHL);
                    this.vsGP = new PIXI.Text("Versus Games Played: " + Player.userData.stats.vsGamesPlayed, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.vsGP.anchor.x = 0;
                    this.vsGP.anchor.y = 0;
                    this.vsGP.position.x = 10;
                    this.vsGP.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*6;
                    Graphics.uiContainer.addChild(this.vsGP);
                    this.vsGW = new PIXI.Text("Versus Games Won: " + Player.userData.stats.vsGamesWon, {font: '16px Audiowide', fill: 'white', align: 'center'});
                    this.vsGW.anchor.x = 0;
                    this.vsGW.anchor.y = 0;
                    this.vsGW.position.x = 10;
                    this.vsGW.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*7;
                    Graphics.uiContainer.addChild(this.vsGW);
                    if (Player.userData.stats.starsGamesPlayed > 0){
                        this.starsGP = new PIXI.Text("Stars Games Played: " + Player.userData.stats.starsGamesPlayed, {font: '16px Audiowide', fill: 'white', align: 'center'});
                        this.starsGP.anchor.x = 0;
                        this.starsGP.anchor.y = 0;
                        this.starsGP.position.x = 10;
                        this.starsGP.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*8;
                        Graphics.uiContainer.addChild(this.starsGP);
                        this.starsLG = new PIXI.Text("Stars Longest Game: " + Player.userData.stats.starsLongestGame + ' Seconds', {font: '16px Audiowide', fill: 'white', align: 'center'});
                        this.starsLG.anchor.x = 0;
                        this.starsLG.anchor.y = 0;
                        this.starsLG.position.x = 10;
                        this.starsLG.position.y = Graphics.height/5 + this.userName.height + this.soloGP.height*9;
                        Graphics.uiContainer.addChild(this.starsLG);
                    }
                    this.highScoreButton = new PIXI.Text('High Scores' , {font: '32px Audiowide', fill: 'white', align: 'center'});
                    this.highScoreButton.anchor.x = .5;
                    this.highScoreButton.anchor.y = .5;
                    this.highScoreButton.position.x = 10 + this.highScoreButton.width/2;
                    this.highScoreButton.position.y = Graphics.height/4 + this.userName.height + this.soloGP.height*10;
                    Graphics.uiContainer.addChild(this.highScoreButton);
                    this.highScoreButton.interactive = true;
                    this.highScoreButton.buttonMode = true;
                    this.highScoreButton.on('click', function onClick(){
                        Acorn.changeState('highScoreScreen');
                    });
                    this.highScoreButton.on('tap', function onClick(){
                        Acorn.changeState('highScoreScreen');
                    });
                    //set up the Co-op button
                    this.multiPlayerButton = new PIXI.Text('CO-OP' , {font: '64px Audiowide', fill: 'white', align: 'center'});
                    this.multiPlayerButton.anchor.x = .5;
                    this.multiPlayerButton.anchor.y = .5;
                    this.multiPlayerButton.position.x = Graphics.width/2;
                    this.multiPlayerButton.position.y = Graphics.height/1.5 + 100;
                    Graphics.uiContainer.addChild(this.multiPlayerButton);
                    this.multiPlayerButton.interactive = true;
                    this.multiPlayerButton.buttonMode = true;
                    this.multiPlayerButton.on('click', function onClick(){
                        Acorn.Net.socket_.emit('join',{coop: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });
                    this.multiPlayerButton.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('join',{coop: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });

                    //set up the Co-op button
                    this.versusButton = new PIXI.Text('VERSUS' , {font: '64px Audiowide', fill: 'white', align: 'center'});
                    this.versusButton.anchor.x = .5;
                    this.versusButton.anchor.y = .5;
                    this.versusButton.position.x = Graphics.width/2;
                    this.versusButton.position.y = Graphics.height/1.5 + 200;
                    Graphics.uiContainer.addChild(this.versusButton);
                    this.versusButton.interactive = true;
                    this.versusButton.buttonMode = true;
                    this.versusButton.on('click', function onClick(){
                        Acorn.Net.socket_.emit('join',{vs: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });
                    this.versusButton.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('join',{vs: true});
                        Acorn.changeState('joiningGame');
                        Acorn.Sound.play('flim');
                    });

                    //set up the settings button
                    this.settingsButton = new PIXI.Text('SETTINGS' , {font: '48px Orbitron', fill: 'white', align: 'left'});
                    this.settingsButton.position.x = this.settingsButton.width/2 + 5;
                    this.settingsButton.position.y = this.settingsButton.height/2 + 5;
                    this.settingsButton.anchor.x = 0.5;
                    this.settingsButton.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.settingsButton);
                    this.settingsButton.interactive = true;
                    this.settingsButton.buttonMode = true;
                    this.settingsButton.on('click', function onClick(){
                        Acorn.changeState('settingsPage');
                    });
                    this.settingsButton.on('tap', function onClick(){
                        Acorn.changeState('settingsPage');
                    });

                    //set up the secret stars button
                    this.starsButton = new PIXI.Text('...' , {font: '12px Orbitron', fill: 'black', align: 'left'});
                    this.starsButton.position.x = 1900;
                    this.starsButton.position.y = 300;
                    this.starsButton.anchor.x = 0.5;
                    this.starsButton.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.starsButton);
                    this.starsButton.interactive = true;
                    this.starsButton.buttonMode = true;
                    this.starsButton.on('click', function onClick(){
                        Acorn.Net.socket_.emit('join',{stars: true});
                        Acorn.changeState('joiningGame');
                    });
                    this.starsButton.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('join',{stars: true});
                        Acorn.changeState('joiningGame');
                    });

                    //set up the about button
                    this.aboutButton = new PIXI.Text('ABOUT' , {font: '48px Orbitron', fill: 'white', align: 'left'});
                    this.aboutButton.position.x = Graphics.width - 5 - this.aboutButton.width/2;
                    this.aboutButton.position.y = this.aboutButton.height/2 + 5;
                    this.aboutButton.anchor.x = 0.5;
                    this.aboutButton.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.aboutButton);
                    this.aboutButton.interactive = true;
                    this.aboutButton.buttonMode = true;
                    this.aboutButton.on('click', function onClick(){
                        Acorn.changeState('aboutPage');
                    });
                    this.aboutButton.on('tap', function onClick(){
                        Acorn.changeState('aboutPage');
                    });

                    //set up the playerCount
                    Player.playerCountCurrent = 0;
                    this.playerCount = new PIXI.Text('Players Online: ' + Player.playerCountCurrent , {font: '24px Orbitron', fill: 'white', align: 'left'});
                    this.playerCount.position.x = Graphics.width - this.playerCount.width/2 - 5;
                    this.playerCount.position.y = Graphics.height - this.playerCount.height/2 - 5;
                    this.playerCount.anchor.x = 0.5;
                    this.playerCount.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.playerCount);
                    this.reqTicker = 5;
                    //stop playing music if returning from in game
                    Acorn.Sound.stop('flim');
                },
                update: function(dt){
                    Graphics.worldPrimitives.clear();
                    Graphics.drawBoxAround(this.singlePlayerButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.multiPlayerButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.highScoreButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.versusButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.aboutButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.settingsButton,Graphics.worldPrimitives);
                    ChatConsole.update(dt);
                    //request player count every 5 seconds
                    this.reqTicker += dt;
                    if (this.reqTicker >= 5.0){
                        this.reqTicker -= 5.0;
                        Acorn.Net.socket_.emit('playerUpdate',{requestPlayerCount: true});
                    }
                    if (Player.playerCountCurrent < Player.playerCount){
                        Player.playerCountCurrent += Math.ceil((Player.playerCount - Player.playerCountCurrent)*0.1);
                    }else{
                        Player.playerCountCurrent = Player.playerCount;
                    }
                    this.playerCount.text = 'Players Online: ' + Player.playerCountCurrent;
                }
            });

            Acorn.addState({
                stateId: 'joiningGame',
                init: function(){
                    Graphics.clear();
                    Player.gameEnded = false;
                    this.waitingTextBase = 'Finding a game';
                    this.waitingTicker = 0;
                    this.dotz = 3;
                    this.waiting = new PIXI.Text(this.waitingTextBase , {font: '36px Orbitron', fill: 'white', align: 'center'});
                    this.waiting.position.x = (Graphics.width / 2) - (this.waiting.width/2);
                    this.waiting.position.y = (Graphics.height / 2);
                    this.waiting.anchor.x = 0.0;
                    this.waiting.anchor.y = 0.0;
                    Graphics.uiContainer.addChild(this.waiting);

                    //set up the cancel button
                    this.cancel = new PIXI.Text('CANCEL' , {font: '72px Orbitron', fill: 'white', align: 'left'});
                    this.cancel.position.x = (Graphics.width / 2);
                    this.cancel.position.y = (Graphics.height / 2 + 150);
                    this.cancel.anchor.x = 0.5;
                    this.cancel.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.cancel);
                    this.cancel.interactive = true;
                    this.cancel.buttonMode = true;
                    this.cancel.on('click', function onClick(){
                        Acorn.changeState('mainMenu');
                        Acorn.Net.socket_.emit('cancelJoin',{});
                    });
                    this.cancel.on('tap', function onClick(){
                        Acorn.changeState('mainMenu');
                        Acorn.Net.socket_.emit('cancelJoin',{});
                    });

                    //set up the playerCount
                    Player.playerCountCurrent = 0;
                    this.playerCount = new PIXI.Text('Players Online: ' + Player.playerCountCurrent , {font: '24px Orbitron', fill: 'white', align: 'left'});
                    this.playerCount.position.x = this.playerCount.width/2 + 5;
                    this.playerCount.position.y = Graphics.height - this.playerCount.height/2 - 5;
                    this.playerCount.anchor.x = 0.5;
                    this.playerCount.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.playerCount);
                    this.reqTicker = 5;
                },
                update: function(dt){
                    this.waitingTicker += dt;
                    if (this.waitingTicker > 0.3){
                        if (this.dotz == 3){
                            this.dotz = 0;
                        }else{
                            this.dotz += 1;
                        }
                        this.waitingTicker -= 0.3;
                    }
                    var text = this.waitingTextBase;
                    for (var i = 0; i < this.dotz; i ++){
                        text += '.';
                    }
                    this.waiting.text = text;

                    Graphics.worldPrimitives.clear();
                    Graphics.drawBoxAround(this.cancel,Graphics.worldPrimitives);
                    ChatConsole.update(dt);

                    //request player count every 5 seconds
                    this.reqTicker += dt;
                    if (this.reqTicker >= 5.0){
                        this.reqTicker -= 5.0;
                        Acorn.Net.socket_.emit('playerUpdate',{requestPlayerCount: true});
                    }
                    if (Player.playerCountCurrent < Player.playerCount){
                        Player.playerCountCurrent += Math.ceil((Player.playerCount - Player.playerCountCurrent)*0.1);
                    }else{
                        Player.playerCountCurrent = Player.playerCount;
                    }
                    this.playerCount.text = 'Players Online: ' + Player.playerCountCurrent;
                }
            });

            Acorn.addState({
                stateId: 'highScoreScreen',
                init: function(){
                    Acorn.Net.socket_.emit('playerUpdate',{requestHighScores: true});
                    Graphics.clear();
                    this.statsContainer = new PIXI.Container();
                    Graphics.uiContainer.addChild(this.statsContainer);
                    this.gotHighScores = false;
                    this.phase = 1;
                    this.counter = 0;
                    this.textheight = 0;
                    this.height = 0;
                    this.startAt = 25;
                    this.heightBuffer = 0;
                    this.backButton = new PIXI.Text('Back', {font: '65px Orbitron', fill: 'white', align: 'center'});
                    this.backButton.position.x = (Graphics.width *.85);
                    this.backButton.position.y = (Graphics.height *0.9);
                    this.backButton.anchor.x = 0.5;
                    this.backButton.anchor.y = 0.5;
                    this.backButton.buttonMode = true;
                    this.backButton.interactive = true;
                    Graphics.uiContainer.addChild(this.backButton);
                    this.backButton.on('click', function onClick(){
                        Acorn.changeState('mainMenu');
                    });
                    this.backButton.on('tap', function onClick(){
                        Acorn.changeState('mainMenu');
                    });

                    this.soloButton = new PIXI.Text('Solo', {font: '65px Orbitron', fill: 'white', align: 'center'});
                    this.soloButton.position.x = (Graphics.width *.15);
                    this.soloButton.position.y = (Graphics.height *0.9);
                    this.soloButton.anchor.x = 0.5;
                    this.soloButton.anchor.y = 0.5;
                    this.soloButton.buttonMode = true;
                    this.soloButton.interactive = true;
                    Graphics.uiContainer.addChild(this.soloButton);
                    this.soloButton.on('click', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 1;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });
                    this.soloButton.on('tap', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 1;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });

                    this.coopButton = new PIXI.Text('Co-op', {font: '65px Orbitron', fill: 'white', align: 'center'});
                    this.coopButton.position.x = (Graphics.width *.3);
                    this.coopButton.position.y = (Graphics.height *0.9);
                    this.coopButton.anchor.x = 0.5;
                    this.coopButton.anchor.y = 0.5;
                    this.coopButton.buttonMode = true;
                    this.coopButton.interactive = true;
                    Graphics.uiContainer.addChild(this.coopButton);
                    this.coopButton.on('click', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 2;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });
                    this.coopButton.on('tap', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 2;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });

                    this.vsButton = new PIXI.Text('Versus', {font: '65px Orbitron', fill: 'white', align: 'center'});
                    this.vsButton.position.x = (Graphics.width *.45);
                    this.vsButton.position.y = (Graphics.height *0.9);
                    this.vsButton.anchor.x = 0.5;
                    this.vsButton.anchor.y = 0.5;
                    this.vsButton.buttonMode = true;
                    this.vsButton.interactive = true;
                    Graphics.uiContainer.addChild(this.vsButton);
                    this.vsButton.on('click', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 3;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });
                    this.vsButton.on('tap', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 3;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });

                    this.starsButton = new PIXI.Text('Stars', {font: '65px Orbitron', fill: 'white', align: 'center'});
                    this.starsButton.position.x = (Graphics.width *.6);
                    this.starsButton.position.y = (Graphics.height *0.9);
                    this.starsButton.anchor.x = 0.5;
                    this.starsButton.anchor.y = 0.5;
                    this.starsButton.buttonMode = true;
                    this.starsButton.interactive = true;
                    Graphics.uiContainer.addChild(this.starsButton);
                    this.starsButton.on('click', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 4;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });
                    this.starsButton.on('tap', function onClick(){
                        var state = Acorn.states['highScoreScreen'];
                        state.statsContainer.removeChildren();
                        state.phase = 4;
                        state.counter = 0;
                        state.textheight = 0;
                        state.height = 0;
                        state.startAt = 25;
                        state.heightBuffer = 0;
                    });
                },
                update: function(dt){
                    if (Player.userData.stats.starsGamesPlayed == 0){
                        this.starsButton.visible = false;
                    }else{
                        this.starsButton.visible = true;
                        Graphics.drawBoxAround(this.starsButton,Graphics.worldPrimitives);
                    }
                    Graphics.worldPrimitives.clear();
                    if (this.gotHighScores){
                        switch(this.phase){
                            case 1:
                                if (Player.userData.stats.starsGamesPlayed == 0){
                                    this.starsButton.visible = false;
                                }else{
                                    this.starsButton.visible = true;
                                    Graphics.drawBoxAround(this.starsButton,Graphics.worldPrimitives);
                                }
                                this.vsButton.visible = true;
                                this.coopButton.visible = true;
                                this.soloButton.visible = false;
                                Graphics.drawBoxAround(this.vsButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.coopButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                                if (this.counter == 26){
                                    this.startAt = Graphics.width *.25;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 51){
                                    this.startAt = Graphics.width *.50;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 76){
                                    this.startAt = Graphics.width *.75;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 0){
                                    this.slText = new PIXI.Text('Solo Leaderboard', {font: '45px Orbitron', fill: 'white', align: 'center'});
                                    this.slText.position.x = Graphics.width/2;
                                    this.slText.position.y = this.slText.height/2 + 10;
                                    this.slText.anchor.x = 0.5;
                                    this.slText.anchor.y = 0.5;
                                    this.statsContainer.addChild(this.slText);
                                }else if (this.counter == 101){
                                    break;
                                }else{
                                    var text1 = new PIXI.Text(this.counter + ':     ', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    this.height += text1.height;
                                    text1.position.x = this.startAt + text1.width/2;
                                    text1.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text1.anchor.x = 0.5;
                                    text1.anchor.y = 0.5;
                                    this.statsContainer.addChild(text1);
                                    var text2 = new PIXI.Text(Player.highScores.solo[this.counter-1].name, {font: '18px Orbitron', fill: 0x7facf4, align: 'center', padding: 2});
                                    text2.position.x = this.startAt + text1.width;
                                    text2.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text2.anchor.x = 0.0;
                                    text2.anchor.y = 0.5;
                                    this.statsContainer.addChild(text2);
                                    var text3 = new PIXI.Text(Player.highScores.solo[this.counter-1].score + '', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    text3.position.x = this.startAt + Graphics.width * 0.18;
                                    text3.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text3.anchor.x = 0.5;
                                    text3.anchor.y = 0.5;
                                    this.statsContainer.addChild(text3);
                                }
                                this.counter += 1;
                                break;
                            case 2:
                                if (Player.userData.stats.starsGamesPlayed == 0){
                                    this.starsButton.visible = false;
                                }else{
                                    this.starsButton.visible = true;
                                    Graphics.drawBoxAround(this.starsButton,Graphics.worldPrimitives);
                                }
                                this.vsButton.visible = true;
                                this.coopButton.visible = false;
                                this.soloButton.visible = true;
                                Graphics.drawBoxAround(this.vsButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.soloButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                                if (this.counter == 26){
                                    this.startAt = Graphics.width *.25;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 51){
                                    this.startAt = Graphics.width *.50;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 76){
                                    this.startAt = Graphics.width *.75;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 0){
                                    this.slText = new PIXI.Text('Co-op Leaderboard', {font: '45px Orbitron', fill: 'white', align: 'center'});
                                    this.slText.position.x = Graphics.width/2;
                                    this.slText.position.y = this.slText.height/2 + 10;
                                    this.slText.anchor.x = 0.5;
                                    this.slText.anchor.y = 0.5;
                                    this.statsContainer.addChild(this.slText);
                                }else if (this.counter == 101){
                                    break;
                                }else{
                                    var text1 = new PIXI.Text(this.counter + ': ', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    this.height += text1.height;
                                    text1.position.x = this.startAt + text1.width/2;
                                    text1.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text1.anchor.x = 0.5;
                                    text1.anchor.y = 0.5;
                                    this.statsContainer.addChild(text1);
                                    var text2 = new PIXI.Text(Player.highScores.coop[this.counter-1].name1 + ' / ', {font: '12px Orbitron', fill: 0x7facf4, align: 'center', padding: 2});
                                    text2.position.x = this.startAt + text1.width;
                                    text2.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text2.anchor.x = 0.0;
                                    text2.anchor.y = 0.5;
                                    this.statsContainer.addChild(text2);
                                    var text3 = new PIXI.Text(Player.highScores.coop[this.counter-1].name2, {font: '12px Orbitron', fill: 0x7facf4, align: 'center', padding: 2});
                                    text3.position.x = this.startAt + text1.width + text2.width+ text3.width/2;
                                    text3.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text3.anchor.x = 0.5;
                                    text3.anchor.y = 0.5;
                                    this.statsContainer.addChild(text3);
                                    var text4 = new PIXI.Text(Player.highScores.coop[this.counter-1].score + '', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    text4.position.x = this.startAt + Graphics.width * 0.18;
                                    text4.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text4.anchor.x = 0.5;
                                    text4.anchor.y = 0.5;
                                    this.statsContainer.addChild(text4);
                                }
                                this.counter += 1;
                                break;
                            case 3:
                                if (Player.userData.stats.starsGamesPlayed == 0){
                                    this.starsButton.visible = false;
                                }else{
                                    this.starsButton.visible = true;
                                    Graphics.drawBoxAround(this.starsButton,Graphics.worldPrimitives);
                                }
                                this.vsButton.visible = false;
                                this.coopButton.visible = true;
                                this.soloButton.visible = true;
                                Graphics.drawBoxAround(this.soloButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.coopButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                                if (this.counter == 26){
                                    this.startAt = Graphics.width *.25;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 51){
                                    this.startAt = Graphics.width *.50;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 76){
                                    this.startAt = Graphics.width *.75;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 0){
                                    this.slText = new PIXI.Text('Versus Leaderboard', {font: '45px Orbitron', fill: 'white', align: 'center'});
                                    this.slText.position.x = Graphics.width/2;
                                    this.slText.position.y = this.slText.height/2 + 10;
                                    this.slText.anchor.x = 0.5;
                                    this.slText.anchor.y = 0.5;
                                    this.statsContainer.addChild(this.slText);
                                }else if (this.counter == 101){
                                    break;
                                }else{
                                    var text1 = new PIXI.Text(this.counter + ':     ', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    this.height += text1.height;
                                    text1.position.x = this.startAt + text1.width/2;
                                    text1.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text1.anchor.x = 0.5;
                                    text1.anchor.y = 0.5;
                                    this.statsContainer.addChild(text1);
                                    var text2 = new PIXI.Text(Player.highScores.vs[this.counter-1].name, {font: '18px Orbitron', fill: 0x7facf4, align: 'center', padding: 2});
                                    text2.position.x = this.startAt + text1.width;
                                    text2.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text2.anchor.x = 0.0;
                                    text2.anchor.y = 0.5;
                                    this.statsContainer.addChild(text2);
                                    var text3 = new PIXI.Text(Player.highScores.vs[this.counter-1].gamesWon + ' games won', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    text3.position.x = this.startAt + Graphics.width * 0.18;
                                    text3.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text3.anchor.x = 0.5;
                                    text3.anchor.y = 0.5;
                                    this.statsContainer.addChild(text3);
                                }
                                this.counter += 1;
                                break;
                            case 4:
                                this.starsButton.visible = false;
                                this.vsButton.visible = true;
                                this.coopButton.visible = true;
                                this.soloButton.visible = true;
                                Graphics.drawBoxAround(this.vsButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.soloButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.coopButton,Graphics.worldPrimitives);
                                Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                                if (this.counter == 26){
                                    this.startAt = Graphics.width *.25;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 51){
                                    this.startAt = Graphics.width *.50;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 76){
                                    this.startAt = Graphics.width *.75;
                                    this.heightBuffer = this.height * -1;
                                }
                                if (this.counter == 0){
                                    this.slText = new PIXI.Text('Stars Leaderboard', {font: '45px Orbitron', fill: 'white', align: 'center'});
                                    this.slText.position.x = Graphics.width/2;
                                    this.slText.position.y = this.slText.height/2 + 10;
                                    this.slText.anchor.x = 0.5;
                                    this.slText.anchor.y = 0.5;
                                    this.statsContainer.addChild(this.slText);
                                }else if (this.counter == 101){
                                    break;
                                }else{
                                    var text1 = new PIXI.Text(this.counter + ':     ', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    this.height += text1.height;
                                    text1.position.x = this.startAt + text1.width/2;
                                    text1.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text1.anchor.x = 0.5;
                                    text1.anchor.y = 0.5;
                                    this.statsContainer.addChild(text1);
                                    var text2 = new PIXI.Text(Player.highScores.stars[this.counter-1].name, {font: '18px Orbitron', fill: 0x7facf4, align: 'center', padding: 2});
                                    text2.position.x = this.startAt + text1.width;
                                    text2.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text2.anchor.x = 0.0;
                                    text2.anchor.y = 0.5;
                                    this.statsContainer.addChild(text2);
                                    var text3 = new PIXI.Text(Player.highScores.stars[this.counter-1].time + ' seconds', {font: '18px Orbitron', fill: 'white', align: 'center', padding: 2});
                                    text3.position.x = this.startAt + Graphics.width * 0.18;
                                    text3.position.y = this.heightBuffer + this.slText.height + 25 + (this.counter * text1.height);
                                    text3.anchor.x = 0.5;
                                    text3.anchor.y = 0.5;
                                    this.statsContainer.addChild(text3);
                                }
                                this.counter += 1;
                                break;
                        }
                    }
                }
            });


            Acorn.addState({
                stateId: 'inGame',
                init: function(){
                    document.body.style.cursor = 'none';
                    Graphics.clear();
                },
                update: function(dt){
                    Player.setDeltaTime(dt);
                    //update chat console
                    ChatConsole.update(dt);
                    //update player
                    Player.update(dt);
                    Party.update(dt);
                    Enemies.update(dt);
                    Dust.update(dt);

                    //Paint
                    Graphics.worldPrimitives.clear();
                    if (!Player.kill){
                        Player.draw();
                    }
                    Party.draw();
                    //Draw target @ mouse position
                    Graphics.worldPrimitives.lineStyle(3,0xFFFFFF,1); 
                    Graphics.worldPrimitives.moveTo(Player.targetLoc.x - 10, Player.targetLoc.y);
                    Graphics.worldPrimitives.lineTo(Player.targetLoc.x + 10, Player.targetLoc.y);
                    Graphics.worldPrimitives.moveTo(Player.targetLoc.x, Player.targetLoc.y - 10);
                    Graphics.worldPrimitives.lineTo(Player.targetLoc.x, Player.targetLoc.y + 10);
                }
            });

            Acorn.addState({
                stateId: 'aboutPage',
                init: function(){
                    console.log('Initializing about page');
                    document.body.style.cursor = 'default';
                    Graphics.clear();
                    Party.init();
                    Enemies.init();
                    Party.addNewMember({id: 'test',loc:[500,500],speed:6000,tint: 0xFFFFFF,radius:20});
                    var rand = Math.ceil(Math.random()*7);
                    if (rand == 1){
                        Enemies.addEnemy({id:'test',type: 'tri',x:0,y:0,behaviour: {name: 'basicMoveTowards', spring: 2, targetId: 'test'}});
                    }else if (rand == 2){
                        Enemies.addEnemy({id:'test',type: 'c1',x:0,y:0,behaviour: {name: 'basicMoveTowards', spring: 5, targetId: 'test'}});
                    }else if (rand == 3){
                        Enemies.addEnemy({id:'test',type: 'c2',x:0,y:0,behaviour: {name: 'basicMoveTowards', spring: 5, targetId: 'test'}});
                    }else if (rand == 4){
                        Enemies.addEnemy({id:'test',type: 'c3',x:0,y:0,behaviour: {name: 'basicMoveTowards', spring: 5, targetId: 'test'}});
                    }else if (rand == 5){
                        Enemies.addEnemy({id:'test',type: 'hex',x:0,y:0,behaviour: {name: 'basicMoveTowards', spring: 20, targetId: 'test'}});
                    }else if (rand == 6){
                        Enemies.addEnemy({id:'test',type: 'chaos',x:0,y:0,behaviour: {name: 'chaos', spring: 2+ Math.floor(Math.random()*4), targetId: 'test',speed: 400+(100*Math.floor(Math.random()*6))}});
                    }else if (rand == 7){
                        var side = Math.floor(Math.random()*4);
                        var p = [0,0];
                        var h = 1080;
                        var w = 1920;
                        if (side == 0){ //left
                            p[0] = -20 + Math.round(Math.random()*-80);
                            p[1] = -100 + Math.round(Math.random()*(h+200));
                        }else if (side == 1){ //right
                            p[0] = w + 20 + Math.round(Math.random()*80);
                            p[1] = -100 + Math.round(Math.random()*(h+200));
                        }else if (side == 2){ //top
                            p[0] = -100 + Math.round(Math.random()*(w+200));
                            p[1] = -20 + Math.round(Math.random()*-80);
                        }else if (side == 3){
                            p[0] = -100 + Math.round(Math.random()*(w+200));
                            p[1] = h + 20 + Math.round(Math.random()*80);
                        }
                        var x, y = 0;
                        if (p[0] < 950) {
                            x = 1000 + Math.round(Math.random() * 900);
                        } else {
                            x = Math.round(Math.random() * 900);
                        }
                        if (p[1] < 500) {
                            y = 550 + Math.round(Math.random() * 500);
                        } else {
                            y = Math.round(Math.random() * 500);
                        }
                        Enemies.addEnemy({id:'test',type: 'star',x:p[0],y:p[1],behaviour: {name: 'star', startMove: [x,y]}});
                    }
                    this.wispLogo = new PIXI.Text('About Flim' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.wispLogo.position.x = (Graphics.width / 2);
                    this.wispLogo.position.y = 40;
                    this.wispLogo.anchor.x = 0.5;
                    this.wispLogo.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.wispLogo);

                    this.welcome = new PIXI.Text('Welcome to WISP! The game about avoiding shapes!' , {font: '40px Orbitron', fill: 0xd9b73, align: 'left'});
                    this.welcome.position.x = (Graphics.width / 2);
                    this.welcome.position.y = 125;
                    this.welcome.anchor.x = 0.5;
                    this.welcome.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.welcome);

                    this.nameDrop = new PIXI.Text('By Ian Roberts' , {font: '48px Orbitron', fill: 0xd9b73, align: 'left'});
                    this.nameDrop.position.x = (Graphics.width / 2);
                    this.nameDrop.position.y = (175);
                    this.nameDrop.anchor.x = 0.5;
                    this.nameDrop.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.nameDrop);

                    this.controls = new PIXI.Text('Controls: Use your mouse/touchscreen to guide the wisp' , {font: '48px Verdana', fill: 'white', align: 'left'});
                    this.controls.position.x = (Graphics.width / 2);
                    this.controls.position.y = (275);
                    this.controls.anchor.x = 0.5;
                    this.controls.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.controls);

                    this.soloMode = new PIXI.Text('Solo Mode: Guide the shapes into the gray squares as they appear. You lose when you are hit by any shape, and the faster you complete each level the higher the score!' , {font: '36px Verdana', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
                    this.soloMode.position.x = (Graphics.width / 2);
                    this.soloMode.position.y = (450);
                    this.soloMode.anchor.x = 0.5;
                    this.soloMode.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.soloMode);

                    this.coopMode = new PIXI.Text('Co-op Mode: Same as solo mode with more time in between levels. Shapes will split between players. Scoring is shared - if a player dies enemies will be worth nothing for that round - but the player will revive for the next round!' , {font: '36px Verdana', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
                    this.coopMode.position.x = (Graphics.width / 2);
                    this.coopMode.position.y = (725);
                    this.coopMode.anchor.x = 0.5;
                    this.coopMode.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.coopMode);

                    this.vsMode = new PIXI.Text('Versus Mode: No scoring. First player to get hit loses!' , {font: '36px Verdana', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
                    this.vsMode.position.x = (Graphics.width / 2);
                    this.vsMode.position.y = (950);
                    this.vsMode.anchor.x = 0.5;
                    this.vsMode.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.vsMode);

                    //set up the back button
                    this.backButton = new PIXI.Text('BACK' , {font: '72px Verdana', fill: 'white', align: 'left'});
                    this.backButton.position.x = Graphics.width - 5 - this.backButton.width/2;
                    this.backButton.position.y = this.backButton.height/2 + 5;
                    this.backButton.anchor.x = 0.5;
                    this.backButton.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.backButton);
                    this.backButton.interactive = true;
                    this.backButton.buttonMode = true;
                    this.backButton.on('click', function onClick(){
                        Acorn.changeState('mainMenu');
                    });
                    this.backButton.on('tap', function onClick(){
                        Acorn.changeState('mainMenu');
                    });

                    //stop playing music if returning from in game
                    Acorn.Sound.stop('flim');
                },
                update: function(dt){
                    Graphics.worldPrimitives.clear();
                    Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                    ChatConsole.update(dt);
                    Party.members['test'].targetLoc.x = Player.mouseLoc[0];
                    Party.members['test'].targetLoc.y = Player.mouseLoc[1];
                    Party.update(dt);
                    Enemies.update(dt);
                    Party.draw();
                }
            });

            Acorn.addState({
                stateId: 'settingsPage',
                init: function(){
                    console.log('Initializing settings page');
                    document.body.style.cursor = 'default';
                    Graphics.clear();
                    
                    this.mute = new PIXI.Text('MUTE: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.mute.position.x = (Graphics.width / 2);
                    this.mute.position.y = 100;
                    this.mute.anchor.x = 0.5;
                    this.mute.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.mute);

                    this.muteX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.muteX.position.x = (Graphics.width / 2 + this.mute.width/2 + 5 + this.muteX.width/2);
                    this.muteX.position.y = 100;
                    this.muteX.anchor.x = 0.5;
                    this.muteX.anchor.y = 0.5;
                    this.muteX.interactive = true;
                    this.muteX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.muteX);
                    this.muteX.on('click', function onClick(){
                        Settings.toggleMute();
                    });
                    this.muteX.on('tap', function onClick(){
                        Settings.toggleMute();
                    });

                    this.master = new PIXI.Text('Master Volume' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.master.position.x = (Graphics.width / 2);
                    this.master.position.y = 175;
                    this.master.anchor.x = 0.5;
                    this.master.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.master);

                    this.masterBar = new PIXI.Text('____________________' , {font: '40px Verdana', fill: 'hsla(93, 100%, 50%, 0)', align: 'left'});
                    this.masterBar.position.x = (Graphics.width / 2);
                    this.masterBar.position.y = 225;
                    this.masterBar.anchor.x = 0.5;
                    this.masterBar.anchor.y = 0.5;
                    this.masterBar.interactive = true;
                    this.masterBar.buttonMode = true;
                    this.masterBar.clicked = false;
                    this.masterBar.percent = Settings.masterVolume;
                    Graphics.uiContainer.addChild(this.masterBar);
                    Graphics.setSlideBar(this.masterBar,Settings.setMasterVolume);
                    this.masterBar.on('mousemove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].masterBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setMasterVolume(percent);
                            bar.percent = percent;
                        }
                    });
                    this.masterBar.on('touchmove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].masterBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setMasterVolume(percent);
                            bar.percent = percent;
                        }
                    });

                    this.music = new PIXI.Text('Music Volume' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.music.position.x = (Graphics.width / 2);
                    this.music.position.y = 300;
                    this.music.anchor.x = 0.5;
                    this.music.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.music);

                    this.musicBar = new PIXI.Text('____________________' , {font: '40px Verdana', fill: 'hsla(93, 100%, 50%, 0)', align: 'left'});
                    this.musicBar.position.x = (Graphics.width / 2);
                    this.musicBar.position.y = 350;
                    this.musicBar.anchor.x = 0.5;
                    this.musicBar.anchor.y = 0.5;
                    this.musicBar.interactive = true;
                    this.musicBar.buttonMode = true;
                    this.musicBar.clicked = false;
                    this.musicBar.percent = Settings.musicVolume;
                    Graphics.uiContainer.addChild(this.musicBar);
                    Graphics.setSlideBar(this.musicBar,Settings.setMusicVolume);
                    this.musicBar.on('mousemove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].musicBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setMusicVolume(percent);
                            bar.percent = percent;
                        }
                    });
                    this.musicBar.on('touchmove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].musicBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setMusicVolume(percent);
                            bar.percent = percent;
                        }
                    });

                    this.SFX = new PIXI.Text('SFX Volume' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.SFX.position.x = (Graphics.width / 2);
                    this.SFX.position.y = 425;
                    this.SFX.anchor.x = 0.5;
                    this.SFX.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.SFX);

                    this.SFXBar = new PIXI.Text('____________________' , {font: '40px Verdana', fill: 'hsla(93, 100%, 50%, 0)', align: 'left'});
                    this.SFXBar.position.x = (Graphics.width / 2);
                    this.SFXBar.position.y = 475;
                    this.SFXBar.anchor.x = 0.5;
                    this.SFXBar.anchor.y = 0.5;
                    this.SFXBar.interactive = true;
                    this.SFXBar.buttonMode = true;
                    this.SFXBar.clicked = false;
                    this.SFXBar.percent = Settings.sfxVolume;
                    Graphics.uiContainer.addChild(this.SFXBar);
                    Graphics.setSlideBar(this.SFXBar,Settings.setSFXVolume);
                    this.SFXBar.on('mousemove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].SFXBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setSFXVolume(percent);
                            bar.percent = percent;
                        }
                    });
                    this.SFXBar.on('touchmove', function onClick(e){
                        var bar = Acorn.states['settingsPage'].SFXBar;
                        if (bar.clicked){
                            var position = e.data.getLocalPosition(e.target);
                            var start =  -1 * bar._width/2;
                            var percent = (position.x - start) / bar._width;
                            if (percent < 0){percent = 0;}
                            if (percent > 1){percent = 1;}
                            Settings.setSFXVolume(percent);
                            bar.percent = percent;
                        }
                    });

                    this.FS = new PIXI.Text('FullScreen: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.FS.position.x = (Graphics.width / 2);
                    this.FS.position.y = 550;
                    this.FS.anchor.x = 0.5;
                    this.FS.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.FS);

                    this.FSX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.FSX.position.x = (Graphics.width / 2 + 5 + this.FS.width/2 + this.FSX.width/2);
                    this.FSX.position.y = 550;
                    this.FSX.anchor.x = 0.5;
                    this.FSX.anchor.y = 0.5;
                    this.FSX.interactive = true;
                    this.FSX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.FSX);
                    this.FSX.on('click', function onClick(){
                        Settings.toggleAutoFullScreen();
                    });
                    this.FSX.on('tap', function onClick(){
                        Settings.toggleAutoFullScreen();
                    });

                    this.fitWindow = new PIXI.Text('Fill Window: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.fitWindow.position.x = (Graphics.width / 2);
                    this.fitWindow.position.y = 625;
                    this.fitWindow.anchor.x = 0.5;
                    this.fitWindow.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.fitWindow);

                    this.fitWindowX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.fitWindowX.position.x = (Graphics.width / 2 + 5 + this.fitWindow.width/2 + this.fitWindowX.width/2);
                    this.fitWindowX.position.y = 625;
                    this.fitWindowX.anchor.x = 0.5;
                    this.fitWindowX.anchor.y = 0.5;
                    this.fitWindowX.interactive = true;
                    this.fitWindowX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.fitWindowX);
                    this.fitWindowX.on('click', function onClick(){
                        Settings.toggleScaleToFit();
                    });
                    this.fitWindowX.on('tap', function onClick(){
                        Settings.toggleScaleToFit();
                    });

                    this.dust = new PIXI.Text('Dust: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.dust.position.x = (Graphics.width / 2);
                    this.dust.position.y = 700;
                    this.dust.anchor.x = 0.5;
                    this.dust.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.dust);

                    this.dustX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.dustX.position.x = (Graphics.width / 2 + 5 + this.dust.width/2 + this.dustX.width/2);
                    this.dustX.position.y = 700;
                    this.dustX.anchor.x = 0.5;
                    this.dustX.anchor.y = 0.5;
                    this.dustX.interactive = true;
                    this.dustX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.dustX);
                    this.dustX.on('click', function onClick(){
                        Settings.toggleDust();
                    });
                    this.dustX.on('tap', function onClick(){
                        Settings.toggleDust();
                    });

                    this.trails = new PIXI.Text('Wisp Trails: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.trails.position.x = (Graphics.width / 2);
                    this.trails.position.y = 775;
                    this.trails.anchor.x = 0.5;
                    this.trails.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.trails);

                    this.trailsX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.trailsX.position.x = (Graphics.width / 2 + 5 + this.trails.width/2 + this.trailsX.width/2);
                    this.trailsX.position.y = 775;
                    this.trailsX.anchor.x = 0.5;
                    this.trailsX.anchor.y = 0.5;
                    this.trailsX.interactive = true;
                    this.trailsX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.trailsX);
                    this.trailsX.on('click', function onClick(){
                        Settings.toggleTrails();
                    });
                    this.trailsX.on('tap', function onClick(){
                        Settings.toggleTrails();
                    });

                    this.stats = new PIXI.Text('Toggle Stats: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
                    this.stats.position.x = (Graphics.width / 2);
                    this.stats.position.y = 850;
                    this.stats.anchor.x = 0.5;
                    this.stats.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.stats);

                    this.statsX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
                    this.statsX.position.x = (Graphics.width / 2 + 5 + this.stats.width/2 + this.statsX.width/2);
                    this.statsX.position.y = 850;
                    this.statsX.anchor.x = 0.5;
                    this.statsX.anchor.y = 0.5;
                    this.statsX.interactive = true;
                    this.statsX.buttonMode = true;
                    Graphics.uiContainer.addChild(this.statsX);
                    this.statsX.on('click', function onClick(){
                        Settings.toggleStats();
                    });
                    this.statsX.on('tap', function onClick(){
                        Settings.toggleStats();
                    });

                    //set up the back button
                    this.backButton = new PIXI.Text('BACK' , {font: '72px Verdana', fill: 'white', align: 'left'});
                    this.backButton.position.x = this.backButton.width/2 + 5;
                    this.backButton.position.y = this.backButton.height/2 + 5;
                    this.backButton.anchor.x = 0.5;
                    this.backButton.anchor.y = 0.5;
                    Graphics.uiContainer.addChild(this.backButton);
                    this.backButton.interactive = true;
                    this.backButton.buttonMode = true;
                    this.backButton.on('click', function onClick(){
                        Acorn.changeState('mainMenu');
                    });
                    this.backButton.on('tap', function onClick(){
                        Acorn.changeState('mainMenu');
                    });

                    this.logoutButton = new PIXI.Text("Log Out", {font: '40px Audiowide', fill: 'white', align: 'center'});
                    this.logoutButton.anchor.x = 0.5;
                    this.logoutButton.anchor.y = 0.5;
                    this.logoutButton.position.x = Graphics.width/2;
                    this.logoutButton.position.y = Graphics.height* 0.95;
                    Graphics.uiContainer.addChild(this.logoutButton);
                    this.logoutButton.interactive = true;
                    this.logoutButton.buttonMode = true;
                    this.logoutButton.on('click', function onClick(){
                        Acorn.Net.socket_.emit('playerUpdate',{logout: true});
                    });
                    this.logoutButton.on('tap', function onClick(){
                        Acorn.Net.socket_.emit('playerUpdate',{logout: true});
                    });
                    //stop playing music if returning from in game
                    Acorn.Sound.stop('flim');
                },
                update: function(dt){
                    Graphics.worldPrimitives.clear();
                    Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.muteX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.fitWindowX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.FSX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.dustX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.trailsX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.statsX,Graphics.worldPrimitives, 14);
                    Graphics.drawBoxAround(this.masterBar,Graphics.worldPrimitives);
                    Graphics.drawBoxAround(this.logoutButton,Graphics.worldPrimitives);
                    Graphics.worldPrimitives.beginFill(0xFFFFFF,0.8);
                    Graphics.worldPrimitives.drawRect(this.masterBar.position.x - this.masterBar._width/2,
                                              this.masterBar.position.y - this.masterBar._height/2,
                                              this.masterBar.percent*this.masterBar._width,
                                              this.masterBar._height);
                    Graphics.worldPrimitives.endFill();
                    Graphics.drawBoxAround(this.musicBar,Graphics.worldPrimitives);
                    Graphics.worldPrimitives.beginFill(0xFFFFFF,0.8);
                    Graphics.worldPrimitives.drawRect(this.musicBar.position.x - this.musicBar._width/2,
                                              this.musicBar.position.y - this.musicBar._height/2,
                                              this.musicBar.percent*this.musicBar._width,
                                              this.musicBar._height);
                    Graphics.worldPrimitives.endFill();
                    Graphics.drawBoxAround(this.SFXBar,Graphics.worldPrimitives);
                    Graphics.worldPrimitives.beginFill(0xFFFFFF,0.8);
                    Graphics.worldPrimitives.drawRect(this.SFXBar.position.x - this.SFXBar._width/2,
                                              this.SFXBar.position.y - this.SFXBar._height/2,
                                              this.SFXBar.percent*this.SFXBar._width,
                                              this.SFXBar._height);
                    Graphics.worldPrimitives.endFill();
                    if (Settings.mute){
                        this.muteX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.muteX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    if (Settings.autoFullScreen){
                        this.FSX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.FSX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    if (Settings.scaleToFit){
                        this.fitWindowX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.fitWindowX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    if (Settings.dust){
                        this.dustX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.dustX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    if (Settings.trails){
                        this.trailsX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.trailsX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    if (Settings.statsOn){
                        this.statsX.style = {font: '64px Orbitron', fill: 'white', align: 'left'};
                    }else{
                        this.statsX.style = {font: '64px Orbitron', fill: 'black', align: 'left'}
                    }
                    ChatConsole.update(dt);
                }
            });

            Acorn.Input.onMouseMove(function(e) {
                mouseX = e.layerX/Graphics.actualRatio[0];
                mouseY = e.layerY/Graphics.actualRatio[1];
                Player.mouseLoc = [mouseX,mouseY];
                try{
                    Player.updateLoc(mouseX, mouseY);
                    Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [mouseX,mouseY]});
                }catch(e){}
            });

            Acorn.Input.onTouchEvent(function(e) {
                //Acorn.Net.socket_.emit('log',{log: "got to touch event"});
                var position = e.data.getLocalPosition(e.target);
                mouseX = position.x;
                mouseY = position.y;
                Player.mouseLoc = [mouseX,mouseY];
                try{
                    Player.updateLoc(position.x, position.y);
                    Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [position.x,position.y]});
                }catch(e){}
            });
        }
    }
    window.AcornSetup = AcornSetup;
})(window);