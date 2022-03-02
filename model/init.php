<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
global $contextFile, $shaclDir, $generatedDir;

@unlink($contextFile);
array_map('unlink', glob("$shaclDir/*.*"));
@rmdir($shaclDir);
@rmdir($generatedDir);
mkdir($shaclDir, 0777, true);
?>
