
//Assign to enemies for Enemy AI

var Behaviour = function() {};

var behaviourEnums = {
    BasicMoveTowards: 'basicMoveTowards',
    Square: 'square',
    Square2: 'square2',
    Pentagon: 'pentagon',
    Pentagon2: 'pentagon2',
    Star: 'star',
    Chaos: 'chaos',
    Trapezoid: 'trapezoid',
    Parallelogram: 'parallelogram'
};

Behaviour.prototype.chaos = function(enemy, deltaTime, data){
    if (typeof data.colorShift == 'undefined'){
        data.colorShift = {
            r: 255,
            g: 0,
            b: 0,
            phase: 1,
            speed: 10.0
        };
    }
    enemy.speed = data.speed;
    Utils.colorShifter(data.colorShift);
    var c = '0x' + Utils.componentToHex(Math.round(data.colorShift.r)) + Utils.componentToHex(Math.round(data.colorShift.g)) + Utils.componentToHex(Math.round(data.colorShift.b));
    c = parseInt(c);
    enemy.sprite.tint = c;
    Behaviour.basicMoveTowards(enemy,deltaTime, data);
}

Behaviour.prototype.basicMoveTowards = function(enemy, deltaTime, data){
    if (typeof data.acceleration == 'undefined'){
        data.acceleration = new SAT.Vector(0,0);
    }
    if (typeof data.rotate == 'undefined'){
        data.rotate = true;
    }
    try{    
        var xDist;
        var yDist;
        var target;
        if (data.targetId == Player.id){
            target = Player;
        }else{
            for (var i in Party.members){
                if(data.targetId == Party.members[i].id){
                    target = Party.members[i];
                }
            }
        }
        if (!target.kill && target){
            xDist = target.loc.x - enemy.sprite.position.x;
            yDist = target.loc.y - enemy.sprite.position.y;
            if (!enemy.moveVector){
                enemy.moveVector = new SAT.Vector(0,0);
            }else{
                data.acceleration = new SAT.Vector(xDist,yDist).normalize();
                enemy.moveVector.x += data.acceleration.x*deltaTime*data.spring;
                enemy.moveVector.y += data.acceleration.y*deltaTime*data.spring;
                if (Math.sqrt(enemy.moveVector.x*enemy.moveVector.x + enemy.moveVector.y*enemy.moveVector.y) > 1){
                    enemy.moveVector.normalize();
                }
            }

            //point towards target
            var hyp = Math.sqrt(xDist*xDist+yDist*yDist);
            if (data.rotate){
                enemy.sprite.rotation = Math.atan2(yDist,xDist)+1.5;
            }
        }
    }catch(e){
        //console.log('Error with basic move behaviour');
        //console.log(e);
    }
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.pentagon = function(enemy, deltaTime, data){
    if (typeof data.colorShift == 'undefined'){
        data.colorShift = {
            r: 255,
            g: 0,
            b: 0,
            phase: 1,
            speed: 3.0
        };
    }
    Utils.colorShifter2(data.colorShift);
    var c = '0x' + Utils.componentToHex(Math.round(data.colorShift.r)) + Utils.componentToHex(Math.round(data.colorShift.g)) + Utils.componentToHex(Math.round(data.colorShift.b));
    parseInt(c);
    enemy.sprite.tint = c;

    try{
        var target;
        if (data.targetId == Player.id){
            target = Player;
        }else{
            for (var i in Party.members){
                if(data.targetId == Party.members[i].id){
                    target = Party.members[i]; 
                }
            }
        }
        var xDist;
        var yDist;
        if (!target.kill && target){
            xDist = target.loc.x - enemy.sprite.position.x;
            yDist = target.loc.y - enemy.sprite.position.y;
            if (!enemy.moveVector){
                enemy.moveVector = new SAT.Vector(0,0);
            }else{
                enemy.moveVector = new SAT.Vector(xDist,yDist).normalize();
            }
        }
    }catch(e){}
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.pentagon2 = function(enemy, deltaTime, data){
    if (typeof data.colorShift == 'undefined'){
        data.colorShift = {
            r: 255,
            g: 0,
            b: 0,
            phase: 1,
            speed: 3.0
        };
    }
    Utils.colorShifter2(data.colorShift);
    var c = '0x' + Utils.componentToHex(Math.round(data.colorShift.r)) + Utils.componentToHex(Math.round(data.colorShift.g)) + Utils.componentToHex(Math.round(data.colorShift.b));
    parseInt(c);
    enemy.sprite.tint = c;

    if (!enemy.moveVector){
        enemy.moveVector = new SAT.Vector(data.moveVec[0],data.moveVec[1]);
    }
    if (typeof data.ticker == 'undefined'){
        data.ticker = 0;
        enemy.active = false;
    }
    data.ticker += deltaTime;
    if (data.ticker > .5){
        enemy.canBeKilled = true;
        enemy.active = true;
        data.rotate = false;
        Behaviour.basicMoveTowards(enemy,deltaTime,data);
    }else{
        //move
        enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
        enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
        enemy.hitData.pos.x = enemy.sprite.position.x;
        enemy.hitData.pos.y = enemy.sprite.position.y;
    }
    
};

Behaviour.prototype.square = function(enemy, deltaTime, data){
    if (typeof data.alphaTicker == 'undefined'){
        data.alphaTicker = 0.0;
    }
    if (data.alphaTicker < 1){
        enemy.sprite.alpha = data.alphaTicker;
        enemy.active = false
    }else{
        enemy.active = true;
        data.alphaTicker = 1;
    }
    data.alphaTicker += (deltaTime/2);

    
    for (var i in Enemies.enemyList){
        var e = Enemies.enemyList[i];
        var kill = false;
        if (e.canBeKilled){
            //collide?
            if (SAT.testPolygonPolygon(enemy.hitData, e.hitData)){
                kill = true;
            }
        }
        if (kill){
            e.sprite.visible = false;
            Acorn.Net.socket_.emit('playerUpdate', {killedEnemy: e.id});
        }
    }
};

Behaviour.prototype.square2 = function(enemy, deltaTime, data){
    Behaviour.square(enemy, deltaTime, data);

    if (!enemy.moveVector){
        enemy.moveVector = new SAT.Vector(data.startMove[0] -enemy.sprite.position.x, data.startMove[1] -enemy.sprite.position.y).normalize();
    }
    if (typeof data.inPlay == 'undefined'){
        data.inPlay = false;
    }
    if (data.inPlay){
        var radius = 20;
        if (enemy.sprite.position.x < 0){
            enemy.sprite.position.x = 0;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.sprite.position.y < 0){
            enemy.sprite.position.y = 0;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
        if (enemy.sprite.position.x > 1920){
            enemy.sprite.position.x = 1920;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.sprite.position.y > 1080){
            enemy.sprite.position.y = 1080;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
    }else{
        if (enemy.sprite.position.x < 1920 && enemy.sprite.position.x >0 && enemy.sprite.position.y < 1080 && enemy.sprite.position.y > 0){
            data.inPlay = true;
        }
    }
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.star = function(enemy, deltaTime, data){
    if (!enemy.moveVector){
        enemy.moveVector = new SAT.Vector(data.startMove[0] -enemy.sprite.position.x, data.startMove[1] -enemy.sprite.position.y).normalize();
    }
    if (typeof data.inPlay == 'undefined'){
        data.inPlay = false;
    }
    if (typeof data.r == 'undefined'){
        data.r = 0.025 + Math.random()*0.05;
        if (Math.round(Math.random())){
            data.r = data.r * -1;
        }
    }
    if (data.inPlay){
        var radius = 20;
        if (enemy.sprite.position.x <= 0){
            enemy.sprite.position.x = 0;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.sprite.position.y <= 0){
            enemy.sprite.position.y = 0;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
        if (enemy.sprite.position.x >= 1920){
            enemy.sprite.position.x = 1920;
            enemy.moveVector.x = enemy.moveVector.x * -1;
        }
        if (enemy.sprite.position.y >= 1080){
            enemy.sprite.position.y = 1080;
            enemy.moveVector.y = enemy.moveVector.y * -1;
        }
    }else{
        if (enemy.sprite.position.x < 1920 && enemy.sprite.position.x >0 && enemy.sprite.position.y < 1080 && enemy.sprite.position.y > 0){
            data.inPlay = true;
        }
    }
    enemy.sprite.rotation += data.r;
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.trapezoid = function(enemy, deltaTime, data){
    if (typeof data.moving == 'undefined'){
        if (enemy.sprite.position.x <= 0){
            enemy.moveVector = new SAT.Vector(1,0);
            enemy.sprite.rotation = 1.57;
            data.moving = 'r';
        }else if (enemy.sprite.position.y <= 0){
            enemy.moveVector = new SAT.Vector(0,1);
            enemy.sprite.rotation = 3.14;
            data.moving = 'd';
        }else if (enemy.sprite.position.x >= 1920){
            enemy.moveVector = new SAT.Vector(-1,0);
            enemy.sprite.rotation = -1.57;
            data.moving = 'l';
        }else if (enemy.sprite.position.y >= 1080){
            enemy.moveVector = new SAT.Vector(0,-1);
            data.moving = 'u';
        }
    }else{
        if (data.moving == 'r'){
            if (enemy.sprite.position.x >= 32){
                enemy.sprite.position.x = 32;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'l'){
            if (enemy.sprite.position.x <= 1888){
                enemy.sprite.position.x = 1888;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'u'){
            if (enemy.sprite.position.y <= 1048){
                enemy.sprite.position.y = 1048;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }else if (data.moving == 'd'){
            if (enemy.sprite.position.y >= 32){
                enemy.sprite.position.y = 32;
                enemy.moveVector = new SAT.Vector(0,0);
            }
        }
    }
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.parallelogram = function(enemy, deltaTime, data){
    if (typeof data.moving == 'undefined'){
        if (enemy.sprite.position.x < 0){
            enemy.moveVector = new SAT.Vector(1,0);
            data.moving = 'r';
        }else if (enemy.sprite.position.y < 0){
            enemy.moveVector = new SAT.Vector(0,1);
            data.moving = 'd';
        }else if (enemy.sprite.position.x > 1920){
            enemy.moveVector = new SAT.Vector(-1,0);
            data.moving = 'l';
        }else if (enemy.sprite.position.y > 1080){
            enemy.moveVector = new SAT.Vector(0,-1);
            data.moving = 'u';
        }
    }
    //move
    enemy.sprite.position.x += enemy.speed * enemy.moveVector.x * deltaTime;
    enemy.sprite.position.y += enemy.speed * enemy.moveVector.y * deltaTime;
    enemy.hitData.pos.x = enemy.sprite.position.x;
    enemy.hitData.pos.y = enemy.sprite.position.y;
};

Behaviour.prototype.getBehaviour = function(actionStr){
    //return a behaviour based on passed id
    switch(actionStr) {
        case behaviourEnums.BasicMoveTowards:
            return Behaviour.basicMoveTowards;
            break;
        case behaviourEnums.Square:
            return Behaviour.square;
            break;
        case behaviourEnums.Square2:
            return Behaviour.square2;
            break;
        case behaviourEnums.Star:
            return Behaviour.star;
            break;
        case behaviourEnums.Pentagon:
            return Behaviour.pentagon;
            break;
        case behaviourEnums.Pentagon2:
            return Behaviour.pentagon2;
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

window.Behaviour = new Behaviour();