
(function(window) {
    Player = Wisp.getNewWisp();
    Player.playerCount = 0; //for player count on main menu etc.
    Player.playerCountCurrent = 0;
    Player.gameEnded = false;
    window.Player = Player;
})(window);
