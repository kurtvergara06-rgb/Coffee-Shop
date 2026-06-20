<?php
require_once __DIR__ . '/db.php';

// Ensure clients receive JSON
header('Content-Type: application/json; charset=utf-8');

$q = $_POST; // accept form-encoded data currently
$id = $q['id'] ?? null;
if(!$id){
    echo json_encode(['ok'=>false,'error'=>'Missing id']);
    exit;
}

$allowed = ['name','email','room','res_date','start_time','end_time','pax','equipment','total','status'];
$sets = [];
$params = [];
foreach($allowed as $f){
    if(isset($q[$f])){
        $sets[] = "`$f` = :$f";
        // Basic type casting for numeric fields
        if($f === 'pax') $params[":$f"] = (int)$q[$f];
        else if($f === 'total') $params[":$f"] = (float)$q[$f];
        else $params[":$f"] = $q[$f];
    }
}
// Determine if a force override is requested; admin UI sends 'force' param as '1' or 'true'
$force = false;
if(isset($q['force']) && ($q['force'] === '1' || strtolower($q['force']) === 'true')){ $force = true; }

// Validate times if both start_time and end_time are being updated (unless forced)
if(isset($q['start_time']) && isset($q['end_time'])){
    try{
        $sdt = new DateTime($q['start_time']);
        $edt = new DateTime($q['end_time']);
        $sMin = (int)$sdt->format('G') * 60 + (int)$sdt->format('i');
        $eMin = (int)$edt->format('G') * 60 + (int)$edt->format('i');
        // If end is earlier or equal to start, treat end as next day (allow overnight)
        if($eMin <= $sMin) $eMin += 24*60;

        if($force){ error_log("[admin override] Reservation $id update performed with force (start:{$q['start_time']}, end:{$q['end_time']})"); }
        if(($sMin) >= ($eMin)){ echo json_encode(['ok'=>false,'error'=>'Start must be before end']); exit; }
    }catch(Exception $e){ echo json_encode(['ok'=>false,'error'=>'Invalid datetime format']); exit; }
}
// If status provided, validate it
if(isset($q['status']) && !in_array($q['status'], ['Pending','Confirmed','Cancelled'])){
    echo json_encode(['ok'=>false,'error' => 'Invalid status']);
    exit;
}
if(!count($sets)){
    echo json_encode(['ok'=>false,'error'=>'No fields to update']);
    exit;
}
$params[':id'] = $id;
try{
    $sql = "UPDATE reservations SET " . implode(', ', $sets) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['ok'=>true]);
}catch(Exception $e){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=> $e->getMessage()]);
}

?>
