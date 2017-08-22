(function(window) {
    //container for all units on the map
    Units = {
        members: null,

        init: function(){
            this.members = [];
        },
        
    }
    window.Units = Units;
})

(function(window) {
    Unit:  function(data){
        return {
            name: data.name
        }
    }
    window.Unit = Unit;
})