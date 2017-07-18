var mouseX, mouseY;
var buttons = [0,0,0];

var stats;

var now, dt, lastTime;

var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000/60);
        };
})();


var mainObj = this;
mainObj.playerId = 'none';

$(function() {

    WebFontConfig = {
      google: {
        families: [ 'Audiowide', 'Arvo', 'Podkova:700' , 'Electrolize', 'Orbitron', 'Sigmar One','Audiowide']
      },

      active: function() {
        // do something
      }

    };
    (function() {
        var wf = document.createElement('script');
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
            '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
      })();
    // initialize Graphics
    Graphics.init(1920, 1080);
    Graphics.onReady(function() {
        Graphics.resourcesReady = true;
        console.log(Graphics);
        setupSocket();
        checkReady();
        document.body.appendChild(Graphics.renderer.view);
    });
    Graphics.resize();
    window.onresize = function(event) {
        Graphics.resize();
    };
    Graphics.startLoad();

    $(document).keypress(function(e) {
        if(e.keyCode === 32) {
            e.preventDefault();
        }
        ChatConsole.keyPress(e.which);
    });

    var fsModes = ['webkitfullscreenchange', 'fullscreenchange','msfullscreenchange', 'mozfullscreenchange'];
    for (var i = 0; i < fsModes.length;i++){
        document.addEventListener(fsModes[i],function(e){
            Settings.toggleScaleToFit();
        });
    }
    // Set up keyboard bindings
    $(document).keydown(function(e) {
        var key = e.which;
        ChatConsole.keyDown(key);

        if (!ChatConsole.active) {
            Acorn.Input.keyDown(key);
        }
        // Prevent system wide stops
        if (
                key === 8 || // Backspace
                key === 16// Delete
            ){
            e.preventDefault();
        }

        if ((key === 32 || key === 38 || key === 37 || key === 39 || key === 40 || key === 127) && !ChatConsole.active){
            e.preventDefault();
        }
    });

    $(document).keyup(function(e) {
        Acorn.Input.keyUp(e.which)
    });

    window.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        return false;
    });

    // Load Sounds
    Acorn.Sound.init();
    Acorn.Sound.addSound({url: 'sounds/my_sound.mp3', id: 'item', volume: 1, preload: true});
    Acorn.Sound.addSound({url: 'sounds/Flim.mp3', multi:false, id: 'flim', volume: 1,type: 'music',preload: true,onEnd: function(){Acorn.Sound.play('flim');}});
});

function setupSocket() {
    Acorn.Net.init();

    // Bind socket info

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

    Acorn.Net.on('warning', function (data) {
      Player.addWarning(data.time, data.level);
    });

    Acorn.Net.on('backToMainMenu', function (data) {
      Acorn.changeState('mainMenu');
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
        if (!Player.gameEnded){
          for (var i = 0; i < data.data.length; i++){
            Enemies.addEnemy(data.data[i]);
          }
        }
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

    console.log("network ready!");
}

function checkReady() {
    if(Graphics.resourcesReady && Acorn.Net.ready && Acorn.Sound.ready) {
        console.log('Graphics/Net/Sound READY');
        init();
    } else {
        console.log('Waiting on load...');
    }
}

function init() {
    //do some stuff after Graphics and network are initialized
    lastTime = Date.now();
    
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'top';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    stats.domElement.style.x = 0;
    stats.domElement.style.y = 0;
    //document.body.appendChild( stats.domElement );
    console.log(stats.domElement.style);
    //Init Console
    ChatConsole.init(Acorn.Net.socket_);

    //Init dust
    Dust.init()

    //Init Touch Events
    Graphics.stage.on('touchstart', Acorn.Input.handleTouchEvent).on('touchmove', Acorn.Input.handleTouchEvent);

    Graphics.showLoadingMessage(false);
    console.log('Loading Complete');
    Acorn.changeState('mainMenu');
    update();
}

function update(){
    requestAnimFrame(update);
    stats.begin();
    now = Date.now();
    dt = (now - lastTime) / 1000.0;
    Acorn.states[Acorn.currentState].update(dt); //update the current state
    Graphics.renderer.render(Graphics.stage);
    lastTime = now;
    stats.end();
}

//Set up all states
//-----------------------------------------------------------------------------------------------|
//                              Game States (Acorn.states)
//-----------------------------------------------------------------------------------------------|

//Initial State
//TODO might not use this?
Acorn.addState({
    stateId: 'initialScreen',
    init: function(){
        console.log('Initializing initial screen');
        document.body.style.cursor = 'default';
        Graphics.clear();
        Player.gameEnded = false;
        this.wispLogo = new PIXI.Text('W.I.S.P.' , {font: '200px Orbitron', fill: 'white', align: 'left'});
        this.wispLogo.position.x = (Graphics.width / 2);
        this.wispLogo.position.y = (Graphics.height / 4);
        this.wispLogo.anchor.x = 0.5;
        this.wispLogo.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.wispLogo);

        this.clickText = new PIXI.Text('click/tap to begin' , {font: '100px Orbitron', fill: 'white', align: 'left'});
        this.clickText.position.x = (Graphics.width / 2);
        this.clickText.position.y = (Graphics.height / 2);
        this.clickText.anchor.x = 0.5;
        this.clickText.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.clickText);
    },
    update: function(dt){
        ChatConsole.update(dt);
    }
});

//Main Menu
Acorn.addState({
    stateId: 'mainMenu',
    init: function(){
        console.log('Initializing main menu');
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
        });
        this.singlePlayerButton.on('tap', function onClick(){
            Acorn.Net.socket_.emit('join',{solo: true});
            Acorn.changeState('joiningGame');
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
        });
        this.multiPlayerButton.on('tap', function onClick(){
            Acorn.Net.socket_.emit('join',{coop: true});
            Acorn.changeState('joiningGame');
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
        });
        this.versusButton.on('tap', function onClick(){
            Acorn.Net.socket_.emit('join',{vs: true});
            Acorn.changeState('joiningGame');
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
        this.playerCount.position.x = this.playerCount.width/2 + 5;
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
        Graphics.drawBoxAround(this.versusButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.aboutButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.settingsButton,Graphics.worldPrimitives);
        ChatConsole.update(dt);
        //request player count every 5 seconds
        this.reqTicker += dt;
        if (this.reqTicker >= 5.0){
            this.reqTicker -= 5.0;
            requestPlayerCount();
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
            requestPlayerCount();
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
    stateId: 'inGame',
    init: function(){
        document.body.style.cursor = 'none';
        Graphics.clear();
        Acorn.Sound.play('flim');
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
        drawTarget();
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

        this.welcome = new PIXI.Text('Welcome to WISP! The amazing game about avoiding shapes with your mouse!' , {font: '40px Orbitron', fill: 0xd9b73, align: 'left'});
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

        this.controls = new PIXI.Text('Controls: Use your mouse' , {font: '48px Verdana', fill: 'white', align: 'left'});
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
        Party.members['test'].targetLoc.x = mouseX;
        Party.members['test'].targetLoc.y = mouseY;
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
        setSlideBar(this.masterBar,Settings.setMasterVolume);
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
        setSlideBar(this.musicBar,Settings.setMusicVolume);
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
        setSlideBar(this.SFXBar,Settings.setSFXVolume);
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

        this.FS = new PIXI.Text('Auto FullScreen: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
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

        this.dust = new PIXI.Text('Dust: ' , {font: '40px Orbitron', fill: 'white', align: 'left'});
        this.dust.position.x = (Graphics.width / 2);
        this.dust.position.y = 625;
        this.dust.anchor.x = 0.5;
        this.dust.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.dust);

        this.dustX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
        this.dustX.position.x = (Graphics.width / 2 + 5 + this.dust.width/2 + this.dustX.width/2);
        this.dustX.position.y = 625;
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
        this.trails.position.y = 700;
        this.trails.anchor.x = 0.5;
        this.trails.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.trails);

        this.trailsX = new PIXI.Text('X' , {font: '40px Verdana', fill: 'black', align: 'left'});
        this.trailsX.position.x = (Graphics.width / 2 + 5 + this.trails.width/2 + this.trailsX.width/2);
        this.trailsX.position.y = 700;
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

        //stop playing music if returning from in game
        Acorn.Sound.stop('flim');
    },
    update: function(dt){
        Graphics.worldPrimitives.clear();
        Graphics.drawBoxAround(this.backButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.muteX,Graphics.worldPrimitives, 14);
        Graphics.drawBoxAround(this.FSX,Graphics.worldPrimitives, 14);
        Graphics.drawBoxAround(this.dustX,Graphics.worldPrimitives, 14);
        Graphics.drawBoxAround(this.trailsX,Graphics.worldPrimitives, 14);
        Graphics.drawBoxAround(this.masterBar,Graphics.worldPrimitives);
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
        ChatConsole.update(dt);
    }
});

Acorn.Input.onMouseMove(function(e) {
    mouseX = e.layerX/Graphics.actualRatio[0];
    mouseY = e.layerY/Graphics.actualRatio[1];
    try{
        Player.updateLoc(mouseX, mouseY);
        Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [mouseX,mouseY]});
    }catch(e){}
});

Acorn.Input.onTouchEvent(function(e) {
    var position = e.data.getLocalPosition(e.target);
    mouseX = position.x;
    mouseY = position.y;
    try{
        Player.updateLoc(position.x, position.y);
        Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [position.x,position.y]});
    }catch(e){}
});

function drawTarget(){
    Graphics.worldPrimitives.lineStyle(3,0xFFFFFF,1); 
    Graphics.worldPrimitives.moveTo(Player.targetLoc.x - 10, Player.targetLoc.y);
    Graphics.worldPrimitives.lineTo(Player.targetLoc.x + 10, Player.targetLoc.y);
    Graphics.worldPrimitives.moveTo(Player.targetLoc.x, Player.targetLoc.y - 10);
    Graphics.worldPrimitives.lineTo(Player.targetLoc.x, Player.targetLoc.y + 10);
}

function requestPlayerCount(){
    Acorn.Net.socket_.emit('playerUpdate',{requestPlayerCount: true});
}

function setSlideBar(bar,func){
    bar.on('mousedown', function onClick(){
        bar.clicked = true;
    });
    bar.on('mouseup', function onClick(e){
        if (bar.clicked){
            var position = e.data.getLocalPosition(e.target);
            var start =  -1 * bar._width/2;
            var percent = (position.x - start) / bar._width;
            if (percent < 0){percent = 0;}
            if (percent > 1){percent = 1;}
            func(percent);
            bar.percent = percent;
        }
        bar.clicked = false;
    });
    bar.on('mouseupoutside', function onClick(){
        bar.clicked = false;
    });
    bar.on('touchstart', function onClick(){
        bar.clicked = true;
    });
    bar.on('touchend', function onClick(e){
        if (bar.clicked){
            var position = e.data.getLocalPosition(e.target);
            var start =  -1 * bar._width/2;
            var percent = (position.x - start) / bar._width;
            if (percent < 0){percent = 0;}
            if (percent > 1){percent = 1;}
            func(percent);
            bar.percent = percent;
        }
        bar.clicked = false;
    });
    bar.on('touchendoutside', function onClick(){
        bar.clicked = false;
    });
}
