//----------------------------------------------------------------
//eventhandler.js
// used by a game session to update levels 
//----------------------------------------------------------------

var EventHandler = function(session) {
    this.session = session
    this.timePerEvent = null;
    this.timeBetweenEvents = null;
    this.timePerEventTicker = null;
    this.timeBetweenEventsTicker = null;
    this.warningTime = null;
    this.warningSent = null;
    this.eventStarted = null;
    this.betweenEvents = null;
    this.eventEnemyArray = null;
    this.squares = null;
    this.maxSquares = null;
}

EventHandler.prototype.init = function (data) {
    //TODO different game types etc. in init
    this.timePerEvent = data.timePerEvent;
    this.timeBetweenEvents = data.timeBetweenEvents;
    this.timePerEventTicker = 0;
    this.timeBetweenEventsTicker = 0;
    this.warningTime = data.warningTime;
    this.warningSent = false;
    this.eventStarted = false;
    this.eventEnemyArray = ['c1'];
    this.squares = [];
    this.maxSquares = data.maxSquares;
    this.betweenEvents = true;
};

EventHandler.prototype.getRandomPos = function(canBeTopOrBottom) {
    //get a random position outside the map 
    var h = 1080;
    var w = 1920;
    var p = [0,0];
    if (canBeTopOrBottom){
        var side = Math.floor(Math.random()*4);
    }else{
        var side = Math.floor(Math.random()*2);
    }
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
    return p;
}

EventHandler.prototype.getParallelograms = function(enemiesAdded) {
    var rowStart = 2120;
    var colStart = -64;
    var arr = [];
    var lateral = true;
    if (Math.round(Math.random())){
        rowStart = -200 -20*196;
    }
    var rand = Math.random()*4;
    if (rand < 1){
        rowStart = -200 -20*196;
        colStart = -64;
    }else if (rand < 2){
        rowStart = 64;
        colStart = -200 -20*128;
        lateral = false
    }else if (rand < 3){
        rowStart = 64;
        colStart = 1280;
        lateral = false;
    }
    for (var row = 0;row < 20;row++){
        var arr2 = [];
        for (var col = 0;col < 10;col++){
            arr2.push(1);
        }
        arr.push(arr2);
    }
    //lateral
    var points = [  [0,(1+Math.floor(Math.random()*8))],
                    [3+Math.floor(Math.random()*3),(1+Math.floor(Math.random()*8))],
                    [8+Math.floor(Math.random()*3),(1+Math.floor(Math.random()*8))],
                    [14+Math.floor(Math.random()*3),(1+Math.floor(Math.random()*8))],
                    [19,(1+Math.floor(Math.random()*8))]];
    for (var i = 0; i < 4;i++){
        var atNextPoint = false;
        var currentLoc = [points[i][0],points[i][1]];
        while(!atNextPoint){
            arr[currentLoc[0]][currentLoc[1]] = 0;
            if (currentLoc[0] < points[i+1][0]){
                currentLoc[0] += 1;
            }else if (currentLoc[0] > points[i+1][0]){
                currentLoc[0] -= 1;
            }else if (currentLoc[1] < points[i+1][1]){
                currentLoc[1] += 1;
            }else if (currentLoc[1] > points[i+1][1]){
                currentLoc[1] -= 1;
            }
            if (currentLoc[0] == points[i+1][0] && currentLoc[1] == points[i+1][1]){
                atNextPoint = true;
            }
        }
    }
    arr[points[4][0]][points[4][1]] = 0;
    if (lateral){
        for (var i = 0; i < arr.length;i++){
            for (var j = 0; j < arr[i].length;j++){
                if (arr[i][j]){
                    var e = this.session.addEnemy('par', {pos: [rowStart+192*i,colStart+(128*j)]});
                    enemiesAdded.push({type: 'par', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
        }
    }else{
        for (var i = 0; i < arr.length;i++){
            for (var j = 0; j < arr[i].length;j++){
                if (arr[i][j]){
                    var e = this.session.addEnemy('par', {pos: [rowStart+192*j,colStart+(128*i)]});
                    enemiesAdded.push({type: 'par', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
        }
    }
    return enemiesAdded;
}

EventHandler.prototype.newEvent = function() {
    var enemiesAdded = [];
    if (this.session.level == 25 || (this.session.level > 32 && Math.random()*100 < Math.pow(2,this.squares.length))){
        //parallellogram event!!!
        //kill all squares
        for (var i = 0; i < this.squares.length; i++){
            this.squares[i].kill = true;
        }
        this.squares = [];
        //add stars
        for (var i = 0; i < 8; i++){
            var e = this.session.addEnemy('star');
            enemiesAdded.push({type: 'star', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
        }
        //add parallelograms
        enemiesAdded = this.getParallelograms(enemiesAdded);
    }else{
        //add squares every 4 levels
        if (this.session.level%4 == 0 || this.squares.length == 0){
            if (this.squares.length >= this.maxSquares){
                var r = (Math.floor(Math.random()*this.squares.length));
                var randomSquare = this.squares[r];
                randomSquare.kill = true;
                this.squares.splice(r,1);
            }
            var e = this.session.addEnemy('sq');
            enemiesAdded.push({type: 'sq', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y});
            this.squares.push(e);
        }
        switch(this.session.level){
            case 3:
                this.eventEnemyArray.push('c2');
                break;
            case 6:
                this.eventEnemyArray.push('c3');
                break;
            case 10:
                this.eventEnemyArray.push('tri');
                break;
            case 20:
                this.eventEnemyArray.push('hex');
                break;
        }
        var rand = Math.round(5 + (Math.random()*(5+this.session.level)) + this.session.level/2);
        if (rand > 50){
            rand = 50;
        }
        var trapezoidChance = (this.session.level*Math.round(Math.random()));
        if (Math.random()*100 < trapezoidChance){
            //for trapezoid event
            var positions = [[64,-32],[192,-32],[320,-32],[448,-32],[576,-32],[704,-32],[832,-32],[960,-32],[1088,-32],
                            [1216,-32],[1344,-32],[1472,-32],[1600,-32],[1728,-32],[1856,-32]];
            for (var i = 0; i < positions.length; i++){
                var e = this.session.addEnemy('trap',{pos: positions[i]});
                enemiesAdded.push({type: 'trap', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y});
                e.hitData.rotate(3.14);
            }
            positions = [[64,1112],[192,1112],[320,1112],[448,1112],[576,1112],[704,1112],[832,1112],[960,1112],[1088,1112],
                            [1216,1112],[1344,1112],[1472,1112],[1600,1112],[1728,1112],[1856,1112]];
            for (var i = 0; i < positions.length; i++){
                var e = this.session.addEnemy('trap',{pos: positions[i]});
                enemiesAdded.push({type: 'trap', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y});
            }
            positions = [[-32,192],[-32,320],[-32,448],[-32,576],[-32,704],[-32,832],[-32,960]];
            for (var i = 0; i < positions.length; i++){
                var e = this.session.addEnemy('trap',{pos: positions[i]});
                enemiesAdded.push({type: 'trap', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y});
                e.hitData.rotate(-1.57);
            }
            positions = [[1952,192],[1952,320],[1952,448],[1952,576],[1952,704],[1952,832],[1952,960]];
            for (var i = 0; i < positions.length; i++){
                var e = this.session.addEnemy('trap',{pos: positions[i]});
                enemiesAdded.push({type: 'trap', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y});
                e.hitData.rotate(1.57);
            }
        }
        if (Math.random()*100 < 5 && this.session.level > 15){
            //5% chance after level 15 for a Chaos event
            rand = Math.ceil(rand/this.session.playerCount);
            for (var player in this.session.players){
                for (var i = 0; i < rand;i++){
                    var type = 'chaos';
                    var e = this.session.addEnemy(type,{target: player});
                    enemiesAdded.push({type: type, id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
            for (var i = 0; i < 5; i++){
                var e = this.session.addEnemy('star');
                enemiesAdded.push({type: 'star', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
            }
        }else if (Math.random()*100 < 5 && this.session.level > 15){
            //5% chance after level 15 for an All-star event
            rand = rand/2;
            for (var i = 0; i < rand;i++){
                var e = this.session.addEnemy('star');
                enemiesAdded.push({type: 'star', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
            }
            for (var player in this.session.players){
                var e = this.session.addEnemy('tri', {target: player});
                enemiesAdded.push({type: 'tri', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
            }
            
        }else if (Math.random()*100 < 5 && this.session.level > 15){
            //5% chance after level 10 for an All-tri event
            rand = Math.ceil(rand/this.session.playerCount);
            for (var player in this.session.players){
                for (var i = 0; i < rand;i++){
                    var e = this.session.addEnemy('tri',{target: player});
                    enemiesAdded.push({type: 'tri', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
                for (var i = 0; i < rand;i++){
                    var e = this.session.addEnemy('c3',{target: player});
                    enemiesAdded.push({type: 'c3', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
            if (this.session.level >= 15){
                for (var i = 0; i < 10; i++){
                    var e = this.session.addEnemy('star');
                    enemiesAdded.push({type: 'star', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
        }else{
            //normal event
            rand = Math.ceil(rand/this.session.playerCount);
            for (var player in this.session.players){
                for (var i = 0; i < rand;i++){
                    var type = this.eventEnemyArray[Math.floor(Math.random()*this.eventEnemyArray.length)];
                    var e = this.session.addEnemy(type,{target: player});
                    enemiesAdded.push({type: type, id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
            if (this.session.level >= 15){
                for (var i = 0; i < 1+this.session.level%6; i++){
                    var e = this.session.addEnemy('star');
                    enemiesAdded.push({type: 'star', id: e.id, x: e.hitData.pos.x, y: e.hitData.pos.y, behaviour: e.behaviour});
                }
            }
        }
    }
    this.session.queueData('addEnemies', {data: enemiesAdded});
    this.session.level += 1;
    this.warningSent = false;
}

EventHandler.prototype.tick = function(deltaTime){
    //Events
    if (this.betweenEvents){
        this.timeBetweenEventsTicker += deltaTime;
        if (this.timeBetweenEventsTicker >= this.timeBetweenEvents){
            this.newEvent();
            this.betweenEvents = false;
            this.eventStarted = true;
            this.timeBetweenEventsTicker = 0;
            this.timePerEventTicker = 0;
        }
    }else{
        //event is ongoing - check enemies to see if the necessary ones have been killed
        var eventComplete = true;
        for (var i in this.session.enemies){
            if (this.session.enemies[i].killToStartNextEvent){
                eventComplete = false;
            }
        }
        if (eventComplete){
            for (var i in this.session.enemies){
                if (this.session.enemies[i].type == 'star' || this.session.enemies[i].type == 'trap'){
                    this.session.enemies[i].kill = true;
                }
            } 
            this.betweenEvents = true;
            this.warningSent = false;
            this.eventStarted = false;
            this.timeBetweenEventsTicker = 0;
            this.timePerEventTicker = 0;
        }
    }
    if (this.eventStarted){
        this.timePerEventTicker += deltaTime;
        if (this.timePerEventTicker >= this.timePerEvent){
            //NEW EVENT
            this.newEvent();
            this.timeBetweenEventsTicker = 0;
            this.timePerEventTicker = 0;
        }
    }
    //warning if new event is near
    if ((this.timeBetweenEventsTicker > (this.timeBetweenEvents-this.warningTime) ||
        this.timePerEventTicker > (this.timePerEvent - this.warningTime)) && !this.warningSent){
        this.warningSent = true;
        this.session.queueData('warning',{time: this.warningTime, level: this.session.level});
    }
}

exports.EventHandler = EventHandler;