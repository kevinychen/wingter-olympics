<?php
require_once('util.php');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    # Submit problem
    $url = 'http://nextcode.mit.edu:8080/submit';
    $fields = array(
        'username' => $kerberos,
        'language' => $_POST['lang'],
        'problem' => 'sum',
        'file' => file_get_contents($_FILES['file']['tmp_name']),
        'secret_token' => $secret_token,
    );
    do_post_request($url, $fields);
}
?>
<html>
    <head>
        <title>Next Code 2014 Wingter Olympics</title>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src='https://cdn.firebase.com/v0/firebase.js'></script>
    </head>
    <body>
        <div class="container">
            <div id="problem"></div>
            <div id="description"></div>
            <div id="upload">
                <form method="post" action="/wingter-olympics/scripts/home.php" enctype="multipart/form-data">
                    <p>Language:
                        Java <input type="radio" name="lang" value="java">
                        C++ <input type="radio" name="lang" value="c++">
                        Python <input type="radio" name="lang" value="python">
                    </p>
                    <p>File: <input type="file" name="file"></p>
                    <input type="submit" value="submit">
                </form>
            </div>
        </div>
    </body>
    <script>
        var firebaseRef = new Firebase('https://wingter-olympics.firebaseIO.com');
        var currentProblemRef = firebaseRef.child('wings/3W/users/kyc2915/current');
        currentProblemRef.on('value', function(currentProblemSnapshot) {
            $('#problem').text(currentProblemSnapshot.val().name);
            $('#description').text(currentProblemSnapshot.val().description);
        });
    </script>
</html>
