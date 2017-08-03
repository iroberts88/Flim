
(function(window) {
    Player = Wisp.getNewWisp();
    Player.playerCount = 0; //for player count on main menu etc.
    Player.playerCountCurrent = 0;
    Player.gameEnded = false;
    Player.pingTime = 0;
    Player.userData = null;
    Player.highScores = null;
    Player.mouseLoc = [0,0];
    window.Player = Player;
})(window);
