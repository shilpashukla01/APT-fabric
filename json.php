<?php

//$BASE_COLLECTIONS_PATH = "/path/to/collections/";
$BASE_URL_PATH = "http://localhost/apt/";
$BASE_WORKSPACE_PATH = "workspaces/";

//$_GET['sdfsdf'] = "asdaddasdas";
//print_r($_GET);

// Return list of collections
if( $_GET['workspace'] == "all" ) {
	$json = array();

$dir = $BASE_WORKSPACE_PATH;

// Open a known directory, and proceed to read its contents
if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
		if($file != "." && $file != ".." ) {
			$json['workspaces'][] = $BASE_URL_PATH.$file;
		}
        }
        closedir($dh);
	echo json_encode($json);
    }
} else {
		$json['response'] = "error";
		echo json_encode($json);
	}
}

// Return specific workspace
if( $_GET && $_GET['workspace'] != "all") {

	$json = array();
	$filepath = $BASE_WORKSPACE_PATH.$_GET['workspace'].".json";

	if( $handle = fopen($filepath, "r") ) {
		$contents = fread($handle, filesize($filepath));
		echo $contents;
	} else {
		$json['response'] = "error";
		echo json_encode($json);
	}
}

// Save workspace
if( $_POST ) {
	$_POST['content'] = stripslashes($_POST['content']);
	$json = array();

	$handle = fopen($BASE_WORKSPACE_PATH.$_POST['id'].'.json', "w");

	if (fwrite($handle, $_POST['content']) === FALSE) {
		$json['response'] = "error";
	} else {
		$json['response'] = "success";
	}

	echo json_encode($json['response']);
}

if( $handle ) {
	fclose($handle);
}

?>
