var fs = require('fs');
var exec = require('child_process').exec;
var firebase = require('./firebase');


const SUBMISSION_DIRECTORY = 'submissions/'
const TIME_INTERVAL = 1000


if (!fs.existsSync(SUBMISSION_DIRECTORY)) {
    fs.mkdirSync(SUBMISSION_DIRECTORY);
}

// This method updates scores with time delay
function timeDecay() {
    firebase.meltScores(function(err, data) {
        if(err) {
            console.log(err);
        } else {
            // Do nothing for now
        }
    });
}

//setInterval(timeDecay, TIME_INTERVAL);

function register(username, wing, level, callback) {
    firebase.addUser(username, wing, level, callback);
}

function getExtension(language) {
    if (language === 'c++') {
        return 'cpp';
    } else if (language === 'python') {
        return 'py';
    }
    return language
}

function getJavaName(dest) {
    var res = dest.split('/');
    return res.pop();
}

function doTheJudging(judgeInput, callback, dest, language) {
    var compile = '';
    var command = '';
    if (language === 'c++') {
        var outputFile = dest + '.o';
        compile = 'g++ -o ' + outputFile + ' ' + dest + ';';
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody ./' + outputFile;
        console.log(compile);

    } else if (language === 'java') {
        var outputFile = getJavaName(dest.substring(0, dest.length - 5));
        compile = 'javac ' + dest + ';';
        command = 'cd submissions; echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody java ' + outputFile
            + '; cd ../';
        console.log(compile);

    } else if (language === 'python') {
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody python ' + dest;
        console.log(command);

    } else if (language === 'go') {
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody go run ' + dest;
        console.log(command);

    } else if (language === 'c') {
        var outputFile = dest + '.o';
        compile = 'gcc -o ' + outputFile + ' ' + dest + ';';
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody ./' + outputFile;
        console.log(compile);

    } else {
        callback('Not a valid programming language. Valid languages are: go, java, c/c++, and python.', true);
        return;
    }

    exec(compile, function(error, stdout, stderr) {
        console.log("COMPILING");
        if (error) {
            console.log("error: " + error);
            callback(error, true);
            return;
        }
        if (stderr) {
            console.log("stderr");
            callback(stderr, true);
            return;
        }
        exec(command, function(error, stdout, stderr) {
            console.log("RUNNING");
            if (error) {
                console.log("error: " + error);
                callback(error, true);
                return;
            }
            if (stderr) {
                console.log("stderr");
                callback(stderr, true);
                return;
            }
            callback(false, stdout.trim() == judgeInput.output.trim());
        });
    });
}

function substituteJava(javaSource, name) {
    return javaSource.replace(/public\s+class\s+[\w\d_]+\s*{/im,'public class ' + name + ' {');
}

function submitProblem(username, problemName, language, file, callback) {
    console.log(username);
    console.log(problemName);
    console.log(language);
    console.log(file);
    firebase.findProblem(problemName, function(err, problem) {
        if (err || !problem) {
            console.log('Error obtaining problem: ' + problemName);
            return;
        }
        // Copy file
            firebase.incSubmissionCounter(function(err, submissionID) {
                if (err) {
                    callback(true, err);
                    return;
                }
                //TODO: is there a file.path?
                var fileExtension = getExtension(language);
                var index = ('0000' + submissionID).slice(-5);
                var name = 's' + index + '_' + username + '_' + problemName;
                var dest = SUBMISSION_DIRECTORY + name + '.' + fileExtension;
                if (language === 'java') {
                    file = substituteJava(file, name);
                }
                fs.writeFile(dest, file, function(err) {
                    // TODO: using problemName directly, probably better practice to get the problem name from firebase
                    // functionally identical though, given findProblem
                    firebase.judgeSubmission(username, problemName, function(judgeInput, callback) {
                        doTheJudging(judgeInput, callback, dest, language);
                    }, function(err) {
                        console.log('returning code: ' + err);
                        if (err) {
                            if (err.code === 124) {
                                err = 'Time Limit Exceeded';
                            }
                            callback(true, err);
                            return;
                        }
                        console.log('looks successful');
                        callback(false);
                    });
                });
            });
        });
}

exports.register = register;
exports.submitProblem = submitProblem
