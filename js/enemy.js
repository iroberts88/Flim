//Enemies

(function(window) {

    Enemies = {
        enemyList: null,
        triSize: null,
        init: function() {
            this.enemyList = {};
            this.triSize = 32;
        },
        update: function(dt){
            for(var i in this.enemyList){
                var enemy = this.enemyList[i];
                //red triangle visible if enemy is outside map?
                if (enemy.type != 'par'){
                    if (enemy.sprite.position.y < -20){
                        enemy.outsideScreenTri.alpha = 1;
                        enemy.outsideScreenTri.position.x = enemy.sprite.position.x;
                        enemy.outsideScreenTri.position.y = this.triSize/2;
                        enemy.outsideScreenTri.rotation = 0;
                    }else if (enemy.sprite.position.y > Graphics.height+20){
                        enemy.outsideScreenTri.alpha = 1;
                        enemy.outsideScreenTri.position.x = enemy.sprite.position.x;
                        enemy.outsideScreenTri.position.y = Graphics.height - this.triSize/2;
                        enemy.outsideScreenTri.rotation = 3.14;
                    }else if(enemy.sprite.position.x < -20){
                        enemy.outsideScreenTri.alpha = 1;
                        enemy.outsideScreenTri.position.x = this.triSize/2;
                        enemy.outsideScreenTri.position.y = enemy.sprite.position.y;
                        enemy.outsideScreenTri.rotation = -1.5708;
                    }else if(enemy.sprite.position.x > Graphics.width +20){
                        enemy.outsideScreenTri.alpha = 1;
                        enemy.outsideScreenTri.position.x = Graphics.width- this.triSize/2;
                        enemy.outsideScreenTri.position.y = enemy.sprite.position.y;
                        enemy.outsideScreenTri.rotation = 1.5708;
                    }else{
                        enemy.outsideScreenTri.alpha = 0;
                    }
                }
                Enemies.onScreen(enemy.outsideScreenTri,enemy.sprite);
                enemy.bFunc(enemy, dt, enemy.behaviour);
            }
        },
        onScreen: function(triangle,sprite){
            if (sprite.position.x < this.triSize/2 && sprite.position.y < this.triSize/2){
                triangle.position.x = this.triSize/2;
                triangle.position.y = this.triSize/2;
                triangle.rotation = -0.785398;
            }else if (sprite.position.x < this.triSize/2 && sprite.position.y > Graphics.height - this.triSize/2){
                triangle.position.x = this.triSize/2;
                triangle.position.y = Graphics.height -this.triSize/2;
                triangle.rotation = -2.35619;
            }else if (sprite.position.x > Graphics.width - this.triSize/2 && sprite.position.y >Graphics.height - this.triSize/2){
                triangle.position.x = Graphics.width - this.triSize/2;
                triangle.position.y = Graphics.height - this.triSize/2;
                triangle.rotation = 2.35619;
            }else if (sprite.position.x > Graphics.width - this.triSize/2  && sprite.position.y < this.triSize/2){
                triangle.position.x = Graphics.width - this.triSize/2 ;
                triangle.position.y = this.triSize/2;
                triangle.rotation = 0.785398;
            }
        },
        alterEnemy: function(data){
          
        },
        addEnemy: function(data){
           var newEnemy = {id: data.id,type: data.type};
           switch(data.type){
                case "chaos":
                    //????
                    newEnemy.speed = 0;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('circle');
                    newEnemy.sprite.scale.x = (20/64);
                    newEnemy.sprite.scale.y = (20/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFFFFFF;
                    break;
                case "star":
                    //bouncing star
                    newEnemy.speed = 450;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('star');
                    newEnemy.sprite.scale.x = (48/64);
                    newEnemy.sprite.scale.y = (48/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x00FFFF;
                    break;
                case "hex":
                    //hexagon
                    newEnemy.speed = 800;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('hexagon');
                    newEnemy.sprite.scale.x = (48/64);
                    newEnemy.sprite.scale.y = (48/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFFFF00;
                    break;
                case "tri":
                    //triangle
                    newEnemy.speed = 700;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('triangle');
                    newEnemy.sprite.scale.x = (48/64);
                    newEnemy.sprite.scale.y = 1;
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x990099;
                    break;
                case "c1":
                    //slow circle
                    newEnemy.speed = 450;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('circle');
                    newEnemy.sprite.scale.x = (16/64);
                    newEnemy.sprite.scale.y = (16/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x42a7f4;
                    break;
                case "c2":
                    //med circle
                    newEnemy.speed = 600;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('circle');
                    newEnemy.sprite.scale.x = (16/64);
                    newEnemy.sprite.scale.y = (16/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x00FF00;
                    break;
                case "c3":
                    //fast circle
                    newEnemy.speed = 750;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('circle');
                    newEnemy.sprite.scale.x = (16/64);
                    newEnemy.sprite.scale.y = (16/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFF0000;
                    break;
                case "sq":
                    //square
                    newEnemy.speed = 0;
                    newEnemy.behaviour = {name: 'square'};
                    newEnemy.sprite = Graphics.getSprite('square');
                    newEnemy.sprite.scale.x = (60/64);
                    newEnemy.sprite.scale.y = (60/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xc0c6d1;
                    break;
                case "sq2":
                    //square2
                    newEnemy.speed = 150;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('square');
                    newEnemy.sprite.scale.x = (60/64);
                    newEnemy.sprite.scale.y = (60/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xc0c6d1;
                    break;
                case "trap":
                    //trapezoid
                    newEnemy.speed = 100;
                    newEnemy.behaviour = {name: 'trapezoid'};
                    newEnemy.sprite = Graphics.getSprite('trapezoid');
                    newEnemy.sprite.scale.x = 1;
                    newEnemy.sprite.scale.y = 1;
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xffad33;
                    break;
                case "par":
                    //parallelogram
                    newEnemy.speed = 200;
                    newEnemy.behaviour = {name: 'parallelogram'};
                    newEnemy.sprite = Graphics.getSprite('parallelogram');
                    newEnemy.sprite.scale.x = 2;
                    newEnemy.sprite.scale.y = 2;
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x993333;
                    break;
                case "pent":
                    //pentagon
                    newEnemy.speed = 500;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('pentagon');
                    newEnemy.sprite.scale.x = (48/64);
                    newEnemy.sprite.scale.y = (48/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFFFFFF;
                    break;
                case "pent2":
                    //pentagon2
                    newEnemy.speed = 450;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('pentagon');
                    newEnemy.sprite.scale.x = (32/64);
                    newEnemy.sprite.scale.y = (32/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFFFFFF;
                    break;
                case "pent3":
                    //pentagon3
                    newEnemy.speed = 400;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('pentagon');
                    newEnemy.sprite.scale.x = (16/64);
                    newEnemy.sprite.scale.y = (16/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0xFFFFFF;
                    break;
            }
            newEnemy.outsideScreenTri = Graphics.getSprite('triangle');
            newEnemy.outsideScreenTri.scale.x = this.triSize/64;
            newEnemy.outsideScreenTri.scale.y = this.triSize/64;
            newEnemy.outsideScreenTri.anchor.x = 0.5;
            newEnemy.outsideScreenTri.anchor.y = 0.5;
            newEnemy.outsideScreenTri.tint = 0xFF0000;
            newEnemy.outsideScreenTri.alpha = 0;
            newEnemy.bFunc = Behaviour.getBehaviour(newEnemy.behaviour.name);
            Graphics.worldContainer.addChild(newEnemy.sprite);
            Graphics.worldContainer.addChild(newEnemy.outsideScreenTri);
            this.enemyList[newEnemy.id] = newEnemy;
        },

        killEnemy: function(id){
            try{
                Graphics.worldContainer.removeChild(this.enemyList[id].sprite);
                Graphics.worldContainer.removeChild(this.enemyList[id].outsideScreenTri);
                var dustAmount = Math.ceil(Math.random()*5) + 5;
                for (var i = 0; i < dustAmount; i ++){
                    if (this.enemyList[id].type == 'sq' || this.enemyList[id].type == 'par' || this.enemyList[id].type == 'trap'){
                        var vec = [1,0];
                        var angle = 180;
                    }else{
                        var vec = [this.enemyList[id].moveVector.x,this.enemyList[id].moveVector.y];
                        var angle = 45;
                    }
                    Dust.addDust({
                        vector: vec,
                        pos: [this.enemyList[id].sprite.position.x,this.enemyList[id].sprite.position.y],
                        color: this.enemyList[id].sprite.tint,
                        angle: angle
                    })
                }
                delete this.enemyList[id];
            }catch(e){
                console.log('failed to remove enemy');
                console.log(e);
            }
        }
        
    };
    
    window.Enemies = Enemies;
})(window);

