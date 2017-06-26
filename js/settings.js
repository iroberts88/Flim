(function(window) {

    Settings = {
        scaleToFit: null,
        viewBumpSpeed: null,
        oldViewBump: null,
        globalTint: null,
        textPop: null, 
        textPopFont: null,
        textPopColor: null,
        textPopBGColor: null,
        damageText: null, 
        damageTextFont: null,
        aimHelper: null,
        mute: null,
        masterVolume: null,
        musicVolume: null,
        sfxVolume: null, 
        

        init: function() {
        	//Working
            this.scaleToFit = false; //scale to fit screen size
            this.viewBumpSpeed = 60; //set to 0 to turn off
            this.oldViewBump = this.viewBumpSpeed; //save old speed when toggling
            this.mute = false;
            this.masterVolume = 1.0;
            this.musicVolume = 1.0;
            this.sfxVolume = 1.0;

            //TODO
            this.globalTint = null;
            this.textPop = true; //toggle textPop on and off
	        this.textPopFont = null;
	        this.textPopColor = null;
	        this.textPopBGColor = null;
	        this.damageText = null; //toggle damageText on and off
            this.nameDisplay = 'all'; //how to display names? allays on / always off / mouseover
	        this.damageTextFont = null;
	        this.aimHelper = false; //toggle aim helper on and off
        },
        toggleViewBump: function(){
        	if (this.viewBumpSpeed > 0){
        		//turn it off
        		this.oldViewBump = this.viewBumpSpeed;
        		this.viewBumpSpeed = 0;
        		Map.currentViewBump.x = 0;
        		Map.currentViewBump.y = 0;
        	}else{
        		this.viewBumpSpeed = this.oldViewBump;
        	}
        },
        toggleScaleToFit: function(){
            if (this.scaleToFit){
                this.scaleToFit = false;
            }else{
                this.scaleToFit = true;
            }
            Graphics.resize();
        },
        toggleMute: function(){
            if (this.mute){
                this.mute = false;
                this.setMasterVolume(this.masterVolume);
            }else{
                this.mute = true;
                for (var i = 0; i < Acorn.Sound._sounds.length;i++){
                    var snd = Acorn.Sound._sounds[i];
                    if (snd.multi){
                        for(var j = 0; j < snd._sound.length; j++) {
                            snd._sound[j].volume = 0;
                        }
                    }else{
                        snd._sound.volume = 0;
                    }
                }
            }
        },
        setSFXVolume: function(v){
            this.sfxVolume = v;
            if (this.mute){
                this.toggleMute();
            }else{
                for (var i = 0; i < Acorn.Sound._sounds.length;i++){
                    var snd = Acorn.Sound._sounds[i];
                    if (snd.type == 'sfx'){
                        if (snd.multi){
                             for(var j = 0; j < snd._sound.length; j++) {
                                snd._sound[j].volume = snd.volume*Settings.masterVolume*this.sfxVolume;
                            }
                        }else{
                            snd._sound.volume = snd.volume*Settings.masterVolume*this.sfxVolume;
                        }
                    }
                }
            }
        },
        setMusicVolume: function(v){
            this.musicVolume = v;
            if (this.mute){
                this.toggleMute();
            }else{
                for (var i = 0; i < Acorn.Sound._sounds.length;i++){
                    var snd = Acorn.Sound._sounds[i];
                    if (snd.type == 'music'){
                        if (snd.multi){
                            for(var j = 0; j < snd._sound.length; j++) {
                                snd._sound[j].volume = snd.volume*Settings.masterVolume*this.musicVolume;
                            }
                        }else{
                            snd._sound.volume = snd.volume*Settings.masterVolume*this.musicVolume;
                        }
                    }
                }
            }
        },
        setMasterVolume: function(v){
            this.masterVolume = v;
            if (this.mute){
                this.toggleMute();
            }else{
                this.setMusicVolume(this.musicVolume);
                this.setSFXVolume(this.sfxVolume);
            }
        }
    };
    
    Settings.init();

    window.Settings = Settings;
})(window);