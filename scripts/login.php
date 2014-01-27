<html>
    <head>
        <title>Next Code 2014 Wingter Olympics</title>
    </head>
    <body>
        <div class="container">
            <form method="post" action="/home.php">
                <h1>Next Code 2014 Wingter Olympics</h1>
<?php
# Find kerberos
$kerberos = $_SERVER['SSL_CLIENT_S_DN_Email'];  # e.g. 'kyc2915@mit.edu'
$at_index = strpos($kerberos, '@');
if ($at_index !== FALSE) {  # the @ sign exists
    $kerberos = substr($kerberos, 0, $at_index);  # e.g. 'kyc2915'
}
?>
                <p>Username: <?php echo $kerberos ?></p>
<?php
# Find room number
$dir_output = shell_exec('finger ' . $kerberos . '@mitdir.mit.edu');
if (preg_match('/address: 500 Memorial Dr # ([2-5][0-7][0-9])/', $dir_output, $matches)) {
    $room_number = $matches[1];  # e.g. '310'
    $floor = substr($room_number, 0, 1);  # e.g. '3'
    $location = substr($room_number, 1, 3);  # e.g. '10'
    $side = strcmp($location, '30') <= 0 ? 'W' : 'E';  # e.g. 'W'
    $wing = $floor . $side;
}
?>
                <p>Wing: <input type="text" name="wing" value="<?php echo $wing ?>"></p>
<?php
# Switch to course 6
if (strpos($dir_output, 'Electrical Eng & Computer Sci') === FALSE) {
?>
                <p>Also, you should switch to Course 6.</p>
<?php
}
?>
                <input type="submit" value="Enter!">
            </form>
        </div>
    </body>
</html>
