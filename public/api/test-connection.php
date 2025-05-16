<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Test write access to check if we can create logs
$logFile = __DIR__ . '/connection-test.log';
$canWriteLog = false;
try {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Connection test executed\n", FILE_APPEND);
    $canWriteLog = true;
} catch (Exception $e) {
    $logError = $e->getMessage();
}

// Get path information
$apiDir = __DIR__;
$rootDir = dirname(dirname($apiDir));
$photosDir = $rootDir . '/photos/';
$outputDir = $rootDir . '/output/';

// Check if directories exist
$photosExists = is_dir($photosDir);
$outputExists = is_dir($outputDir);

// Check if directories are writable
$photosWritable = is_writable($photosDir);
$outputWritable = is_writable($outputDir);

// Test creating files
$canWritePhotos = false;
$photosTestFile = null;
if ($photosExists) {
    try {
        $photosTestFile = $photosDir . 'test_' . time() . '.txt';
        file_put_contents($photosTestFile, 'Test file created by test-connection.php at ' . date('Y-m-d H:i:s'));
        $canWritePhotos = true;
    } catch (Exception $e) {
        $photosWriteError = $e->getMessage();
    }
}

$canWriteOutput = false;
$outputTestFile = null;
if ($outputExists) {
    try {
        $outputTestFile = $outputDir . 'test_' . time() . '.txt';
        file_put_contents($outputTestFile, 'Test file created by test-connection.php at ' . date('Y-m-d H:i:s'));
        $canWriteOutput = true;
    } catch (Exception $e) {
        $outputWriteError = $e->getMessage();
    }
}

// Check PHP configuration
$maxUploadSize = ini_get('upload_max_filesize');
$maxPostSize = ini_get('post_max_size');
$memoryLimit = ini_get('memory_limit');
$maxExecutionTime = ini_get('max_execution_time');

// Check for GD library (used for image processing)
$gdEnabled = extension_loaded('gd');
$gdInfo = $gdEnabled ? gd_info() : null;

// Response data
$response = array(
    "status" => "success",
    "message" => "Connection test completed",
    "timestamp" => date('Y-m-d H:i:s'),
    "server_info" => array(
        "server_name" => $_SERVER['SERVER_NAME'] ?? 'unknown',
        "server_software" => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        "document_root" => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        "script_path" => __FILE__,
        "php_version" => phpversion(),
        "os" => php_uname(),
        "remote_addr" => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        "request_uri" => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ),
    "filesystem" => array(
        "log_writable" => $canWriteLog,
        "photos_dir" => array(
            "path" => $photosDir,
            "exists" => $photosExists,
            "writable" => $photosWritable,
            "can_write_file" => $canWritePhotos,
            "permissions" => $photosExists ? substr(sprintf('%o', fileperms($photosDir)), -4) : 'N/A'
        ),
        "output_dir" => array(
            "path" => $outputDir,
            "exists" => $outputExists,
            "writable" => $outputWritable,
            "can_write_file" => $canWriteOutput,
            "permissions" => $outputExists ? substr(sprintf('%o', fileperms($outputDir)), -4) : 'N/A'
        )
    ),
    "php_config" => array(
        "max_upload_size" => $maxUploadSize,
        "max_post_size" => $maxPostSize,
        "memory_limit" => $memoryLimit,
        "max_execution_time" => $maxExecutionTime,
        "file_uploads" => ini_get('file_uploads'),
        "post_max_size" => ini_get('post_max_size'),
        "gd_enabled" => $gdEnabled,
        "gd_info" => $gdInfo
    ),
    "urls" => array(
        "server_root" => "https://" . ($_SERVER['SERVER_NAME'] ?? 'grey-frog-921983.hostingersite.com'),
        "api_endpoint" => "https://" . ($_SERVER['SERVER_NAME'] ?? 'grey-frog-921983.hostingersite.com') . "/api/",
        "photos_url" => "https://" . ($_SERVER['SERVER_NAME'] ?? 'grey-frog-921983.hostingersite.com') . "/photos/",
        "output_url" => "https://" . ($_SERVER['SERVER_NAME'] ?? 'grey-frog-921983.hostingersite.com') . "/output/"
    )
);

// Create some diagnostics and fixes
if (!$photosExists) {
    // Try to create photos directory
    try {
        mkdir($photosDir, 0777, true);
        $response["actions"][] = "Created photos directory: " . $photosDir;
        $response["filesystem"]["photos_dir"]["exists"] = is_dir($photosDir);
        $response["filesystem"]["photos_dir"]["writable"] = is_writable($photosDir);
    } catch (Exception $e) {
        $response["errors"][] = "Failed to create photos directory: " . $e->getMessage();
    }
}

if (!$outputExists) {
    // Try to create output directory
    try {
        mkdir($outputDir, 0777, true);
        $response["actions"][] = "Created output directory: " . $outputDir;
        $response["filesystem"]["output_dir"]["exists"] = is_dir($outputDir);
        $response["filesystem"]["output_dir"]["writable"] = is_writable($outputDir);
    } catch (Exception $e) {
        $response["errors"][] = "Failed to create output directory: " . $e->getMessage();
    }
}

// Return the response
echo json_encode($response, JSON_PRETTY_PRINT);
?> 