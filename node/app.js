var express = require('express');
var http = require('http');
var qs = require('querystring');
var model = require('./model');

var app = express();

app.set('port', 8080);
app.set('view engine', 'html');
app.use(express.bodyParser({
    limit: 1024 * 1024 * 10
}));
app.use(function(req, res, next) {
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

    model.checkTimestamp(username, new Date().getTime(), function(tooSoon) {
        if (tooSoon) {
            model.showMessage(username, 'You must wait at least 30 seconds between submissions.');
        } else {
            model.showMessage(username, 'Problem ' +
                problemName + ': grading...');
            model.submitProblem(username, problemName, language, submission,
                function(error, output) {
                    if (error){
                        console.log('Error with submission: ' + output);
                    }
                    console.log(error);
                    console.log('OUTPUT: ' + output);
                    if (error && output && output.toString().indexOf('Command failed:') >= 0) {
                        output = 'Compile time or runtime error; did you choose the right language?';
                    }
                    model.showMessage(username, 'Problem ' +
                        problemName + ': ' + output);
                });
        }
    });

    res.json({'err': false});
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
