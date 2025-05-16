<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// For debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log to file
$logFile = __DIR__ . '/fix-permissions-log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Permission fix started\n", FILE_APPEND);

// Initialize response
$response = array(
    "status" => "success",
    "message" => "Permission fix attempted",
    "actions" => array(),
    "errors" => array()
);

try {
    // Get the document root
    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    $response["actions"][] = "Document root identified as: " . $docRoot;
    file_put_contents($logFile, "Document root: " . $docRoot . "\n", FILE_APPEND);
    
    // Get the API directory
    $apiDir = __DIR__;
    $response["actions"][] = "API directory identified as: " . $apiDir;
    file_put_contents($logFile, "API directory: " . $apiDir . "\n", FILE_APPEND);
    
    // Get the public_html directory (2 levels up)
    $publicHtml = dirname(dirname($apiDir));
    $response["actions"][] = "Root directory identified as: " . $publicHtml;
    file_put_contents($logFile, "Root directory: " . $publicHtml . "\n", FILE_APPEND);
    
    // Define paths to fix
    $dirs = array(
        $publicHtml . "/output",
        $publicHtml . "/photos"
    );
    
    // Create and fix permissions for each directory
    foreach ($dirs as $dir) {
        // Create directory if it doesn't exist
        if (!is_dir($dir)) {
            file_put_contents($logFile, "Creating directory: " . $dir . "\n", FILE_APPEND);
            $result = mkdir($dir, 0755, true);
            $response["actions"][] = "Created directory: " . $dir . " - " . ($result ? "Success" : "Failed");
            file_put_contents($logFile, "Created directory: " . $dir . " - " . ($result ? "Success" : "Failed") . "\n", FILE_APPEND);
        } else {
            $response["actions"][] = "Directory already exists: " . $dir;
            file_put_contents($logFile, "Directory already exists: " . $dir . "\n", FILE_APPEND);
        }
        
        // Set permissions
        $chmodResult = chmod($dir, 0755);
        $response["actions"][] = "Set permissions (0755) on: " . $dir . " - " . ($chmodResult ? "Success" : "Failed");
        file_put_contents($logFile, "Set permissions (0755) on: " . $dir . " - " . ($chmodResult ? "Success" : "Failed") . "\n", FILE_APPEND);
        
        // Create a test file
        $testFile = $dir . "/test_" . time() . ".txt";
        $writeResult = file_put_contents($testFile, "Test file created on " . date('Y-m-d H:i:s'));
        $response["actions"][] = "Created test file: " . $testFile . " - " . ($writeResult !== false ? "Success" : "Failed");
        file_put_contents($logFile, "Created test file: " . $testFile . " - " . ($writeResult !== false ? "Success" : "Failed") . "\n", FILE_APPEND);
    }
    
    // Create .htaccess files if they don't exist
    $htaccessContent = "
# Allow access from all domains
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin \"*\"
    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS\"
    Header set Access-Control-Allow-Headers \"Origin, X-Requested-With, Content-Type, Accept\"
</IfModule>

# Enable directory browsing
Options +Indexes
Options +FollowSymLinks

# Disable caching
<IfModule mod_expires.c>
    ExpiresActive Off
</IfModule>
<IfModule mod_headers.c>
    Header set Cache-Control \"no-cache, no-store, must-revalidate\"
    Header set Pragma \"no-cache\"
    Header set Expires \"0\"
</IfModule>
";
    
    foreach ($dirs as $dir) {
        $htaccessFile = $dir . "/.htaccess";
        if (!file_exists($htaccessFile)) {
            $result = file_put_contents($htaccessFile, $htaccessContent);
            $response["actions"][] = "Created .htaccess in: " . $dir . " - " . ($result !== false ? "Success" : "Failed");
            file_put_contents($logFile, "Created .htaccess in: " . $dir . " - " . ($result !== false ? "Success" : "Failed") . "\n", FILE_APPEND);
        } else {
            $response["actions"][] = ".htaccess already exists in: " . $dir;
            file_put_contents($logFile, ".htaccess already exists in: " . $dir . "\n", FILE_APPEND);
        }
    }
    
    // Create index.php files to list directory contents
    $indexContent = '<?php
header("Access-Control-Allow-Origin: *");
$dir = __DIR__;
echo "<html><head><title>Directory Listing</title>";
echo "<style>
body { font-family: Arial, sans-serif; margin: 20px; background: #f7f7f7; }
h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
ul { list-style-type: none; padding: 0; }
li { margin: 8px 0; padding: 8px; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
a { color: #0066cc; text-decoration: none; display: block; }
a:hover { text-decoration: underline; }
.timestamp { color: #666; font-size: 12px; margin-top: 4px; }
.size { color: #080; }
</style>";
echo "</head><body>";
echo "<h1>Directory Contents</h1>";
echo "<ul>";
$files = scandir($dir);
foreach ($files as $file) {
    if ($file != "." && $file != ".." && $file != "index.php" && $file != ".htaccess") {
        $filePath = $dir . "/" . $file;
        $size = file_exists($filePath) ? filesize($filePath) : 0;
        $modified = file_exists($filePath) ? date("Y-m-d H:i:s", filemtime($filePath)) : "";
        echo "<li>";
        echo "<a href=\"" . $file . "\">" . $file . "</a>";
        echo "<div class=\"timestamp\">Modified: " . $modified . " <span class=\"size\">(" . formatBytes($size) . ")</span></div>";
        echo "</li>";
    }
}
echo "</ul>";
echo "<p style=\"margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; color: #666;\">Generated on " . date("Y-m-d H:i:s") . "</p>";
echo "</body></html>";

function formatBytes($bytes, $precision = 2) {
    $units = array("B", "KB", "MB", "GB", "TB");
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . " " . $units[$pow];
}
?>';
    
    foreach ($dirs as $dir) {
        $indexFile = $dir . "/index.php";
        if (!file_exists($indexFile)) {
            $result = file_put_contents($indexFile, $indexContent);
            $response["actions"][] = "Created index.php in: " . $dir . " - " . ($result !== false ? "Success" : "Failed");
            file_put_contents($logFile, "Created index.php in: " . $dir . " - " . ($result !== false ? "Success" : "Failed") . "\n", FILE_APPEND);
        } else {
            $response["actions"][] = "index.php already exists in: " . $dir;
            file_put_contents($logFile, "index.php already exists in: " . $dir . "\n", FILE_APPEND);
        }
    }
    
    // Test creating some empty folders for organization
    $sampleFolders = array("staff", "students", "classes");
    foreach ($sampleFolders as $folder) {
        $folderPath = $publicHtml . "/photos/" . $folder;
        if (!is_dir($folderPath)) {
            $result = mkdir($folderPath, 0755, true);
            $response["actions"][] = "Created sample folder: " . $folder . " - " . ($result ? "Success" : "Failed");
            file_put_contents($logFile, "Created sample folder: " . $folder . " - " . ($result ? "Success" : "Failed") . "\n", FILE_APPEND);
        }
    }
    
    // Summary
    $response["message"] = "Permissions and directories setup successfully";
    file_put_contents($logFile, "Permission fix completed successfully\n", FILE_APPEND);
    
} catch (Exception $e) {
    $response["status"] = "error";
    $response["message"] = "An error occurred";
    $response["errors"][] = $e->getMessage();
    file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
}

// Return response
echo json_encode($response, JSON_PRETTY_PRINT);
?> 