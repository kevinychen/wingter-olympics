var express = require('express');
var http = require('http');
var qs = require('querystring');
var model = require('./model');
var Firebase = require('firebase');

var app = express();
// prod
// const SECRET_TOKEN = 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH';
// testing
const SECRET_TOKEN = 'ah7RRQdV38GDyeZR6dth4nTI7c4EqSGpozy9OfWX';

// prod
// var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
// testing
var firebaseRef = new Firebase('https://nextcode-testing.firebaseIO.com');
firebaseRef.auth(SECRET_TOKEN);

// Assign a new problem to a user.
function assignProblem(username) {
    firebaseRef.child('users/' + username).once('value', function(userSnapshot) {
        var level = userSnapshot.child('level').val();
        firebaseRef.child('problems/' + level).once('value', function(problemsSnapshot) {
            // Store all problems user hasn't solved into problemsLeft array
            var problemsLeft = Array();
            problemsSnapshot.forEach(function(problemSnapshot) {
                if (!userSnapshot.child('solved').hasChild(problemSnapshot.name())) {
                    problemsLeft.push(problemSnapshot);
                }
            });
            // Pick a random unsolved problem and copy to user.current
            var randomProblem = problemsLeft[Math.floor(Math.random() * problemsLeft.length)];
            userSnapshot.ref().child('current').set({
                'name': randomProblem.name(),
                'description': randomProblem.child('description').val()
            })
        });
    });
}

// listener for firebase gameStarted.
firebaseRef.child('counters/gameStarted').on('value', function(gameStartedSnapshot) {
    if (gameStartedSnapshot.val()) {
        firebaseRef.child('users').once('value', function(usersSnapshot) {
            usersSnapshot.forEach(function(userSnapshot) {
                assignProblem(userSnapshot.name());
            });
        });
    }
});

app.set('port', 8080);
app.set('view engine', 'html');
app.use(express.bodyParser());
app.use(function(req, res, next) {
    console.log(req.body);
    next();
    /*
    if (req.body.secret_token !== SECRET_TOKEN) {
        res.json({'error': 'not authorized'});
    } else {
        next();
    }
    */
});

// body: (username, wing, level)
app.post('/register', function(req, res) {
    var username = req.body.username;
    var wing = req.body.wing;
    var level = req.body.level;

    firebaseRef.child('users/' + username).set({
        'wing': wing,
        'level': level,
    });
    firebaseRef.child('wings/' + wing + '/users').child(username).set({
        'score': 0,
    });
    firebaseRef.child('counters/gameStarted').once('value', function(gameStarted) {
        if (gameStarted.val()) {
            assignProblem(username);
        }
    });

    res.json({'success': true});
});

// body: (username, language), files: (submission)
app.post('/submit', function(req, res) {
    var username = req.body.username;
    var language = req.body.language;
    var problemName = req.body.problem;
    var submission = req.body.file;

    console.log(username);
    console.log(language);
    console.log(problemName);
    console.log(submission);

    model.submitProblem(username, problemName, language, submission,
        function(error, output) {
            if (error){
                console.log('Error with submission: ' + output);
            }
        });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
