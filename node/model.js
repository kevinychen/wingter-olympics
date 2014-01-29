var fs = require('fs');
var exec = require('child_process').exec;

exports.grade = function(problem, language, submission, callback) {
    callback(true, 'Congratulations!');
};
