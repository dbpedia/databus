#!/usr/bin/php
<?php
ob_start();
include_once("model.php");
$markdown = ob_get_clean();
file_put_contents("model.md", $markdown .PHP_EOL);
