
(function(window) {
    Party = {
    	members: null,

    	init: function(){
            this.members = {};
    	},
    	
    	update: function(deltaTime){
    		for (var i in this.members){
                this.members[i].update(deltaTime);
            }
    	},

        draw: function(){
            for (var i in this.members){
                this.members[i].draw();
            }
        },

        addNewMember: function(data){
            var member = Wisp.getNewWisp();
            member.init(data);
            this.members[member.id] = member;
        },

        removeMember: function(data){
            //add dust
            console.log(data);
            var dustAmount = 50;
            for (var i = 0; i < dustAmount; i ++){
                Dust.addDust({
                    vector: [1,0],
                    pos: [this.members[data.id].loc.x,this.members[data.id].loc.y],
                    color: this.members[data.id].tint,
                    angle: 180
                })
            }
            //remove sprites
            Graphics.worldContainer.removeChild(this.members[data.id].player);
            //delete player
            delete this.members[data.id];
        }
    	
    }
    window.Party = Party;
})(window);
