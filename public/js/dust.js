
(function(window) {
    Dust = {
    	dust: [],
    	speedMin: null,
    	speedMax: null,
        timeAliveMin: null,
        timeAliveMax: null,
    	dustSize: null,

    	init: function(){
    		this.speedMin = 200;
    		this.speedMax = 800;
    		this.dustSize = 10;
            this.timeAliveMin = .5;
            this.timeAliveMax = 1.5;
    	},
    	update: function(deltaTime){
    		//if targetMoveVector != moveVector, rotate
		    for (var i = 0; i < this.dust.length; i++){
		        var particle = this.dust[i];
		        particle.sprite.position.x += particle.moveVector.x*deltaTime*particle.speed;
		        particle.sprite.position.y += particle.moveVector.y*deltaTime*particle.speed;
		        particle.timeAlive -= deltaTime;
                if (particle.timeAlive <= 0){
                    particle.sprite.alpha = particle.sprite.alpha*0.98;
                    if (particle.sprite.alpha < 0.1){
                        Graphics.worldContainer.removeChild(particle.sprite);
                        this.dust.splice(i,1);
                        i -= 1;
                    }
                }
		    }
    	},
    	addDust: function(data){
            if (Settings.dust){
                if (typeof data.angle != 'undefined'){
                    var randomRotation = Math.random()*data.angle;
                }else{
                    var randomRotation = Math.random()*45;
                }
                if (Math.round(Math.random())){
                    randomRotation = randomRotation*-1;
                }
                var v = new SAT.Vector(data.vector[0],data.vector[1]).normalize();
                v.rotate((randomRotation*Math.PI)/180);
        		var dust = {
                    sprite: Graphics.getSprite('circle'),
                    moveVector: v,
                    position: new SAT.Vector(data.pos[0], data.pos[1]),
                    size: Math.ceil(Math.random()*this.dustSize),
                    speed: this.speedMin + Math.round(Math.random()*(this.speedMax-this.speedMin)),
                    timeAlive: this.timeAliveMin + Math.round(Math.random()*(this.timeAliveMax-this.timeAliveMin))
                }
                dust.sprite.position.x = dust.position.x;
                dust.sprite.position.y = dust.position.y;
                dust.sprite.anchor.x = 0.5;
                dust.sprite.anchor.y = 0.5;
                dust.sprite.scale.x = 4/64;
                dust.sprite.scale.y = 4/64;
                dust.sprite.tint = data.color;
                Graphics.worldContainer.addChild(dust.sprite);
                this.dust.push(dust);
            }
    	}
    }
    window.Dust = Dust;
})(window);
