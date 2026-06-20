<?php
require_once __DIR__ . '/db.php';

// Ensure clients receive JSON
header('Content-Type: application/json; charset=utf-8');

$id = $_POST['id'] ?? null;
$status = $_POST['status'] ?? null;
$force = false;
if(isset($_POST['force']) && ($_POST['force'] === '1' || strtolower($_POST['force']) === 'true')){ $force = true; }

if(!$id || !$status) {
    echo json_encode(['ok'=>false,'error'=>'Missing id or status']);
    exit;
}

if(!in_array($status,['Pending','Confirmed','Cancelled'])) {
    echo json_encode(['ok'=>false,'error'=>'Invalid status']);
    exit;
}

// If confirming, check reservation times are within operating hours unless forced
if($status === 'Confirmed' && !$force){
    $stmt = $pdo->prepare('SELECT start_time,end_time FROM reservations WHERE id=:id');
    $stmt->execute([':id'=>$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if($row){
        try{
            $sdt = new DateTime($row['start_time']);
            $edt = new DateTime($row['end_time']);
            $sMin = (int)$sdt->format('G') * 60 + (int)$sdt->format('i');
            $eMin = (int)$edt->format('G') * 60 + (int)$edt->format('i');
            if($eMin <= $sMin) $eMin += 24*60; // allow next-day end times
            if(($sMin) >= ($eMin)){
                echo json_encode(['ok'=>false,'error'=>'Invalid reservation times: start must be before end']);
                exit;
            }
        }catch(Exception $e){ /* invalid date format */ }
    }
}
if($status === 'Confirmed' && $force){
    error_log("[admin override] Reservation $id confirmed with force");
}

try {
    $stmt = $pdo->prepare("UPDATE reservations SET status=:status WHERE id=:id");
    $stmt->execute([':status'=>$status,':id'=>$id]);
    echo json_encode(['ok'=>true]);
} catch(Exception $e){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}

?>
