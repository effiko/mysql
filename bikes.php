<?php
error_reporting(E_ALL|E_STRICT);
$php_self = $_SERVER['PHP_SELF'];
echo "<br>";
if (isset($_POST['mispar'])){
    $query = bb($_POST['mispar']);

}

//==========================
function bb($num){
    $ans = "";
    if (strpos($num, '?') !== false){
        $psik='';
        for ($j=0;$j<10;$j++){
            $dd = chr(48+$j);
            $num1 = preg_replace("/\?/", $dd, $num, 1);
            if (strpos($num1, '?') !== false){
              $ans .= $psik . bb($num1);  
            } else {
            $ans .= $psik . "'$num1'";    
            }
            
            $psik=',';
            // echo "$ans<br>";
        }
        $ans .= "<br>";
    }
    if (empty($ans)) $ans = $num ;
    return $ans ;
}


?>
<html>
    <head>
        <title>Build query</title>
    </head>
    <body>
        <?php
                echo "$query <br>" ;
        ?>
        <form name="mispar" action="<?php echo  $php_self?>" method="post">
            Enter mispar : <input type="text" name="mispar">
            <button type="submit">Search</button>
        </form>
    </body>
</html>
