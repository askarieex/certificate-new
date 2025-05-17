<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if the request is a POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST method is allowed'
    ]);
    exit();
}

// Get the JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if input is valid
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid input. Username and password are required.'
    ]);
    exit();
}

// Extract credentials
$username = $data['username'];
$password = $data['password'];

// In a real application, you would validate against a database
// For this example, we'll use hardcoded credentials
$valid_users = [
    'manzoorahmad123' => [
        'password' => 'ManzoorAhmad@123', // In a real app, this would be hashed
        'name' => 'Manzoor Ahmad',
        'role' => 'admin'
    ],
    'teacher' => [
        'password' => 'teacher@2025',
        'name' => 'Teacher User',
        'role' => 'teacher'
    ]
];

// Check if the user exists and password matches
if (isset($valid_users[$username]) && $valid_users[$username]['password'] === $password) {
    // Generate a simple token (in a real app, use JWT or similar)
    $token = bin2hex(random_bytes(16));
    
    // Return success with user data
    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'user' => [
            'username' => $username,
            'name' => $valid_users[$username]['name'],
            'role' => $valid_users[$username]['role'],
            'token' => $token
        ]
    ]);
} else {
    // Invalid credentials
    http_response_code(401); // Unauthorized
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid username or password'
    ]);
} 