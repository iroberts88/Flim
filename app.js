var app = require('http').createServer(webResponse),
    fs = require('fs'),
    AWS = require("aws-sdk"),
    io = require('socket.io')(app),
    GameEngine = require('./gameengine.js').GameEngine,
    RequireCheck = require('./requirecheck.js').RequireCheck;

const crypto = require('crypto');
    
var rc = null,
    ge = null;

//{endpoint: "https://dynamodb.us-west-1.amazonaws.com"}
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

function init() {
    rc = new RequireCheck();
    ge = new GameEngine();
    rc.onReady(onReady);
    // ----------------------------------------------------------
    // Start Database Connection
    // ----------------------------------------------------------
    
    rc.require('dbHighScores','dbUsers');

    var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
    fs.readFile('./db/wisp_highScores.json', "utf8",function read(err, data) {
        if (err) {
            throw err;
        }
        var obj = JSON.parse(data);

        ge.loadHighScores(obj.items);
        rc.ready('dbHighScores');
    });
    // ---- Load Userbase ----
    docClient.scan({TableName: 'users'}, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Loading users... " + data.Items.length + ' found');
            ge.loadUsers(data.Items);
            rc.ready('dbUsers');
        }
    });
}

init();



// ----------------------------------------------------------
// Start Web Server
// ----------------------------------------------------------

process.on('exit', (code) => {
    console.log("Running exit code...")
    var s = ge.soloHighScores;
    var c = ge.coopHighScores;
    var v = ge.vsHighScores;
    var st = ge.starsHighScores;
    var data = {
        "items": [
            {
                'modeid': 'main',
                'coop': c,
                'solo': s,
                'vs': v,
                'stars': st
            }
        ],
        "derp": "what"
    }
    //synchronus file write to update high scores
    fs.writeFileSync('./db/wisp_highScores.json',JSON.stringify(data, null, 2), function(err){
        if (err){
            return console.log(err);
        }
    });
});

process.on('SIGINT', function () {
    console.log('Ctrl-C...');
    process.exit(2);
});

process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});

function webResponse(req, res) {
    var filename = req.url;

    // Check for default
    if (filename == '/') {
        filename = '/index.html';
    }

    //console.log('HTTP Request: ' + filename);

    fs.readFile(__dirname + '/public' + filename, function(err, data) {
        if (err) {
            console.log('Couldn\'t find file: ' + req.url);
            res.writeHead(500);
            res.end('Couldn\'t find file: ' + req.url)
        }

        res.writeHead(200);
        res.end(data);
    });
}

function onReady() {
    console.log('All require items loaded. Starting Game Engine');
    var port = process.env.PORT || 3000;
    app.listen(port);

    ge.init();
}


// TO DO: Need to keep track of sockets with ids
// ----------------------------------------------------------
// Start Socket Listener
// ----------------------------------------------------------
io.on('connection', ge.newConnection);

console.log('Listening');


