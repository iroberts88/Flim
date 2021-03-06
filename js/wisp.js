
(function(window) {
    Wisp = {
        getNewWisp: function(){
            return {
                id: null,
                loc: null,
                mapLoc: null,
                targetLoc: null,
                scale: null,
                sprite: null,
                deltaTime: null,
                path: null,
                moved: null,
                maxPathLength: null,
                speed: null,
                //variables for movement
                xDistance: null,
                yDistance: null,
                hyp: null,
                move: null,
                actualMoveX: null,
                actualMoveY: null,
                actualMoveHyp: null,
                //
                sayBubble: null,
                warning: null,

                kill: null,
                    
                init: function(data) {
                    this.maxPathLength = 10;
                    this.kill = false;
                    if (typeof data.x != 'undefined'){
                        this.loc = new SAT.Vector(data.x,data.y);
                    }else{
                        this.loc = new SAT.Vector(Graphics.width/2,Graphics.height/2);
                    }
                    this.targetLoc = new SAT.Vector(this.loc.x, this.loc.y);
                    if (typeof data.id != 'undefined'){
                        this.id = data.id;
                    }
                    if (typeof data.speed != 'undefined'){
                        this.speed = data.speed;
                    }else{
                        this.speed = 1000;
                    }

                    this.rRotation = 0.067;
                    this.rDivider = 1.5;
                    this.rDividerDelta = 0.01;

                    this.path = [];
                    this.moved = false;
                    this.player = new PIXI.Container();
                    this.player.position.x = this.loc.x;
                    this.player.position.y = this.loc.y;
                    this.sprite = Graphics.getSprite('circle');
                    this.sprite.anchor.x = 0.5;
                    this.sprite.anchor.y = 0.5;
                    this.r1 = Graphics.getSprite('circle');
                    this.r1.anchor.x = 0.5;
                    this.r1.anchor.y = 0.5;
                    this.r2 = Graphics.getSprite('circle');
                    this.r2.anchor.x = 0.5;
                    this.r2.anchor.y = 0.5;

                    if (typeof data.radius != 'undefined'){
                        this.setScale(data.radius/30);
                    }else{
                        this.setScale(1);
                    }

                    this.player.addChild(this.sprite);
                    this.player.addChild(this.r1);
                    this.player.addChild(this.r2);
                    Graphics.worldContainer.addChild(this.player);
                },

                update: function(dt) {
                    if (!this.moved){
                        if (this.path.length > 0){
                            this.path.splice(0,1);
                        }
                    }else{
                        this.moved = false;
                    }
                    //Move closer to target Loc
                    //Move Closer to targetPosition
                    var x,y;
                    this.xDistance = this.targetLoc.x - this.loc.x;
                    this.yDistance = this.targetLoc.y - this.loc.y;
                    this.hyp = Math.sqrt(this.xDistance*this.xDistance + this.yDistance*this.yDistance);
                    this.move = new SAT.Vector(this.xDistance/this.hyp,this.yDistance/this.hyp);
                    this.actualMoveX = this.move.x*this.speed*dt;
                    this.actualMoveY = this.move.y*this.speed*dt;
                    this.actualMoveHyp = Math.sqrt(this.actualMoveX*this.actualMoveX + this.actualMoveY*this.actualMoveY);
                    if (this.hyp < this.actualMoveHyp){
                        x = this.targetLoc.x;
                        y = this.targetLoc.y;
                    }else{
                        x = this.loc.x + this.actualMoveX;
                        y = this.loc.y + this.actualMoveY;
                        this.moved = true;
                    }
                    this.path.push([x,y]);
                    this.player.position.x = x;
                    this.player.position.y = y;
                    this.r1.scale.x = this.scale;
                    this.r1.scale.y = this.scale/this.rDivider;
                    this.r2.scale.x = this.scale;
                    this.r2.scale.y = this.scale/this.rDivider;
                    this.loc = new SAT.Vector(x,y);
                    if (this.path.length > this.maxPathLength){
                        this.path.splice(0,1);
                    }

                    this.r1.rotation -= this.rRotation;
                    this.r2.rotation += this.rRotation;
                    this.rDivider += this.rDividerDelta;
                    this.r1.scale.y = this.scale/this.rDivider;
                    this.r2.scale.y = this.scale/this.rDivider;
                    if (this.rDivider <= 1.5 || this.rDivider >= 3){
                        this.rDividerDelta = this.rDividerDelta*-1;
                    }

                    if (this.sayBubble){
                        this.sayBubble.text.position.x = this.loc.x + this.radius + 30;
                        this.sayBubble.text.position.y = this.loc.y - this.radius - 30;
                        this.sayBubble.time -= dt;
                        if (this.sayBubble.time <= 0){
                            Graphics.worldContainer.removeChild(this.sayBubble.text);
                            this.sayBubble = null;
                        }
                    }
                    if (this.warning){
                        this.warning.time -= dt;
                        this.warning.text.text = Math.ceil(this.warning.time);
                        if (this.warning.time <= 0){
                            Graphics.worldContainer.removeChild(this.warning.text);
                            Graphics.worldContainer.removeChild(this.warning.lText);
                            this.warning = null;
                        }
                    }
                },

                draw: function(){
                    try{
                        var xDist = this.path[0][0] - this.loc.x;
                        var yDist = this.path[0][1] - this.loc.y;
                        var hyp = Math.sqrt(xDist*xDist+yDist*yDist);
                        if (this.path.length > 1 && (hyp > this.radius)){
                            var newVec = new SAT.Vector((this.path[this.path.length-1][0] - this.path[this.path.length-2][0]),
                                                        this.path[this.path.length-1][1] - this.path[this.path.length-2][1])
                            newVec.rotate(-1.5708);
                            newVec.normalize();
                            var start = [this.loc.x+(this.radius*newVec.x),this.loc.y+(this.radius*newVec.y)];
                            newVec.rotate(3.14);
                            var end = [this.loc.x+(this.radius*newVec.x),this.loc.y+(this.radius*newVec.y)];
                            Graphics.worldPrimitives.lineStyle(1,0xFFFFFF,.3); 
                            Graphics.worldPrimitives.beginFill(0xffffff, .3);
                            Graphics.worldPrimitives.moveTo(start[0], start[1]);
                            for (var i = this.path.length-2; i >=0; i--){
                                var newVec = new SAT.Vector((this.path[i][0] - this.path[i+1][0]),
                                                        this.path[i][1] - this.path[i+1][1])
                                newVec.rotate(1.5708);
                                newVec.normalize();
                                Graphics.worldPrimitives.lineTo(this.path[i][0]+(Math.ceil(this.radius*(1/this.path.length)*i)*newVec.x), 
                                                            this.path[i][1]+(Math.ceil(this.radius*(1/this.path.length)*i)*newVec.y));
                            }

                            for (var i = 1; i <this.path.length-1; i++){
                                var newVec = new SAT.Vector((this.path[i][0] - this.path[i-1][0]),
                                                        this.path[i][1] - this.path[i-1][1])
                                newVec.rotate(1.5708);
                                newVec.normalize();
                                Graphics.worldPrimitives.lineTo(this.path[i][0]+(Math.ceil(this.radius*(1/this.path.length)*i)*newVec.x), 
                                                            this.path[i][1]+(Math.ceil(this.radius*(1/this.path.length)*i)*newVec.y));
                            }

                            Graphics.worldPrimitives.lineTo(end[0], end[1]);
                            Graphics.worldPrimitives.lineTo(start[0], start[1]);
                            Graphics.worldPrimitives.endFill();
                        }
                    }catch(e){
                    }
                    if (this.sayBubble){
                        var t = this.sayBubble.text;
                        Graphics.worldPrimitives.lineStyle(3,0xFFFFFF,1); 
                        Graphics.worldPrimitives.moveTo(t.position.x - 10, t.position.y - t.height - 10);
                        Graphics.worldPrimitives.lineTo(t.position.x + t.width + 10, t.position.y - t.height - 10);
                        Graphics.worldPrimitives.lineTo(t.position.x + t.width + 10, t.position.y + 10);
                        Graphics.worldPrimitives.lineTo(t.position.x + t.width/3, t.position.y + 10);
                        Graphics.worldPrimitives.lineTo(t.position.x - 10, t.position.y +30);
                        Graphics.worldPrimitives.lineTo(t.position.x + t.width/8, t.position.y + 10);
                        Graphics.worldPrimitives.lineTo(t.position.x - 10, t.position.y + 10);
                        Graphics.worldPrimitives.lineTo(t.position.x - 10, t.position.y - t.height - 10);
                    }
                },

                updateLoc: function(x,y){
                    this.moved = true;
                    this.targetLoc.x = x;
                    this.targetLoc.y = y;
                },

                setScale: function(s){
                    this.scale = s;
                    this.diameter = 64*this.scale;
                    this.radius = this.diameter/2;
                    this.sprite.scale.x = this.scale;
                    this.sprite.scale.y = this.scale;
                    this.r1.scale.x = this.scale;
                    this.r1.scale.y = this.scale/this.rDivider;
                    this.r2.scale.x = this.scale;
                    this.r2.scale.y = this.scale/this.rDivider;
                },
                getScale: function(){
                    return this.scale;
                },

                setDeltaTime: function(dt){
                    this.deltaTime = dt;
                },

                addSayBubble: function(text){
                    if (this.sayBubble){
                        Graphics.worldContainer.removeChild(this.sayBubble.text);
                        this.sayBubble = null;
                    }
                    var newText = new PIXI.Text(text,{font:"32px Electrolize", fill:'white',wordWrap: true, wordWrapWidth: 200});
                    newText.anchor.x = 0;
                    newText.anchor.y = 1.0;
                    newText.position.x = this.loc.x + this.radius + 30;
                    newText.position.y = this.loc.y - this.radius - 30;
                    Graphics.worldContainer.addChild(newText);
                    this.sayBubble = {
                        time: 5.0,
                        text: newText
                    }
                },

                addWarning: function(time, level){

                    if (this.warning){
                        Graphics.worldContainer.removeChild(this.warning.text);
                        Graphics.worldContainer.removeChild(this.warning.lText);
                        this.warning = null;
                    }
                    var newText = new PIXI.Text(''+time,{font:"50px Electrolize", fill:'red'});
                    newText.anchor.x = 0.5;
                    newText.anchor.y = 0;
                    newText.position.x = Graphics.width/2;
                    newText.position.y = Graphics.height/3;
                    newText.alpha = 0.5;
                    Graphics.worldContainer.addChild(newText);
                    var newText2 = new PIXI.Text('level '+level,{font:"50px Electrolize", fill:'red'});
                    newText2.anchor.x = 0.5;
                    newText2.anchor.y = 0;
                    newText2.position.x = Graphics.width/2;
                    newText2.position.y = Graphics.height/3 - 70;
                    newText2.alpha = 0.5;
                    Graphics.worldContainer.addChild(newText2);
                    this.warning = {
                        time: time,
                        text: newText,
                        lText: newText2
                    }
                }
            }
        }
    }
    window.Wisp = Wisp;
})(window);
