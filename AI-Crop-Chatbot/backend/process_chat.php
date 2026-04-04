<?php
// 1. Get the raw JSON from your JavaScript
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

$userMessage = $data['message'] ?? '';
$userImage = $data['image'] ?? null;

// 2. Prepare the payload for Python
$payload = json_encode([
    "message" => $userMessage,
    "image" => $userImage
]);

// 3. Set up the modern HTTP request options
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n" .
                     "Accept: application/json\r\n",
        'content' => $payload,
        'ignore_errors' => true // Allows us to see Python errors instead of just crashing
    ]
];

// 4. Fire the request to Python (port 5000)
$context  = stream_context_create($options);
$response = file_get_contents('http://127.0.0.1:5000/chat', false, $context);

// 5. Send the answer back to your UI
if ($response === FALSE) {
    echo json_encode(["reply" => "System Error: Python server is unreachable."]);
} else {
    echo $response;
}
?>