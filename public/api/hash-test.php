<?php
// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");

// Function to hash password
function hashPassword($password) {
    return hash('sha256', $password);
}

// Test with the actual password
$password = 'ManzoorAhmad@123';
$hash = hashPassword($password);

// Output the result
echo json_encode([
    'password' => $password,
    'hash' => $hash,
    'expected' => '2b1e9ec25d0d4fcdd979ab3e946b2b11c8b0c10f3c5c909892685fb0c5bc9dcf',
    'matches' => $hash === '2b1e9ec25d0d4fcdd979ab3e946b2b11c8b0c10f3c5c909892685fb0c5bc9dcf'
]); 