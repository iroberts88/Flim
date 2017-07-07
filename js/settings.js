(function(window) {

//TODO put this into Acorn???

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
                    Acorn.Sound._sounds[i].volume = 0;
                }
            }
        },
        setSFXVolume: function(v){
            Settings.sfxVolume = v;
            if (Settings.mute){
                Settings.toggleMute();
            }else{
                for (var i = 0; i < Acorn.Sound._sounds.length;i++){
                    var snd = Acorn.Sound._sounds[i];
                    if (snd.type == 'sfx'){
                        snd.volume = snd.volumeBase*Settings.masterVolume*Settings.musicVolume;
                    }
                }
            }
        },
        setMusicVolume: function(v){
            Settings.musicVolume = v;
            if (Settings.mute){
                Settings.toggleMute();
            }else{
                for (var i = 0; i < Acorn.Sound._sounds.length;i++){
                    var snd = Acorn.Sound._sounds[i];
                    if (snd.type == 'music'){
                        snd.volume = snd.volumeBase*Settings.masterVolume*Settings.musicVolume;
                    }
                }
            }
        },
        setMasterVolume: function(v){
            Settings.masterVolume = v;
            if (Settings.mute){
                Settings.toggleMute();
            }else{
                Settings.setMusicVolume(Settings.musicVolume);
                Settings.setSFXVolume(Settings.sfxVolume);
            }
        }
    };
    
    Settings.init();

    window.Settings = Settings;
})(window);