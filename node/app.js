var express = require('express');
var http = require('http');
var qs = require('querystring');
var model = require('./model');

var app = express();

app.set('port', 8000);
app.set('view engine', 'html');
app.use(express.bodyParser({
    limit: 1024 * 1024 * 10
}));
app.use(function(req, res, next) {
    console.log(req.body);
    if (req.body.secret_token !== 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH') {
        res.json({'error': 'not authorized'});
    } else {
        next();
    }
});

// body: (username, wing)
app.post('/register', function(req, res) {
    var username = req.body.username;
    var wing = req.body.wing;

    model.register(username, wing, function(err) {
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
            }
            model.showMessage(username, 'Problem ' + problemName + ': ' + output);
        });

    res.json({'err': false});
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
