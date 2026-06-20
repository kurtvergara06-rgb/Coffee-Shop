<?php
require_once __DIR__ . '/db.php';

// Ensure clients receive JSON
header('Content-Type: application/json; charset=utf-8');

$id = $_POST['id'] ?? null;
if(!$id){
    echo json_encode(['ok'=>false,'error'=>'Missing id']);
    exit;
}
try{
    $stmt = $pdo->prepare('DELETE FROM reservations WHERE id=:id');
    $stmt->execute([':id'=>$id]);
    echo json_encode(['ok'=>true]);
}catch(Exception $e){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}

?>
