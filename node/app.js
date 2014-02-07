var express = require('express');
var http = require('http');
var qs = require('querystring');
var model = require('./model');

var app = express();

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

    model.register(username, wing, level, function(err) {
        res.json({'err': err});
    });
});

// body: (username, language, problem, submission)
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
                res.json({'err': error});
            }
        });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
