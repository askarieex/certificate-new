<?php
// Set headers for plain text response
header("Content-Type: text/plain");

// Define paths to check
$excelDir = __DIR__ . '/../excel';
$userExcelDir = $excelDir . '/test-user';
$testFile = $userExcelDir . '/test-file.txt';

// Results
$results = [];

// Check if Excel directory exists
if (file_exists($excelDir)) {
    $results[] = "✅ Excel directory exists: $excelDir";
} else {
    // Try to create it
    if (mkdir($excelDir, 0777, true)) {
        $results[] = "✅ Created Excel directory: $excelDir";
        // Make it writable
        chmod($excelDir, 0777);
        $results[] = "   Set permissions to 0777";
    } else {
        $results[] = "❌ Excel directory does not exist and could not be created: $excelDir";
        $results[] = "   Error: " . error_get_last()['message'];
    }
}

// Check Excel directory permissions
if (file_exists($excelDir)) {
    if (is_writable($excelDir)) {
        $results[] = "✅ Excel directory is writable";
    } else {
        $results[] = "❌ Excel directory is not writable";
        // Try to fix it
        if (chmod($excelDir, 0777)) {
            $results[] = "   Successfully changed permissions to 0777";
            if (is_writable($excelDir)) {
                $results[] = "   Now directory is writable";
            } else {
                $results[] = "   Directory is still not writable despite chmod";
            }
        } else {
            $results[] = "   Failed to change permissions: " . error_get_last()['message'];
        }
    }
}

// Check if we can create a subdirectory
if (file_exists($userExcelDir)) {
    $results[] = "✅ Test user directory already exists: $userExcelDir";
} else {
    if (mkdir($userExcelDir, 0777, true)) {
        $results[] = "✅ Successfully created test user directory: $userExcelDir";
        chmod($userExcelDir, 0777);
    } else {
        $results[] = "❌ Could not create test user directory: $userExcelDir";
        $results[] = "   Error: " . error_get_last()['message'];
    }
}

// Check if we can write a file
if (file_put_contents($testFile, "This is a test file created at " . date('Y-m-d H:i:s'))) {
    $results[] = "✅ Successfully wrote test file: $testFile";
    // Try to delete it
    if (unlink($testFile)) {
        $results[] = "✅ Successfully deleted test file";
    } else {
        $results[] = "❌ Could not delete test file: $testFile";
        $results[] = "   Error: " . error_get_last()['message'];
    }
} else {
    $results[] = "❌ Could not write test file: $testFile";
    $results[] = "   Error: " . error_get_last()['message'];
}

// Show server info
$results[] = "\nServer Information:";
$results[] = "PHP Version: " . phpversion();
$results[] = "Server User: " . (function_exists('get_current_user') ? get_current_user() : 'Unknown');
$results[] = "File Owner ID: " . fileowner(__FILE__);
$results[] = "Current Directory: " . __DIR__;
$results[] = "Parent Directory: " . dirname(__DIR__);
$results[] = "Free Disk Space: " . round(disk_free_space(__DIR__) / (1024 * 1024 * 1024), 2) . " GB";

// Output the results
echo implode("\n", $results);
?> 