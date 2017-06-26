//Enemies

(function(window) {

    Enemies = {
        enemyList: null,

        init: function() {
            this.enemyList = {};
        },
        update: function(dt){
            for(var i in this.enemyList){
                var enemy = this.enemyList[i];
                var B = Behaviour.getBehaviour(enemy.behaviour.name);
                B(enemy, dt, enemy.behaviour);
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
                    newEnemy.speed = 400;
                    newEnemy.behaviour = data.behaviour;
                    newEnemy.sprite = Graphics.getSprite('circle');
                    newEnemy.sprite.scale.x = (16/64);
                    newEnemy.sprite.scale.y = (16/64);
                    newEnemy.sprite.anchor.x = 0.5;
                    newEnemy.sprite.anchor.y = 0.5;
                    newEnemy.sprite.position.x = data.x;
                    newEnemy.sprite.position.y = data.y;
                    newEnemy.sprite.tint = 0x0000FF;
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
                    newEnemy.speed = 800;
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
                    newEnemy.sprite.tint = 0x8C8C8C;
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
                    //trapezoid
                    newEnemy.speed = 250;
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
            }
            Graphics.worldContainer.addChild(newEnemy.sprite);
            this.enemyList[newEnemy.id] = newEnemy;
        },

        killEnemy: function(id){
            try{
                Graphics.worldContainer.removeChild(this.enemyList[id].sprite);
                var dustAmount = Math.ceil(Math.random()*10) + 10;
                for (var i = 0; i < dustAmount; i ++){
                    var vec = [this.enemyList[id].moveVector.x,this.enemyList[id].moveVector.y];
                    var angle = 45;
                    if (this.enemyList[id].moveVector.x + this.enemyList[id].moveVector.x == 0 || this.enemyList[id].type == 'par'){
                        vec = [1,0];
                        angle = 180;
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

