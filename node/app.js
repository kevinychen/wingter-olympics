var express = require('express');
var http = require('http');
var qs = require('querystring');
var model = require('./model');
var Firebase = require('firebase');

const SECRET_TOKEN = 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH';

var app = express();
var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
firebaseRef.auth(SECRET_TOKEN);

app.set('port', 8080);
app.set('view engine', 'html');
app.use(express.bodyParser());
app.use(function(req, res, next) {
    console.log(req.body);
    if (req.body.secret_token !== SECRET_TOKEN) {
        res.json({'error': 'not authorized'});
    } else {
        next();
    }
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

    res.json({'success': true});
});

// body: (username, language), files: (submission)
app.post('/submit', function(req, res) {
    var username = req.body.username;
    var language = req.body.language;
    var submission = req.body.file;

    var users = firebaseRef.child('users');
    users.once('value', function(usersSnapshot) {
        if (usersSnapshot.hasChild(username)) {
            var currentProblem = usersSnapshot.child('current/name').val();
            model.grade(currentProblem, language, submission, function(success, message) {
                console.log('Results for ' + username + ' on problem ' + currentProblem + ':');
                console.log(success);
                console.log(message);
            });
        }
        res.json({'success': true});
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
