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
        <div id="title"></div>
        <div id="announcement"></div>
        <div id="message"></div>
        <div class="container">
            <h1>Problems</h1>
                <ul id="problems">
                    <li>
                    <h2>sum</h2>
                    <p>Description</p>
                    <div id="upload">
                        <form method="post" action="/wingter-olympics/scripts/home.php" enctype="multipart/form-data">
                            <input type="hidden" name="problem" value="sum">
                            <p>Language:
                                Java <input type="radio" name="lang" value="java">
                                C++ <input type="radio" name="lang" value="c++">
                                Python <input type="radio" name="lang" value="python">
                            </p>
                            <p>File: <input type="file" name="file"></p>
                            <input type="submit" value="submit">
                        </form>
                    </div>
                    </li>
                </ul>
            </div>
        </div>
    </body>
    <script>
        var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
        var problemsRef = firebaseRef.child('problems');
        problemsRef.on('value', function(problemsSnapshot) {
            var problemsList = '';
            problemsSnapshot.forEach(function(problemSnapshot) {
                var problem = problemSnapshot.name();
                problemsList += '<li><h2>' + problem + '</h2>';
                problemsList += '<p id="' + problem + '-description"></p>';
                problemsList += '<div id="upload">';
                problemsList += '<form method="post" action="/wingter-olympics/scripts/home.php" enctype="multipart/form-data">';
                problemsList += '<input type="hidden" name="problem" value="' + problem + '">';
                problemsList += '<p>Language:';
                problemsList += 'Java <input type="radio" name="lang" value="java">';
                problemsList += 'C++ <input type="radio" name="lang" value="c++">';
                problemsList += 'Python <input type="radio" name="lang" value="python">';
                problemsList += '<p>File: <input type="file" name="file"></p>';
                problemsList += '<input type="submit" value="submit">';
                problemsList += '</form></div></li>';
            });
            $('#problems').html(problemsList);
            problemsSnapshot.forEach(function(problemSnapshot) {
                var problem = problemSnapshot.name();
                var description = problemSnapshot.child('description').val();
                $('#' + problem + '-description').text(description);
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
</html>
