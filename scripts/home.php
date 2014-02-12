<?php
require_once('util.php');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    # Submit problem
    $url = 'http://nextcode.mit.edu:8080/submit';
    $fields = array(
        'username' => $kerberos,
        'language' => $_POST['lang'],
        'problem' => $_POST['problem'],
        'file' => file_get_contents($_FILES['file']['tmp_name']),
        'secret_token' => $secret_token,
    );
    do_post_request($url, $fields);
}
?>
<html>
    <head>
        <title>Next Code 2014 Wingter Olympics</title>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src='https://cdn.firebase.com/v0/firebase.js'></script>
    </head>
    <body>
        <div class="banner">
            <div id="title"></div>
            <div id="announcement"></div>
            <div id="message"></div>
        </div>
        <div class="sidebar">
            <h1>PROBLEMS</h1>
            <h3>Normal</h3>
            <ul id="list">
            </ul>
            <hr>
            <h3>Advanced</h3>
            <ul id="listAdv">
            </ul>
        </div>
        <div class="container">
            <ul id="problems">
                <li>
                <h2>sum</h2>
                <h3>normal</h3>
                <pre>Description</pre>
                <div>
                    <p>Language:
                        Java <input type="radio" name="lang-sum" value="java">
                        C++ <input type="radio" name="lang-sum" value="c++">
                        Python <input type="radio" name="lang-sum" value="python">
                    </p>
                    <p>File: <input type="file" id="file-sum"></p>
                    <button type="button" id="submit-sum" class="submit-problem">Submit</button>
                </div>
                </li>
            </ul>
        </div>
    </body>
    <script>
        var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
        var problemsRef = firebaseRef.child('problems');
        sortFunc = function(a, b) {
            var aVal = a.val().level === 'normal';
            var bVal = b.val().level === 'normal';
            if (aVal != bVal)
                return aVal ? 1 : -1;
            else
                return a.name() > b.name() ? 1 : -1;
        }
        firebaseRef.child('users/<?php echo $kerberos ?>').on('value', function(userSnapshot) {
            var wing = userSnapshot.child('wing').val();
            firebaseRef.child('wings/' + wing).once('value', function(wingSnapshot) {
                var solvedProblems = {};
                if (wingSnapshot.hasChild('solved')) {
                    solvedProblems = wingSnapshot.child('solved').val();
                }
                problemsRef.on('value', function(problemsSnapshot) {
                    var sidebarList = '';
                    var sidebarListAdv = '';
                    var problemsList = '';
                    var problems = [];
                    problemsSnapshot.forEach(function(problemSnapshot) {
                        problems.push(problemSnapshot);
                    });
                    problems.sort(sortFunc);

                    problems.forEach(function(problemSnapshot) {
                        var problem = problemSnapshot.name();
                        var level = problemSnapshot.child('level').val();
                        var element = ''
                        if (problem in solvedProblems) {
                            var solver = solvedProblems[problem]
                            element = '<li>&#x2713<a href="#gotoproblem-' + problem + '">' + problem + '</a> | ' + solver + '</li>';
                        } else {
                            element = '<li><a href="#gotoproblem-' + problem + '">' + problem + '</a></li>';
                        }
                        if (level === 'advanced') {
                            sidebarListAdv += element;
                        } else {
                            sidebarList += element;
                        }

                        problemsList += '<li><a name="gotoproblem-' + problem + '"></a><div class="blank"></div><h2>' + problem + '</h2>';
                        problemsList += '<h3>' + level + '</h3>';
                        problemsList += '<pre id="' + problem + '-description"></pre>';
                        problemsList += '<div>';
                        problemsList += '<p>';
                        problemsList += 'Java: <input type="radio" name="lang-' + problem + '" value="java">';
                        problemsList += 'C++: <input type="radio" name="lang-' + problem + '" value="c++">';
                        problemsList += 'C: <input type="radio" name="lang-' + problem + '" value="c">';
                        problemsList += 'Python: <input type="radio" name="lang-' + problem + '" value="python">';
                        problemsList += 'Go: <input type="radio" name="lang-' + problem + '" value="go">';
                        problemsList += '</p>';
                        problemsList += '<p>File: <input type="file" id="file-' + problem + '"></p>';
                        problemsList += '<button type="button" id="submit-' + problem + '" class="submit-problem">Submit</button>';
                        problemsList += '</div></li>';
                    });
                    $('#list').html(sidebarList);
                    $('#listAdv').html(sidebarListAdv);
                    $('#problems').html(problemsList);
                    problemsSnapshot.forEach(function(problemSnapshot) {
                        var problem = problemSnapshot.name();
                        var description = problemSnapshot.child('description').val();
                        $('#' + problem + '-description').text(description);
                    });

                    $('.submit-problem').on('click', function(e) {
                        var id = e.target.id;
                        var problem = id.substring('submit-'.length);
                        var fd = new FormData();
                        fd.append('file', $('#file-' + problem)[0].files[0]);
                        var selected = $('input[type="radio"][name="lang-' + problem + '"]:checked');
                        var selectedVal = '';
                        if (selected.length > 0) {
                            selectedVal = selected.val();
                        }
                        fd.append('lang', selectedVal);
                        fd.append('problem', problem);
                        var xhr = new XMLHttpRequest();
                        xhr.open('post', 'home.php', true);
                        xhr.send(fd);
                    });
                });
            });
        });

        // Show user stats and message
        firebaseRef.child('users/<?php echo $kerberos ?>').on('value', function(userSnapshot) {
            var stats = '<b>User: <?php echo $kerberos ?> Wing: ' + userSnapshot.child('wing').val();
            if (userSnapshot.hasChild('level')) {
                stats += ' Level: ' + userSnapshot.child('level').val();
            }
            stats += '</b>';
            $('#title').html(stats);
            if (userSnapshot.hasChild('message')) {
                $('#message').text(userSnapshot.child('message').val());
            }
        });
    </script>
    <style>
         .banner {
             position: fixed;
             background: white;
         }
         .sidebar {
             position: fixed;
             top: 50px;
             font-size:13px;
             overflow: scroll;
         }
         .container {
             margin-left: 250px;
         }
         .blank {
             min-height: 50px;
         }
         input {
             margin-right: 20px;
         }
    </style>
</html>
