var express = require('express');
var http = require('http');
var passport = require('passport');
var qs = require('querystring');
var model = require('./model');

var app = express();

model.doTheThing();

app.set('port', 8080);
app.use(express.bodyParser());

app.post('/', function(request, response) {

    console.log(request.body);
    var string = request.body.body;
    console.log(string);
    var encrypted = model.encryptString(string);
    console.log(encrypted);
    var decrypted = model.decryptString(encrypted);
    console.log(decrypted);
    /*
    var body = '';
    request.on('data', function(data) {
        body += data;
        if (body.length > 1e7) {
            // kill request
            request.connection.destroy();
        }
    });

    request.on('end', function() {
        var POST = qs.parse(body);

        var string = POST.body;
        encrypted = exports.encryptString(string);
        console.log(string);
        console.log(encrypted);
        // Not sure if simply ending the response is good practice
        response.end();
    });
    */
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
