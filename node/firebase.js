var Firebase = require('firebase');

// prod
// const SECRET_TOKEN = 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH';
// testing
const SECRET_TOKEN = 'ah7RRQdV38GDyeZR6dth4nTI7c4EqSGpozy9OfWX';

const INITIAL_SCORE = 100;
const NORMAL_WEIGHT = 10;
const ADVANCED_WEIGHT = 20;

// prod
// var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
// testing

var firebaseRef = new Firebase('https://nextcode-testing.firebaseIO.com');
firebaseRef.auth(SECRET_TOKEN);

function addUser(username, wing, level, callback) {
    firebaseRef.child('users/' + username).set({
        'wing': wing,
        'level': 'normal'
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

function findProblem(problemName, userBracket, callback) {

    firebaseRef.child('problems').child(userBracket).child(problemName).once('value',
            function(data) {
                callback(false, data.val());
            });
}

function judgeSubmission(user, problemName, userBracket, tester, callback) {
    firebaseRef.child('problems').child(userBracket).child(problemName).
        child('judge').once('value', function(data) {
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
function incrementScore(wing, weight) {
    firebaseRef.child('wings').child(wing).child('score').transaction(function(score) {
        return score + weight;
    }, function(err, committed, data) {
        if (err) {
            callback(err);
        } else if (!committed) {
            callback('System error: submit problem');
        } else {
            callback(false, data.val());
        }
    });
}

function solveProblem(user, problem, score) {
    firebaseRef.child('users').child(user.id)
        .child('wing').once('value', function(data) {
            var wing = data.val();
            if (problem.level === 'advanced') {
                incrementScore(wing, ADVANCED_WEIGHT);
            } else if (problem.level === 'normal') {
                incrementScore(wing, NORMAL_WEIGHT);
            } else {
                // This shouldn't happen
                console.log("ERROR UPDATING: " + user + ", " + problem + ", score: " + score);
            }
        });
};

function computeDecay(prevScore) {
    return prevScore - 1.0 / Math.sqrt(prevScore);
}

function meltScores(callback) {
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
}

exports.addUser = addUser;
exports.judgeSubmission = judgeSubmission
exports.incSubmissionCounter = incSubmissionCounter
//exports.wrongSubmission = wrongSubmission
exports.incrementScore = incrementScore
exports.solveProblem = solveProblem
exports.meltScores = meltScores
exports.findProblem = findProblem

