(function(window) {

    Graphics = {
        stage: null,
        renderer: null,
        width: null,
        height: null,
        loader: null,
        resources: null,
        resourcesReady: null,
        colorShift: null,
        


        init: function(w,h) {

            this.colorShift = {
                r: 255,
                g: 0,
                b: 0,
                phase: 1,
                speed: 0.05
            }
            this.width = w;
            this.height = h;
            this.diameter = Math.sqrt(w*w+h*h);

            //create the PIXI stage
            this.stage = new PIXI.Container();
            this.stage.interactive = true;
            this.filtersToApply = [];

            //create PIXI renderer
            this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {autoResize: true});
            this.renderer.view.style.cursor = "none";
            this.renderer.view.style.margin = 'auto';
            this.renderer.view.style.display = 'block';
            this.renderer.view.style.padding = 0;
            this.ratio = this.width/this.height;
            this.baseWidth = this.width;
            this.baseHeight = this.height;
            this.actualRatio = [1,1]; //for screen scaling

            this.world = new PIXI.Container();
            this.ui = new PIXI.Container();

            this.stage.addChild(this.world);
            this.stage.addChild(this.ui);

            // Show loading message while waiting
            this.showLoadingMessage(true);

            this.bgContainer = new PIXI.Graphics();
            this.bgContainer.position.x = 0;
            this.bgContainer.position.y = 0;
            this.drawBG();
            this.world.addChild(this.bgContainer); //ADD BG CONTAINER
            this.worldContainer = new PIXI.Container();
            this.worldContainer.position.x = 0;
            this.worldContainer.position.y = 0;
            this.world.addChild(this.worldContainer); // ADD WORLD CONTAINER
            this.worldPrimitives = new PIXI.Graphics();
            this.world.addChild(this.worldPrimitives); //ADD WORLD PRIMS (Cleared on update);
            this.uiContainer = new PIXI.Container();
            this.uiContainer.position.x = 0;
            this.uiContainer.position.y = 0;
            this.ui.addChild(this.uiContainer); //ADD UI CONTAINER
            this.uiPrimitives = new PIXI.Graphics();
            this.ui.addChild(this.uiPrimitives); // ADD UI PRIMS
            this.consoleContainer = new PIXI.Container();
            this.consoleContainer.position.x = 0;
            this.consoleContainer.position.y = 0;
            this.ui.addChild(this.consoleContainer); //ADD CONSOLE CONTAINER

            this.resources = {};
            this.resourcesReady = false;
            this.animationSpeeds = {};
        },

        drawBG: function(){
            this.bgContainer.beginFill(0x000000,1);
            this.bgContainer.drawRect(0,0,this.width,this.height);
            this.bgContainer.endFill();
        },
        clear: function(){
            this.bgContainer.clear();
            this.worldContainer.removeChildren();
            this.worldPrimitives.clear();
            this.uiContainer.removeChildren();
            this.uiPrimitives.clear();
            this.consoleContainer.removeChildren();
            this.drawBG();
            ChatConsole.reset();
        },

        resize: function(){
            var offset = 25;
            var w;
            var h;
            if (Settings.scaleToFit){
                h = screen.availHeight - offset;
                w = screen.availWidth - offset;
            }else{
                if (screen.availWidth/screen.availHeight > this.width/this.height){
                    h = screen.availHeight - offset;
                    w = screen.availHeight * (this.width/this.height) - offset;
                }else{
                    w = screen.availWidth - offset;
                    h = screen.availWidth * (this.height/this.width) - offset;
                }
            }
            this.renderer.view.style.width = w + 'px';
            this.renderer.view.style.height = h + 'px';
            this.actualRatio = [w/this.baseWidth,h/this.baseHeight];
        },
        startLoad: function(){
            PIXI.loader.add('img/sheet1.json'); //.on('progress', onProgressCallback)
            console.log(PIXI.loader)
            PIXI.loader.once('complete',Graphics.onAssetsLoaded)
            .load(function (loader, resources) {
                Graphics.loadResources();
            });
        },
        onAssetsLoaded: function(){
            if(Graphics.onReady) {
                Graphics.onReady();
            }
        },
        showLoadingMessage: function(display, message) {
            if(display) {
                this.loadingMessage = new PIXI.Text((message ? message : 'Loading...' ), {font: '35px Arial', fill: 'white', align: 'left'});
                this.loadingMessage.position.x = (this.width / 2) - 100;
                this.loadingMessage.position.y = (this.height / 2);
                this.stage.addChild(this.loadingMessage);
            } else {
                this.stage.removeChild(this.loadingMessage)
                this.loadingMessage = null;
            }
            this.renderer.render(this.stage);
        },

        loadResources: function() {
            console.log("loading resources....");

            //Load all movie clips
            var animations = [
            ];
            Graphics.animationSpeeds = {
            };

            //add all movie clips to resources
            for (var j = 0; j < animations.length; j += 2){
                var animTextures = [];
                for (var i=0; i < animations[j+1]; i++){
                    var texture = PIXI.Texture.fromFrame(animations[j] + (i+1) + ".png");
                    animTextures.push(texture);
                };
                Graphics.resources[animations[j]] = animTextures;


            }

            //Load all textures
            var textures = [
                'circle',
                'heart',
                'star',
                'square',
                'triangle',
                'hexagon',
                'trapezoid',
                'parallelogram'
            ];

            //add all textures to resources
            for(var i = 0; i < textures.length; i++) {
                var texture = PIXI.Texture.fromFrame(textures[i] + ".png");
                Graphics.resources[textures[i]] = texture;
            }
        },
        getResource: function(id){
            //returns a PIXI extras.MovieClip or a PIXI Texture from the Graphics.resources array

            //TODO (REMOVE) for debugging item ID's, log item id errors
            if (typeof Graphics.resources[id] === 'undefined'){
                console.log(id);
                console.log('-- Graphics resource not found' )
                return Graphics.resources['m_heart'];
            }else{
                return Graphics.resources[id];
            }
        },
        onReady: function(callback) {
            Graphics.onReady = callback;
        },
		getSprite: function(id){
            try{
    			var t = this.getResource(id);
    			if (t.constructor === Array){
    				var s = new PIXI.extras.MovieClip(t);
    			}else{
    				var s = new PIXI.Sprite(t);
    			}
    			s.shader = this.renderer.plugins.sprite.shader;
    			return s;
            }catch(e){
                console.log('-- Graphics resource not found' )
            }
		},
        drawBoxAround: function(sprite,g, ybuffer){
            //draws a box around sprite in
            //g = graphics container
            if (typeof ybuffer == 'undefined'){
                ybuffer = 0;
            }
            Utils.colorShifter(this.colorShift);
            var c = '0x' + Utils.componentToHex(Math.round(this.colorShift.r)) + Utils.componentToHex(Math.round(this.colorShift.g)) + Utils.componentToHex(Math.round(this.colorShift.b));
            parseInt(c);
            g.lineStyle(2,c,1);
            g.moveTo(sprite.position.x - sprite.width/2,sprite.position.y - sprite.height/2 + ybuffer);
            g.lineTo(sprite.position.x + sprite.width/2,sprite.position.y - sprite.height/2 + ybuffer);
            g.lineTo(sprite.position.x + sprite.width/2,sprite.position.y + sprite.height/2 - ybuffer);
            g.lineTo(sprite.position.x - sprite.width/2,sprite.position.y + sprite.height/2 - ybuffer);
            g.lineTo(sprite.position.x - sprite.width/2,sprite.position.y - sprite.height/2 + ybuffer);
        }
    };

    window.Graphics = Graphics;
})(window);
