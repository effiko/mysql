<?php
    error_reporting(E_ALL|E_STRICT);

    $link = mysqli_connect('localhost', 'root', '', bikes, 3308);
    if (!$link) {
        echo "Error: Unable to connect to MySQL." . PHP_EOL;
        echo "Debugging error: " . mysqli_connect_error() . PHP_EOL;
        exit;
    }
    $data = file_get_contents('final.json');
    $json = json_decode($data, true);
//    print_r($json);
?>
