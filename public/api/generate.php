<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// For debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load composer dependencies if available
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
}

// Log to file
$logFile = __DIR__ . '/generate-log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Certificate generation request received\n", FILE_APPEND);

// Error handling
try {
    // Get the posted data
    $postData = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($postData['students']) || !is_array($postData['students'])) {
        throw new Exception("No student data provided.");
    }
    
    $students = $postData['students'];
    $includePhotos = isset($postData['includePhotos']) ? (bool)$postData['includePhotos'] : true;
    
    // Set up directories
    $outputDir = __DIR__ . '/../../output/';
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0755, true);
    }
    
    $photosDir = __DIR__ . '/../../photos/';
    if (!is_dir($photosDir)) {
        mkdir($photosDir, 0755, true);
    }
    
    // Log directories
    file_put_contents($logFile, "Output directory: " . $outputDir . "\n", FILE_APPEND);
    file_put_contents($logFile, "Photos directory: " . $photosDir . "\n", FILE_APPEND);
    
    $results = [];
    
    // Generate certificates for each student
    foreach ($students as $student) {
        // Skip if required data is missing
        if (empty($student['name']) || empty($student['dob'])) {
            continue;
        }
        
        // Create a safe filename
        $safeName = preg_replace('/[^a-zA-Z0-9_]/', '_', $student['name']);
        $certificateFileName = $safeName . '_certificate';
        
        // Generate the HTML content
        $htmlContent = generateHtmlCertificate($student, $includePhotos, $photosDir);
        
        // Save the HTML file
        $htmlFilePath = $outputDir . $certificateFileName . '.html';
        file_put_contents($htmlFilePath, $htmlContent);
        
        // Try to generate PDF if tools are available
        $pdfFilePath = $outputDir . $certificateFileName . '.pdf';
        $pdfGenerated = false;
        
        // Add to results
        $results[] = [
            'studentId' => $student['id'],
            'studentName' => $student['name'],
            'htmlPath' => '/output/' . $certificateFileName . '.html',
            'pdfPath' => $pdfGenerated ? '/output/' . $certificateFileName . '.pdf' : null
        ];
        
        // Log success
        file_put_contents($logFile, "Generated certificate for: " . $student['name'] . "\n", FILE_APPEND);
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => count($results) . ' certificates generated',
        'data' => $results
    ]);
    
} catch (Exception $e) {
    // Log error
    file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Generate HTML certificate for a student
 */
function generateHtmlCertificate($student, $includePhotos, $photosDir) {
    // Start HTML content
    $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOB Certificate - ' . htmlspecialchars($student['name']) . '</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            color: #000;
            background-color: #fff;
        }
        .certificate {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #000;
            position: relative;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #b00;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .office-title {
            font-size: 18px;
            color: #06b;
            margin-bottom: 20px;
        }
        .divider {
            border-bottom: 1px solid #000;
            margin: 10px 0;
        }
        .student-photo {
            float: left;
            width: 120px;
            height: 150px;
            border: 1px solid #000;
            margin-right: 20px;
        }
        .content {
            margin-top: 30px;
        }
        .to-whom {
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .certificate-text {
            text-align: justify;
            font-size: 16px;
        }
        .signature {
            margin-top: 60px;
            text-align: right;
        }
        .signature-line {
            width: 200px;
            border-top: 1px solid #000;
            margin-left: auto;
            padding-top: 5px;
        }
        .date {
            margin-top: 40px;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .certificate {
                border: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="office-title">OFFICE OF THE HEADMASTER</div>
            <div class="school-name">GOVT.MIDDLE SCHOOL SHIGANPORA-A</div>
        </div>
        <div class="divider"></div>';
    
    // Add student photo if available and requested
    if ($includePhotos && !empty($student['photoPath'])) {
        $photoPath = $student['photoPath'];
        // Check if it's a relative path or full URL
        if (substr($photoPath, 0, 4) !== 'http' && substr($photoPath, 0, 1) === '/') {
            // It's a relative path from the web root
            $html .= '<img src="' . htmlspecialchars($photoPath) . '" alt="Student Photo" class="student-photo">';
        } else {
            // It's a full URL or path without leading slash
            $html .= '<img src="' . htmlspecialchars($photoPath) . '" alt="Student Photo" class="student-photo">';
        }
    }
    
    $html .= '
        <div class="content">
            <div class="to-whom">TO WHOM IT MAY CONCERN</div>
            
            <div class="certificate-text">
                <p>It is certified that' . htmlspecialchars($student['name']) . ' S/D/O' . htmlspecialchars($student['fatherName']) . ' ' . htmlspecialchars($student['motherName']) . '</p>
                
                <p>R/O is/was reading in our Institute. His/her date of birth as per our school records is (in numbers) ' . htmlspecialchars($student['dob']) . '</p>
                
                <p>and</p>
                
                <p>In words (' . htmlspecialchars($student['dobInWords']) . ')</p>
                
                <p>Hence, Date of birth certificate is being issued in his/her favor.</p>
            </div>
            
            <div class="date">
                <p>Dated: ' . date('d-m-Y') . '</p>
            </div>
            
            <div class="signature">
                <div class="signature-line">Headmaster</div>
            </div>
        </div>
    </div>
</body>
</html>';
    
    return $html;
} 