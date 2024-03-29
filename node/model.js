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
            // this is annoying
            if (err !== 'Contest has stopped, no time decay necessary') {
                console.log('Error while decaying scores: ' + err);
            }
        } else {
            // Do nothing for now
        }
    });
}

setInterval(timeDecay, TIME_INTERVAL);

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

    } else if (language === 'java') {
        var outputFile = getJavaName(dest.substring(0, dest.length - 5));
        compile = 'javac ' + dest + ';';
        command = 'cd submissions; echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody java ' + outputFile
            + '; cd ../';

    } else if (language === 'python') {
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody python ' + dest;

    } else if (language === 'go') {
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody go run ' + dest;

    } else if (language === 'c') {
        var outputFile = dest + '.o';
        compile = 'gcc -o ' + outputFile + ' ' + dest + ';';
        command = 'echo "' + judgeInput.input + '" | timeout 3s sudo -u nobody ./' + outputFile;

    } else {
        callback('Not a valid programming language. Valid languages are: go, java, c/c++, and python.', true);
        return;
    }

    exec(compile, function(error, stdout, stderr) {
        console.log("compiling ... ");
        if (error) {
            console.log("error: " + error);
            callback(error, true);
            return;
        }
        if (stderr) {
            console.log("stderr: " + stderr);
            callback(stderr, true);
            return;
        }
        exec(command, function(error, stdout, stderr) {
            console.log("running ...");
            if (error) {
                console.log("error: " + error);
                callback(error, true);
                return;
            }
            if (stderr) {
                console.log("stderr: " + stderr);
                callback(stderr, true);
                return;
            }
            callback(false, stdout.trim() == judgeInput.output.toString().trim());
        });
    });
}

function substituteJava(javaSource, name) {
    return javaSource.replace(/public\s+class\s+[\w\d_]+\s*{/im,'public class ' + name + ' {');
}

function submitProblem(username, problemName, language, file, callback) {
    console.log('------------- New Submission --------------');
    console.log('username: ' + username);
    console.log('problem: ' + problemName);
    console.log('language: ' + language);
//    console.log('source: ' + file);
    firebase.checkRunning(function(isRunning) {
        if (!isRunning) {
            callback(true, 'Contest has stopped.');
            return;
        }
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
                firebase.setLevel(username, problem.level, function(error) {
                    if (error) {
                        callback(true, error);
                        return;
                    }
                    fs.writeFile(dest, file, function(err) {
                        // TODO: using problemName directly, probably better practice to get the problem name from firebase
                        // functionally identical though, given findProblem
                        firebase.judgeSubmission(username, problemName, function(judgeInput, testerCallback) {
                            doTheJudging(judgeInput, testerCallback, dest, language);
                        }, function(err) {
                            console.log('returning code: ' + err);
                            if (err) {
                                if (err.code === 124) {
                                    err = 'Time Limit Exceeded';
                                }
                                callback(true, err);
                                return;
                            }
                            console.log('Successful submission.');
                            // Scores updated here
                            firebase.solveProblem(username, problemName, problem.level, function(err) {
                                if (err) {
                                    callback(true, err);
                                } else {
                                    callback(false, 'SUCCESS!');
                                }
                            });
                        });
                    });
                });
            });
        });
    });
}

function showMessage(username, message) {
    firebase.showMessage(username, message.toString());
}

function checkTimestamp(username, currTime, callback) {
    // Check if previous submission is too soon
    // Then sets the most recent submission time to this time
    firebase.checkTimestamp(username, currTime, callback);
}

exports.register = register;
exports.submitProblem = submitProblem;
exports.showMessage = showMessage;
exports.checkTimestamp = checkTimestamp;
exports.timeDecay = timeDecay
