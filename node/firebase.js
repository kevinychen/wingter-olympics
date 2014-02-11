var Firebase = require('firebase');

// prod
const SECRET_TOKEN = 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH';
// testing
//const SECRET_TOKEN = 'ah7RRQdV38GDyeZR6dth4nTI7c4EqSGpozy9OfWX';

const INITIAL_SCORE = 100;
const NORMAL_WEIGHT = 10;
const ADVANCED_WEIGHT = 20;
const DECAY_CONSTANT = 1.0;
const SUBMISSION_WAIT_TIME = 30000;  // min ms between submissions

// prod
var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
// testing

//var firebaseRef = new Firebase('https://nextcode-testing.firebaseIO.com');
firebaseRef.auth(SECRET_TOKEN);

function addUser(username, wing, callback) {
    if (!wing.match(/^[\w\d]+$/i)) {
       callback('Invalid wing, only alphanumeric characters permitted');
       return;
    }

    firebaseRef.child('users/' + username).set({
        'wing': wing,
    });

    firebaseRef.child('wings').once('value', function(wingsSnapshot) {
        if (!wingsSnapshot.hasChild(wing)) {
            wingsSnapshot.ref().child(wing).set({'score': INITIAL_SCORE});
        }
        callback(false);
    });
}

function incSubmissionCounter(callback) {
    firebaseRef.child('counters').child('submissionID').transaction(function(submissionID) {
        return submissionID + 1;
    }, function(err, committed, data) {
        if (err) {
            callback(err);
        } else if (!committed) {
            callback('System error: submit problem');
        } else {
            callback(false, data.val());
        }
    });
};

function findProblem(problemName, callback) {
    firebaseRef.child('problems').child(problemName).once('value', function(data) {
        callback(false, data.val());
    });
}

function judgeSubmission(user, problemName, tester, callback) {
    firebaseRef.child('judge/' + problemName).once('value', function(data) {
            var counter = data.numChildren();
            var error = undefined;
            for (var judgeInputKey in data.val()) {
                tester(data.val()[judgeInputKey], function(err, success) {
                    if (err) {
                        error = err;
                    }
                    if (!success) {
                        error = 'Incorrect output.';
                    }
                    counter--;
                    if (counter == 0) {
                        callback(error);
                    }
                });
            }
        });
};

// Increment the score by the given weight. score += weight
function updateScore(userName, problemName, wing, weight, callback) {
    firebaseRef.child('wings').child(wing).child('score').transaction(function(score) {
        return score + weight;
    }, function(err, committed, data) {
        if (err) {
            callback(err);
        } else if (!committed) {
            callback('System error: submit problem');
        } else {
            firebaseRef.child('wings').child(wing).child('solved').child(problemName).set(userName,
                function(error) {
                    if (error) {
                        console.log("Error when adding problem " + problemName 
                            + " solved by: " + userName + ", to solved list");
                        callback(error);
                    } else {
                        callback(false);
                    }
                });
        }
    });
}

function solveProblem(userName, problemName, problemLevel, callback) {
    firebaseRef.child('users').child(userName)
        .child('wing').once('value', function(data) {
            var wing = data.val();
            firebaseRef.child('wings/' + wing).child('solved').once('value',
                function(data) {
                    var solvedProblems = data.val();
                    if (solvedProblems && (problemName in solvedProblems)) {
                        callback('Problem already solved.');
                        return;
                    }
                    var weight = undefined;
                    if (problemLevel === 'advanced') {
                        weight = ADVANCED_WEIGHT;
                    } else if (problemLevel === 'normal') {
                        weight = NORMAL_WEIGHT;
                    }
                    if (weight) {
                        updateScore(userName, problemName, wing, weight, callback);
                    } else {
                        // This shouldn't happen
                        callback("ERROR UPDATING: " + userName + ", " + problemName + ", " + wing);
                    }
                });
        });
};

function computeDecay(prevScore) {
    return Math.max(2.0, prevScore - DECAY_CONSTANT / Math.sqrt(prevScore));
}

function meltScores(callback) {
    firebaseRef.child('status').once('value', function(isRunning) {
        if (!isRunning.val()) {
            callback('Contest has stopped, no time decay necessary');
            return;
        }
        firebaseRef.child('wings').once('value', function(data) {
            var wings = data.val();
            for (var wingKey in wings) {
                firebaseRef.child('wings').child(wingKey)
            .child('score').transaction(function(score) {
                return computeDecay(score);
            }, function(err, committed, data) {
                if (err) {
                    callback(err);
                } else if (!committed) {
                    callback('Cannot commit decayed scores');
                } else {
                    callback(false, data.val());
                }
            });
            }
        });
    });
}

function showMessage(username, message) {
    firebaseRef.child('users/' + username + '/message').set(message);
}

function checkTimestamp(username, currTime, callback) {
    lastSubmitTimeRef = firebaseRef.child(
            'users/' + username + '/lastSubmitTime');
    lastSubmitTimeRef.once('value', function(lastSubmitTimeSnapshot) {
        var tooSoon = lastSubmitTimeSnapshot.val() >
            currTime - SUBMISSION_WAIT_TIME;
        if (!tooSoon) {
            lastSubmitTimeRef.set(currTime);
        }
        callback(tooSoon);
    });
}

function checkRunning(callback) {
    firebaseRef.child('status').once('value', function(data) {
        var isRunning = data.val();
        callback(isRunning);
    });
}

function setLevel(userName, problemLevel, callback) {
    firebaseRef.child('users').child(userName).child('level').once('value', function(levelData) {
        var userLevel = levelData.val();
        if (!userLevel) {
            levelData.ref().set(problemLevel);
            callback(false);
        } else if (userLevel !== problemLevel) {
            callback('Sorry, this problem is level: ' + problemLevel + '. Your bracket is: ' + userLevel + '.');
        } else {
            callback(false);
        }
    });
}

exports.addUser = addUser
exports.judgeSubmission = judgeSubmission
exports.incSubmissionCounter = incSubmissionCounter
exports.updateScore = updateScore
exports.solveProblem = solveProblem
exports.meltScores = meltScores
exports.findProblem = findProblem
exports.showMessage = showMessage
exports.checkTimestamp = checkTimestamp
exports.checkRunning = checkRunning
exports.setLevel = setLevel
