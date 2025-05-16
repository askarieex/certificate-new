<?php
// Required headers for CORS support
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Test specific image access
$testImage = '93052fcc-116a-48cc-acc9-ff47d69ef40f_gck88i7q.jpg';
$photosDir = dirname(dirname(__FILE__)) . '/photos/';
$imagePath = $photosDir . $testImage;

// Check server environment
$response = [
    "status" => "success",
    "message" => "CORS test completed",
    "timestamp" => date('Y-m-d H:i:s'),
    "server_info" => [
        "server_name" => $_SERVER['SERVER_NAME'] ?? 'unknown',
        "server_software" => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        "document_root" => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        "script_path" => __FILE__,
        "php_version" => phpversion(),
        "request_scheme" => $_SERVER['REQUEST_SCHEME'] ?? ($_SERVER['HTTPS'] === 'on' ? 'https' : 'http'),
        "http_host" => $_SERVER['HTTP_HOST'] ?? 'unknown',
        "remote_addr" => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ],
    "image_test" => [
        "test_image" => $testImage,
        "full_path" => $imagePath,
        "exists" => file_exists($imagePath),
        "size" => file_exists($imagePath) ? filesize($imagePath) : 0,
        "permissions" => file_exists($imagePath) ? substr(sprintf('%o', fileperms($imagePath)), -4) : 'N/A',
        "dir_exists" => is_dir($photosDir),
        "dir_permissions" => is_dir($photosDir) ? substr(sprintf('%o', fileperms($photosDir)), -4) : 'N/A',
        "dir_writable" => is_writable($photosDir)
    ]
];

// Test creating a small test image to verify permissions
$testCreated = false;
$testCreationError = '';
try {
    $testFileName = 'cors_test_' . time() . '.txt';
    $testFilePath = $photosDir . $testFileName;
    $testContent = 'CORS test file created at ' . date('Y-m-d H:i:s');
    
    if (is_writable($photosDir)) {
        file_put_contents($testFilePath, $testContent);
        $testCreated = file_exists($testFilePath);
        
        // Add to response
        $response['image_test']['test_file_created'] = $testCreated;
        $response['image_test']['test_file_path'] = $testFilePath;
        
        // Clean up
        if ($testCreated) {
            unlink($testFilePath);
            $response['image_test']['test_file_cleaned'] = true;
        }
    } else {
        $testCreationError = 'Photos directory is not writable';
    }
} catch (Exception $e) {
    $testCreationError = $e->getMessage();
}

$response['image_test']['test_creation_error'] = $testCreationError;

// Generate proper URLs for testing
$baseUrl = $_SERVER['REQUEST_SCHEME'] ?? 'https';
$baseUrl .= '://';
$baseUrl .= $_SERVER['HTTP_HOST'] ?? 'grey-frog-921983.hostingersite.com';

// Test URLs
$response['test_urls'] = [
    'photos_directory' => $baseUrl . '/photos/',
    'test_image' => $baseUrl . '/photos/' . $testImage,
    'api_directory' => $baseUrl . '/api/',
    'this_script' => $baseUrl . '/api/cors-test.php'
];

// Check if .htaccess exists in photos directory
$htaccessPath = $photosDir . '.htaccess';
$response['htaccess'] = [
    'exists' => file_exists($htaccessPath),
    'path' => $htaccessPath
];

// If .htaccess doesn't exist, create one with CORS headers
if (!file_exists($htaccessPath) && is_writable($photosDir)) {
    $htaccessContent = <<<EOT
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
</IfModule>
EOT;
    
    file_put_contents($htaccessPath, $htaccessContent);
    $response['htaccess']['created'] = file_exists($htaccessPath);
    $response['htaccess']['content'] = $htaccessContent;
}

// Return the response
echo json_encode($response, JSON_PRETTY_PRINT);
?> 