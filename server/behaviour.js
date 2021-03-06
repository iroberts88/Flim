//----------------------------------------------------------------
//behaviour.js
//various behaviours assigned to the enemy shapes to dictate movement etc.
//----------------------------------------------------------------

var SAT = require('./SAT.js'); //SAT POLYGON COLLISSION1
var V = SAT.Vector;
var P = SAT.Polygon;
var C = SAT.Circle;

//Assign to enemies for Enemy AI

var Behaviour = function() {};

var behaviourEnums = {
    BasicMoveTowards: 'basicMoveTowards',
    Square: 'square',
    Star: 'star',
    Hexagon: 'hexagon',
    Chaos: 'chaos',
    Trapezoid: 'trapezoid',
    Parallelogram: 'parallelogram'
};

Behaviour.prototype.getNewTarget = function(e,s){
    try{
        var t = s.players[s.playerList[Math.floor(Math.random()*s.playerList.length)]];
        s.queueData('enemyNewTarget',{id:e.id,targetId:t.id});
        return t;
    }catch(e){
        return 'none';
    }
}

Behaviour.prototype.chaos = function(enemy, deltaTime, data){
    if (typeof data.changedSpeed == 'undefined'){
        data.changedSpeed = false;
    }
    if (!data.changedSpeed){
        enemy.speed = data.speed;
        data.changedSpeed = true;
    }
    var Behaviour = require('./behaviour.js').Behaviour;
    Behaviour.basicMoveTowards(enemy,deltaTime, data);
}
Behaviour.prototype.basicMoveTowards = function(enemy, deltaTime, data){
    if (typeof data.acceleration == 'undefined'){
        data.acceleration = new V(0,0);
    }
    if (typeof data.noTarget == 'undefined'){
        data.noTarget = false;
    }
    enemy.active = true;
    //Get the closest player and set as target position;
    var xDist;
    var yDist;
    var target = enemy.gameSession.players[data.targetId];
    if (target.kill || data.noTarget){
        //there is no current target!
        var Behaviour = require('./behaviour.js').Behaviour;
        target = Behaviour.getNewTarget(enemy, enemy.gameSession);
        if (target != 'none'){
            data.targetId = target.id;
        }else{
            data.noTarget = true;
        }
    }else{
        xDist = target.hitData.pos.x - enemy.hitData.pos.x;
        yDist = target.hitData.pos.y - enemy.hitData.pos.y;
        if (!enemy.moveVector){
            enemy.moveVector = new V(0,0);
        }else{
            data.acceleration = new V(xDist,yDist).normalize();
            enemy.moveVector.x += data.acceleration.x*deltaTime*data.spring;
            enemy.moveVector.y += data.acceleration.y*deltaTime*data.spring;
            if (Math.sqrt(enemy.moveVector.x*enemy.moveVector.x + enemy.moveVector.y*enemy.moveVector.y) > 1){
                enemy.moveVector.normalize();
            }
        }
    }
    //move
    enemy.hitData.pos.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.hitData.pos.y += enemy.speed * enemy.moveVector.y * deltaTime;
};

Behaviour.prototype.hexagon = function(enemy, deltaTime, data){
    if (typeof data.noTarget == 'undefined'){
        data.noTarget = false;
    }
    try{
        enemy.active = true;
        var xDist;
        var yDist;
        var target = enemy.gameSession.players[data.targetId];
        if (target.kill || data.noTarget){
            //there is no current target!
            var Behaviour = require('./behaviour.js').Behaviour;
            target = Behaviour.getNewTarget(enemy, enemy.gameSession);
            if (target != 'none'){
                data.targetId = target.id;
            }else{
                data.noTarget = true;
            }
        }else{
            xDist = target.hitData.pos.x - enemy.hitData.pos.x;
            yDist = target.hitData.pos.y - enemy.hitData.pos.y;
            if (!enemy.moveVector){
                enemy.moveVector = new V(0,0);
            }else{
                enemy.moveVector = new V(xDist,yDist).normalize();
            }
        }
        //move
        enemy.hitData.pos.x += enemy.speed * enemy.moveVector.x * deltaTime;
        enemy.hitData.pos.y += enemy.speed * enemy.moveVector.y * deltaTime;
    }catch(e){
    }
};

Behaviour.prototype.square = function(enemy, deltaTime, data){
    if (typeof data.ticker == 'undefined'){
        data.ticker = 0;
    }
    data.ticker += deltaTime;
    if (data.ticker >= 2.0){
        enemy.active = true;
    }
    for (var i in enemy.gameSession.enemies){
        var e = enemy.gameSession.enemies[i];
        var kill = false;
        if (e.type !== 'sq'){
            //collide?
            if (SAT.testPolygonPolygon(enemy.hitData, e.hitData)){
                kill = true;
            }
        }
        if (kill){
            e.kill = true;
        }
    }
};

Behaviour.prototype.star = function(enemy, deltaTime, data){
    enemy.active = true;
    if (!enemy.moveVector){
        enemy.moveVector = new SAT.Vector(data.startMove[0] - enemy.hitData.pos.x, data.startMove[1] - enemy.hitData.pos.y).normalize();
    }
    if (typeof data.inPlay == 'undefined'){
        data.inPlay = false;
    }
    if (data.inPlay){
        var radius = 20;
        if (enemy.hitData.pos.x <= 0){
            enemy.hitData.pos.x = 0;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.hitData.pos.y <= 0){
            enemy.hitData.pos.y = 0;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
        if (enemy.hitData.pos.x >= 1920){
            enemy.hitData.pos.x = 1920;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.hitData.pos.y >= 1080){
            enemy.hitData.pos.y = 1080;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
    }else{
        if (enemy.hitData.pos.x < 1920 && enemy.hitData.pos.x > 0 && enemy.hitData.pos.y < 1080 && enemy.hitData.pos.y > 0){
            data.inPlay = true;
        }
    }
    //move
    enemy.hitData.pos.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.hitData.pos.y += enemy.speed * enemy.moveVector.y * deltaTime;
};

Behaviour.prototype.trapezoid = function(enemy, deltaTime, data){
    enemy.active = true;
    if (typeof data.moving == 'undefined'){
        if (enemy.hitData.pos.x <= 0){
            enemy.moveVector = new SAT.Vector(1,0);
            data.moving = 'r';
        }else if (enemy.hitData.pos.y <= 0){
            enemy.moveVector = new SAT.Vector(0,1);
            data.moving = 'd';
        }else if (enemy.hitData.pos.x >= 1920){
            enemy.moveVector = new SAT.Vector(-1,0);
            data.moving = 'l';
        }else if (enemy.hitData.pos.y >= 1080){
            enemy.moveVector = new SAT.Vector(0,-1);
            data.moving = 'u';
        }
    }else{
        if (data.moving == 'r'){
            if (enemy.hitData.pos.x >= 32){
                enemy.hitData.pos.x = 32;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'l'){
            if (enemy.hitData.pos.x <= 1888){
                enemy.hitData.pos.x = 1888;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'u'){
            if (enemy.hitData.pos.y <= 1048){
                enemy.hitData.pos.y = 1048;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'd'){
            if (enemy.hitData.pos.y >= 32){
                enemy.hitData.pos.y = 32;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }
    }
    //move
    enemy.hitData.pos.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.hitData.pos.y += enemy.speed * enemy.moveVector.y * deltaTime;
};

Behaviour.prototype.parallelogram = function(enemy, deltaTime, data){
    enemy.active = true;
    if (typeof data.moving == 'undefined'){
        if (enemy.hitData.pos.x < 0){
            enemy.moveVector = new SAT.Vector(1,0);
            data.moving = 'r';
        }else if (enemy.hitData.pos.y < 0){
            enemy.moveVector = new SAT.Vector(0,1);
            data.moving = 'd';
        }else if (enemy.hitData.pos.x > 1920){
            enemy.moveVector = new SAT.Vector(-1,0);
            data.moving = 'l';
        }else if (enemy.hitData.pos.y > 1080){
            enemy.moveVector = new SAT.Vector(0,-1);
            data.moving = 'u';
        }
    }else{
        if (data.moving == 'r'){
            if (enemy.hitData.pos.x >= 2016){
                enemy.kill = true;
            }
        }else if (data.moving == 'l'){
            if (enemy.hitData.pos.x <= -96){
                enemy.kill = true;
            }
        }else if (data.moving == 'u'){
            if (enemy.hitData.pos.y <= -64){
                enemy.kill = true;
            }
        }else if (data.moving == 'd'){
            if (enemy.hitData.pos.y >= 1144){
                enemy.kill = true;
            }
        }
    }
    //move
    enemy.hitData.pos.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.hitData.pos.y += enemy.speed * enemy.moveVector.y * deltaTime;
};

Behaviour.prototype.getBehaviour = function(actionStr){
    //return a behaviour based on passed id
    var Behaviour = require('./behaviour.js').Behaviour;
    switch(actionStr) {
        case behaviourEnums.BasicMoveTowards:
            return Behaviour.basicMoveTowards;
            break;
        case behaviourEnums.Square:
            return Behaviour.square;
            break;
        case behaviourEnums.Star:
            return Behaviour.star;
            break;
        case behaviourEnums.Hexagon:
            return Behaviour.hexagon;
            break;
        case behaviourEnums.Chaos:
            return Behaviour.chaos;
            break;
        case behaviourEnums.Trapezoid:
            return Behaviour.trapezoid;
            break;
        case behaviourEnums.Parallelogram:
            return Behaviour.parallelogram;
            break;
    }
};

exports.Behaviour = new Behaviour();
