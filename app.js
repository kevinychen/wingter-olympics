var express = require('express');
var http = require('http');
var passport = require('passport');
var qs = require('querystring');

var app = express();


app.set('port', 8080);

app.post('/', function(request, response) {
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
        console.log(POST);
        console.log(POST.body);
        // Not sure if simply ending the response is good practice
        response.end();
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
