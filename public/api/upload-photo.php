<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

// Log to file
$logFile = __DIR__ . '/upload-log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Upload request received\n", FILE_APPEND);
file_put_contents($logFile, "Server information: " . php_uname() . "\n", FILE_APPEND);
file_put_contents($logFile, "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "\n", FILE_APPEND);
file_put_contents($logFile, "Request URI: " . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);
file_put_contents($logFile, "Remote address: " . $_SERVER['REMOTE_ADDR'] . "\n", FILE_APPEND);

// Error handling
try {
    // Check if we have a file upload
    if (!isset($_FILES['photo'])) {
        file_put_contents($logFile, "No photo file in request. POST data: " . print_r($_POST, true) . "\n", FILE_APPEND);
        file_put_contents($logFile, "FILES array: " . print_r($_FILES, true) . "\n", FILE_APPEND);
        throw new Exception("No file uploaded - FILES array empty");
    }
    
    if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = $_FILES['photo']['error'];
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        
        $errorMessage = isset($errorMessages[$errorCode]) ? $errorMessages[$errorCode] : 'Unknown upload error';
        file_put_contents($logFile, "Upload error: " . $errorMessage . " (Code: " . $errorCode . ")\n", FILE_APPEND);
        throw new Exception("Upload error: " . $errorMessage);
    }
    
    // Log file details
    file_put_contents($logFile, "File received: " . $_FILES['photo']['name'] . ", Size: " . $_FILES['photo']['size'] . " bytes\n", FILE_APPEND);
    file_put_contents($logFile, "Temporary file: " . $_FILES['photo']['tmp_name'] . "\n", FILE_APPEND);
    
    // Get the file details
    $file = $_FILES['photo'];
    $fileName = isset($_POST['fileName']) ? $_POST['fileName'] : uniqid() . '.jpg';
    file_put_contents($logFile, "Using filename: " . $fileName . "\n", FILE_APPEND);
    
    // Set up the photos directory - TWO LEVELS UP FROM API DIRECTORY
    $photosDir = dirname(dirname(__FILE__)) . '/photos/';
    file_put_contents($logFile, "Photos directory path: " . $photosDir . "\n", FILE_APPEND);
    
    if (!is_dir($photosDir)) {
        file_put_contents($logFile, "Creating photos directory...\n", FILE_APPEND);
        if (!mkdir($photosDir, 0777, true)) {
            file_put_contents($logFile, "Failed to create directory with error: " . error_get_last()['message'] . "\n", FILE_APPEND);
            throw new Exception("Failed to create photos directory at: " . $photosDir);
        }
        // Set more permissive permissions for new directory
        chmod($photosDir, 0777);
        file_put_contents($logFile, "Directory created with permissions 0777\n", FILE_APPEND);
    }
    
    // Make sure the directory is writable
    if (!is_writable($photosDir)) {
        // Try to set permissions
        chmod($photosDir, 0777);
        file_put_contents($logFile, "Changed directory permissions to 0777\n", FILE_APPEND);
        
        if (!is_writable($photosDir)) {
            file_put_contents($logFile, "Directory still not writable after chmod: " . $photosDir . "\n", FILE_APPEND);
            throw new Exception("Photos directory is not writable: " . $photosDir);
        }
    }
    
    // Save the photo
    $targetPath = $photosDir . $fileName;
    file_put_contents($logFile, "Saving to: " . $targetPath . "\n", FILE_APPEND);
    
    $uploadSuccess = false;
    
    // First attempt: move_uploaded_file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $uploadSuccess = true;
        file_put_contents($logFile, "File saved successfully using move_uploaded_file\n", FILE_APPEND);
    } else {
        $moveError = error_get_last();
        file_put_contents($logFile, "move_uploaded_file failed: " . ($moveError ? $moveError['message'] : "Unknown error") . "\n", FILE_APPEND);
        
        // Second attempt: file_put_contents as fallback
        $fileContents = file_get_contents($file['tmp_name']);
        if ($fileContents !== false) {
            $writeResult = file_put_contents($targetPath, $fileContents);
            if ($writeResult !== false) {
                $uploadSuccess = true;
                file_put_contents($logFile, "File saved successfully using file_put_contents: " . $writeResult . " bytes written\n", FILE_APPEND);
            } else {
                $putError = error_get_last();
                file_put_contents($logFile, "file_put_contents failed: " . ($putError ? $putError['message'] : "Unknown error") . "\n", FILE_APPEND);
            }
        } else {
            $getError = error_get_last();
            file_put_contents($logFile, "file_get_contents failed: " . ($getError ? $getError['message'] : "Unknown error") . "\n", FILE_APPEND);
        }
    }
    
    if (!$uploadSuccess) {
        throw new Exception("Failed to save the file using both move_uploaded_file and file_put_contents");
    }
    
    // Verify the file actually exists
    if (file_exists($targetPath)) {
        $fileSize = filesize($targetPath);
        file_put_contents($logFile, "File verified: exists at " . $targetPath . ", size: " . $fileSize . " bytes\n", FILE_APPEND);
    } else {
        file_put_contents($logFile, "WARNING: File does not exist after save: " . $targetPath . "\n", FILE_APPEND);
    }
    
    // Create response with public URL
    $serverName = $_SERVER['SERVER_NAME'] ?: 'grey-frog-921983.hostingersite.com';
    $isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    $protocol = $isHttps ? 'https://' : 'http://';
    $baseUrl = $protocol . $serverName;
    
    $publicPath = '/photos/' . $fileName;
    $fullUrl = $baseUrl . $publicPath;
    file_put_contents($logFile, "Full public URL: " . $fullUrl . "\n", FILE_APPEND);
    
    // Create success response
    $response = [
        "status" => "success",
        "photoPath" => $publicPath,
        "fullUrl" => $fullUrl,
        "debug" => [
            "fileName" => $fileName,
            "targetPath" => $targetPath,
            "fileSize" => file_exists($targetPath) ? filesize($targetPath) : 0,
            "timestamp" => date('Y-m-d H:i:s'),
            "server" => $serverName
        ]
    ];
    
    file_put_contents($logFile, "Response: " . json_encode($response) . "\n", FILE_APPEND);
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log error
    file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($logFile, "Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    
    // Return error
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "debug" => [
            "serverInfo" => php_uname(),
            "phpVersion" => phpversion(),
            "uploadMaxFilesize" => ini_get('upload_max_filesize'),
            "postMaxSize" => ini_get('post_max_size'),
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);
}
?> 