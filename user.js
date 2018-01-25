//----------------------------------------------------------------
//user.js
//container for user info
//----------------------------------------------------------------

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

function User() {
    
    return {
        userData: null,
        owner: null,
        stats: null,
        init: function(d){
            this.userData = {
                username: 'guest',
                password: 'guest',
                chatLog: [],
                admin: false,
                createDate: new Date().toJSON(),
                lastLogin: new Date().toJSON(),
                loggedin: false
            };
            
            this.stats = {
                soloGamesPlayed : 0,
                coopGamesPlayed : 0,
                coopLevelRecord: 0,
                vsGamesPlayed : 0,
                starsGamesPlayed : 0,
                soloHighScore : 0,
                coopHighScore : 0,
                vsGamesWon : 0,
                starsLongestGame : 0,
                soloLevelRecord : 0
            }

            if (d.guest){
                this.owner.gameEngine.queuePlayer(this.owner,"loggedIn", {name:this.userData.username,stats:this.stats});
                return;
            }
            if (typeof d.username != 'undefined'){
                this.userData.username = d.username;
                this.userData.password = d.password;
                this.userData.chatLog = d.chatLog;
                this.userData.admin = d.admin;
                this.userData.createDate = d.createDate;
                try{
                    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                    var params = {
                        TableName: 'wisp_userdata',
                        Key: {
                            username: this.userData.username
                        }
                    }
                    var that = this;
                    docClient.get(params, function(err, data) {
                        if (err) {
                            console.error("Unable to find user data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            try{
                                console.log(data);
                                if (typeof data.Item != 'undefined'){
                                    that.stats = data.Item.stats
                                }
                                that.owner.gameEngine.queuePlayer(that.owner,"loggedIn", {name:that.userData.username,stats:that.stats});
                            }catch(e){
                                console.error(e);
                                console.error("userdata set empty.");
                            }
                        }
                    });
                }catch(e){}
            }
        },
        
        soloGamePlayed: function(){
            var ge = this.owner.gameEngine;
            this.stats.soloGamesPlayed += 1;
        },
        coopGamePlayed: function(){
            var ge = this.owner.gameEngine;
            this.stats.coopGamesPlayed += 1;
        },
        vsGamePlayed: function(){
            var ge = this.owner.gameEngine;
            this.stats.vsGamesPlayed += 1;
        },
        starGamePlayed: function(){
            var ge = this.owner.gameEngine;
            this.stats.starsGamesPlayed += 1;
        },
        vsGameWon: function(){
            var ge = this.owner.gameEngine;
            this.stats.vsGamesWon += 1;
        },
        checkSoloHighScore: function(s){
            //check personal high score
            var ge = this.owner.gameEngine;
            if (this.stats.soloHighScore < s){
                this.stats.soloHighScore = s;
            }
            //then check global high score
        },
        checkCoopHighScore: function(s){
            var ge = this.owner.gameEngine;
            if (this.stats.coopHighScore < s){
                this.stats.coopHighScore = s;
            }
        },
        checkCoopLevelRecord: function(s){
            var ge = this.owner.gameEngine;
            if (this.stats.coopLevelRecord < s){
                this.stats.coopLevelRecord = s;
            }
        },
        checkStarsLongestGame: function(s){
            if (this.stats.starsLongestGame < s){
                this.stats.starsLongestGame = s;
            }
        },
        checkSoloLevelRecord: function(s){
            var ge = this.owner.gameEngine;
            if (this.stats.soloLevelRecord < s){
                this.stats.soloLevelRecord = s;
            }
        },
        addToChatLog: function(str){
            var ge = this.owner.gameEngine;
            if (this.userData.username != 'guest'){
                this.userData.chatLog.push(str);
                this.chatLog.push(str);
            }
        },
        setLastLogin: function(t){
            var ge = this.owner.gameEngine;
            if (this.userData.username != 'guest'){
                //Player is not a guest - update last login Time
                this.userData.lastLogin = t;
                this.lastLogin = t;
            }
        },

        lock: function(){
            var ge = this.owner.gameEngine;
            this.userData.loggedin = true;
            if (this.userData.username != 'guest'){
                ge.users[ge._userIndex[this.userData.username]].loggedin = true;
                try{
                    var d = this.userData;
                    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                    var params = {
                        TableName: 'users',
                        Key:{username: d.username},
                        UpdateExpression: "set loggedin = :bool",
                        ExpressionAttributeValues: {
                            ":bool": true
                        }
                    }
                    docClient.update(params, function(err, data) {
                        if (err) {
                            console.error("Unable to Lock. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Update loggedin->true succeeded:", JSON.stringify(data, null, 2));
                        }
                    });
                }catch(e){
                    console.log("DB ERROR - Unable lock user");
                    console.log(e);
                }
            }
        },
        unlock: function(){
            var ge = this.owner.gameEngine;
            this.userData.loggedin = false;
            if (this.userData.username != 'guest'){
                ge.users[ge._userIndex[this.userData.username]].loggedin = false;
                try{
                    var d = this.userData;
                    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                    var params = {
                        TableName: 'users',
                        Key:{username: d.username},
                        UpdateExpression: "set loggedin = :bool",
                        ExpressionAttributeValues: {
                            ":bool": false
                        }
                    }
                    docClient.update(params, function(err, data) {
                        if (err) {
                            console.error("Unable to Unlock. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Update loggedin->false succeeded:", JSON.stringify(data, null, 2));
                        }
                    });
                }catch(e){
                    console.log("DB ERROR - Unable to unlock user");
                    console.log(e);
                }
            }
        },
        updateDB: function(){
            var ge = this.owner.gameEngine;
            if (this.userData.username != 'guest'){
                //Player is not a guest - update DB
                try{

                    var d = this.stats;

                    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
                    var params = {
                        TableName: 'users',
                        Key:{username: this.userData.username},
                        UpdateExpression: "set lastLogin = :l",
                        ExpressionAttributeValues: {
                            ":l": new Date().toJSON()
                        }
                    }
                    docClient.update(params, function(err, data) {
                        if (err) {
                            console.error("Unable to updateDB. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Update usrLastLogin succeeded:", JSON.stringify(data, null, 2));
                        }
                    });

                    params = {
                        TableName: 'wisp_userdata',
                        Key:{username: this.userData.username},
                        UpdateExpression: "set stats = :s",
                        ExpressionAttributeValues: {
                            ":s": d,
                        }
                    }
                    docClient.update(params, function(err, data) {
                        if (err) {
                            console.error("Unable to update usrDB. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Update usrData succeeded:", JSON.stringify(data, null, 2));
                        }
                    });
                }catch(e){
                    console.log("DB ERROR - Unable to update user data");
                    console.log(e);
                }
            }
        },
        setOwner: function(o) {
            this.owner = o;
        }

    }
}

exports.User = User;
