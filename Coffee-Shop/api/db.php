<?php
// db.php - PDO database connection. Edit the credentials as needed for your XAMPP install.
$DB_HOST = '127.0.0.1';
$DB_PORT = '3306';
$DB_NAME = 'coffee_shop';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $dsn = "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

function jsonResponse($arr) {
    header('Content-Type: application/json');
    echo json_encode($arr);
    exit;
}

?>
