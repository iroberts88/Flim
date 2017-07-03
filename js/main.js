var mouseX, mouseY;
var buttons = [0,0,0];

var stats;

var now, dt, lastTime;

var pixels = [];

var ended = false;

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
        families: [ 'Snippet', 'Arvo', 'Podkova:700' , 'Electrolize', 'Orbitron', 'Sigmar One','Audiowide']
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
    Acorn.Sound.addSound({url: 'sounds/my_sound.mp3', id: 'item', volume: 0.75});
    Acorn.Sound.addSound({url: 'sounds/Flim.mp3', multi:false, id: 'flim', volume: 0.5,type: 'music',preload: true,onEnd: function(){Acorn.Sound.play('flim');}});
    //Acorn.Sound.addSound({url: 'sounds/cafo.ogg', id: 'music2', multi:false, type: 'music',preload: true});
    //Acorn.Sound.addSound({url: 'sounds/cafo1.mp3', id: 'cafo1', multi:false, type: 'music',preload: true,onEnd: function(){Acorn.Sound.play('cafo2');}});
    //Acorn.Sound.addSound({url: 'sounds/cafo2.mp3', id: 'cafo2', multi:false, type: 'music',preload: true,onEnd: function(){Acorn.Sound.play('cafo3');}});
    //Acorn.Sound.addSound({url: 'sounds/cafo3.mp3', id: 'cafo3', multi:false, type: 'music',preload: true});
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
            Party.addNewMember(data.players[i]);
        }
      }

      for (var i = 0; i < data.enemies.length; i++){
        Enemies.addEnemy(data.enemies[i]);
      }
    });

    Acorn.Net.on('addPlayerWisp', function (data) {
        console.log(data);
      if (data.id != mainObj.playerId){
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
        if (!ended) {
            ended = true;
            var uLost = new PIXI.Text('You Lose :(', { font: '100px Snippet', fill: 'red', align: 'left' });
            uLost.position.x = (Graphics.width / 2);
            uLost.position.y = (Graphics.height / 4);
            uLost.anchor.x = 0.5;
            uLost.anchor.y = 0.5;
            Graphics.uiContainer.addChild(uLost);
            if (data.score){
                var score = new PIXI.Text('Final Score: ' + data.score, { font: '100px Snippet', fill: 'red', align: 'left' });
                score.position.x = (Graphics.width / 2);
                score.position.y = (Graphics.height / 4 + 100);
                score.anchor.x = 0.5;
                score.anchor.y = 0.5;
                Graphics.uiContainer.addChild(score);
            }
        }
    });

     Acorn.Net.on('youLasted', function (data) {
        if (!ended) {
            ended = true;
            var uLost = new PIXI.Text('You Lasted ' + data.time + ' Seconds', { font: '100px Snippet', fill: 'red', align: 'left' });
            uLost.position.x = (Graphics.width / 2);
            uLost.position.y = (Graphics.height / 4);
            uLost.anchor.x = 0.5;
            uLost.anchor.y = 0.5;
            Graphics.uiContainer.addChild(uLost);
        }
    });

    Acorn.Net.on('youWin', function (data) {
        if (!ended) {
            ended = true;
            var uLost = new PIXI.Text('You Win! :)', { font: '100px Snippet', fill: 'red', align: 'left' });
            uLost.position.x = (Graphics.width / 2);
            uLost.position.y = (Graphics.height / 4);
            uLost.anchor.x = 0.5;
            uLost.anchor.y = 0.5;
            Graphics.uiContainer.addChild(uLost);
        }
    });

    Acorn.Net.on('disconnect', function (data) {
        if (!ended) {
            ended = true;
            var uLost = new PIXI.Text('Disconnect', { font: '100px Snippet', fill: 'red', align: 'left' });
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
                color: 0xFFFFFF
            })
        }
        Player.kill = true;
        Graphics.worldContainer.removeChild(Player.player);
      }
    });

    Acorn.Net.on('unKillPlayer', function (data) {
        console.log(data);
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
        console.log(data);
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
      for (var i = 0; i < data.data.length; i++){
        Enemies.addEnemy(data.data[i]);
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
    if(Graphics.resourcesReady && Acorn.Net.ready) {
        console.log('Ready');
        console.log(Graphics.resources);
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
    document.body.appendChild( stats.domElement );
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

function drawTarget(){
    Graphics.worldPrimitives.lineStyle(3,0xFFFFFF,1); 
    Graphics.worldPrimitives.moveTo(Player.targetLoc.x - 10, Player.targetLoc.y);
    Graphics.worldPrimitives.lineTo(Player.targetLoc.x + 10, Player.targetLoc.y);
    Graphics.worldPrimitives.moveTo(Player.targetLoc.x, Player.targetLoc.y - 10);
    Graphics.worldPrimitives.lineTo(Player.targetLoc.x, Player.targetLoc.y + 10);
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

Acorn.addState({
    stateId: 'mainMenu',
    init: function(){
        console.log('Initializing main menu');
        document.body.style.cursor = 'default';
        Graphics.clear();
        ended = false;
        this.wispLogo = new PIXI.Text('F-L-I-M' , {font: '200px Orbitron', fill: 'white', align: 'left'});
        this.wispLogo.position.x = (Graphics.width / 2);
        this.wispLogo.position.y = (Graphics.height / 4);
        this.wispLogo.anchor.x = 0.5;
        this.wispLogo.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.wispLogo);
        
        //set up the Solo button
        this.singlePlayerButton = new PIXI.Text('SOLO' , {font: '64px Audiowide', fill: 'red', align: 'center'});
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
        this.multiPlayerButton = new PIXI.Text('CO-OP' , {font: '64px Audiowide', fill: 'red', align: 'center'});
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
        this.versusButton = new PIXI.Text('VERSUS' , {font: '64px Audiowide', fill: 'red', align: 'center'});
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

        //set up the secret button
        this.secretButton = new PIXI.Text('...' , {font: '12px Orbitron', fill: 'black', align: 'left'});
        this.secretButton.position.x = 30;
        this.secretButton.position.y = 30;
        this.secretButton.anchor.x = 0.5;
        this.secretButton.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.secretButton);
        this.secretButton.interactive = true;
        this.secretButton.buttonMode = true;
        this.secretButton.on('click', function onClick(){
            Acorn.Net.socket_.emit('join',{secret: true});
            Acorn.changeState('joiningGame');
        });
        this.secretButton.on('tap', function onClick(){
            Acorn.Net.socket_.emit('join',{secret: true});
            Acorn.changeState('joiningGame');
        });

        //set up the secret button
        this.starsButton = new PIXI.Text('...' , {font: '12px Orbitron', fill: 'black', align: 'left'});
        this.starsButton.position.x = 1900;
        this.starsButton.position.y = 100;
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
        this.aboutButton = new PIXI.Text('about' , {font: '24px Orbitron', fill: 'red', align: 'left'});
        this.aboutButton.position.x = 1800;
        this.aboutButton.position.y = 24;
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

        //stop playing music if returning from in game
        Acorn.Sound.stop('flim');
    },
    update: function(dt){
        Graphics.worldPrimitives.clear();
        Graphics.drawBoxAround(this.singlePlayerButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.multiPlayerButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.versusButton,Graphics.worldPrimitives);
        Graphics.drawBoxAround(this.aboutButton,Graphics.worldPrimitives);
        ChatConsole.update(dt);
    }
});

Acorn.addState({
    stateId: 'joiningGame',
    init: function(){
        Graphics.clear();
        ended = false;
        this.waitingTextBase = 'waiting for next available game';
        this.waitingTicker = 0;
        this.dotz = 3;
        this.waiting = new PIXI.Text(this.waitingTextBase , {font: '36px Orbitron', fill: 'white', align: 'center'});
        this.waiting.position.x = (Graphics.width / 3);
        this.waiting.position.y = (Graphics.height / 2);
        this.waiting.anchor.x = 0.0;
        this.waiting.anchor.y = 0.0;
        Graphics.uiContainer.addChild(this.waiting);
        
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
        this.wispLogo = new PIXI.Text('About Flim' , {font: '40px Orbitron', fill: 'red', align: 'left'});
        this.wispLogo.position.x = (Graphics.width / 2);
        this.wispLogo.position.y = 40;
        this.wispLogo.anchor.x = 0.5;
        this.wispLogo.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.wispLogo);

        this.welcome = new PIXI.Text('Welcome to Flim! The shitty game about avoiding shapes with your mouse!' , {font: '40px Orbitron', fill: 0xd9b73, align: 'left'});
        this.welcome.position.x = (Graphics.width / 2);
        this.welcome.position.y = (100);
        this.welcome.anchor.x = 0.5;
        this.welcome.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.welcome);

        this.nameDrop = new PIXI.Text('By Ian Roberts' , {font: '48px Orbitron', fill: 0xd9b73, align: 'left'});
        this.nameDrop.position.x = (Graphics.width / 2);
        this.nameDrop.position.y = (150);
        this.nameDrop.anchor.x = 0.5;
        this.nameDrop.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.nameDrop);

        this.controls = new PIXI.Text('Controls: Use your mouse dummy' , {font: '48px Orbitron', fill: 'white', align: 'left'});
        this.controls.position.x = (Graphics.width / 2);
        this.controls.position.y = (250);
        this.controls.anchor.x = 0.5;
        this.controls.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.controls);

        this.soloMode = new PIXI.Text('Solo Mode: Use your mouse to guide the shapes into the gray squares as they appear. The faster you complete each level the higher the score!' , {font: '48px Orbitron', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
        this.soloMode.position.x = (Graphics.width / 2);
        this.soloMode.position.y = (450);
        this.soloMode.anchor.x = 0.5;
        this.soloMode.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.soloMode);

        this.coopMode = new PIXI.Text('Co-op Mode: Same as solo mode with more time in between levels. Shapes will split between players. Scoring is shared - if a player dies enemies will be worth nothing for that round - but the player will revive for the next round!' , {font: '48px Orbitron', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
        this.coopMode.position.x = (Graphics.width / 2);
        this.coopMode.position.y = (725);
        this.coopMode.anchor.x = 0.5;
        this.coopMode.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.coopMode);

        this.vsMode = new PIXI.Text('Versus Mode: No scoring. First player to get hit loses!' , {font: '48px Orbitron', fill: 0xd9b73, align: 'left',wordWrap: true, wordWrapWidth: 1900});
        this.vsMode.position.x = (Graphics.width / 2);
        this.vsMode.position.y = (950);
        this.vsMode.anchor.x = 0.5;
        this.vsMode.anchor.y = 0.5;
        Graphics.uiContainer.addChild(this.vsMode);

        //set up the back button
        this.backButton = new PIXI.Text('back' , {font: '24px Orbitron', fill: 'red', align: 'left'});
        this.backButton.position.x = 1800;
        this.backButton.position.y = 24;
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
    }
});

Acorn.Input.onMouseMove(function(e) {
    if (Acorn.currentState == 'mainMenu'){
    }else{
        mouseX = e.layerX/Graphics.actualRatio[0];
        mouseY = e.layerY/Graphics.actualRatio[1];
        Player.updateLoc(mouseX, mouseY);
        Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [mouseX,mouseY]});
    }
});

Acorn.Input.onTouchEvent(function(e) {
    if (Acorn.currentState == 'mainMenu'){
    }else{
        var position = e.data.getLocalPosition(e.target);
        Player.updateLoc(position.x, position.y);
        Acorn.Net.socket_.emit('playerUpdate',{newMouseLoc: [position.x,position.y]});
    }
});
