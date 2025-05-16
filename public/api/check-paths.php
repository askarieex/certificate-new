<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize response
$response = array(
    "status" => "success",
    "message" => "Server path information",
    "paths" => array(),
    "debug" => array()
);

// Check document root
$response["paths"]["document_root"] = $_SERVER["DOCUMENT_ROOT"];

// Check parent directory
$apiDir = __DIR__;
$response["paths"]["api_dir"] = $apiDir;

// Check public_html directory
$publicHtml = dirname(dirname($apiDir));
$response["paths"]["public_html"] = $publicHtml;

// Check output directory
$outputDir = $publicHtml . "/output";
$response["paths"]["output_dir"] = $outputDir;

// Check if output directory exists
$response["debug"]["output_exists"] = is_dir($outputDir) ? "Yes" : "No";

// Create output directory if it doesn't exist
if (!is_dir($outputDir)) {
    $mkdirResult = mkdir($outputDir, 0755, true);
    $response["debug"]["mkdir_result"] = $mkdirResult ? "Success" : "Failed";
}

// Check output directory permissions
$response["debug"]["output_permissions"] = decoct(fileperms($outputDir) & 0777);
$response["debug"]["output_writable"] = is_writable($outputDir) ? "Yes" : "No";

// Try to create a test file
$testFile = $outputDir . "/test.txt";
$writeResult = file_put_contents($testFile, "Test file created: " . date("Y-m-d H:i:s"));
$response["debug"]["write_test"] = ($writeResult !== false) ? "Success ($writeResult bytes)" : "Failed";
$response["debug"]["file_exists"] = file_exists($testFile) ? "Yes" : "No";

// Return the response
echo json_encode($response, JSON_PRETTY_PRINT);
?> 