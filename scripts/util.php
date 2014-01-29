<?php
# from http://wezfurlong.org/blog/2006/nov/http-post-from-php-without-curl/
function do_post_request($url, $fields, $optional_headers = null) {
    foreach($fields as $key=>$value) {
        $fields_string .= $key . '=' . urlencode($value) . '&';
    }
    rtrim($fields_string, '&');

    $params = array('http' =>
            array(
                'method' => 'POST',
                'content' => $fields_string
                )
            );
    if ($optional_headers !== null) {
        $params['http']['header'] = $optional_headers;
    }
    $ctx = stream_context_create($params);
    $fp = @fopen($url, 'rb', false, $ctx);
    if (!$fp) {
        throw new Exception("Problem with $url, $php_errormsg");
    }
    $response = @stream_get_contents($fp);
    if ($response === false) {
        throw new Exception("Problem reading data from $url, $php_errormsg");
    }
    return $response;
}

# Find kerberos
$kerberos = $_SERVER['SSL_CLIENT_S_DN_Email'];  # e.g. 'kyc2915@mit.edu'
$at_index = strpos($kerberos, '@');
if ($at_index !== FALSE) {  # the @ sign exists
    $kerberos = substr($kerberos, 0, $at_index);  # e.g. 'kyc2915'
}

$secret_token = 'i5QbfhtaYBIKR3bZ68pZwSfXlu4V8X3Tj1xnn3dH';
?>
