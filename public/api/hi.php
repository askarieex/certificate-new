<?php
// Required headers for CORS
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
    "message" => "Hello from Hostinger API",
    "time" => date('Y-m-d H:i:s'),
    "server" => $_SERVER['SERVER_NAME'],
    "php_version" => phpversion(),
    "cors" => "enabled"
);

// Return response
echo json_encode($response, JSON_PRETTY_PRINT);
?>