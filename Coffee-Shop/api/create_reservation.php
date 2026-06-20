<?php
require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
if(!$input) jsonResponse(['ok' => false, 'error' => 'Invalid JSON']);

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$room = $input['room'] ?? 'study';
$date = $input['date'] ?? null; // 'YYYY-MM-DD'
$start = $input['start'] ?? null; // ISO datetime
$end = $input['end'] ?? null;     // ISO datetime
$pax = (int)($input['pax'] ?? 1);
$equipment = isset($input['equipment']) ? json_encode($input['equipment']) : null;
$total = (float)($input['total'] ?? 0);

if(!$email || !$date || !$start || !$end) jsonResponse(['ok' => false, 'error' => 'Missing required fields']);

// Validate datetimes: ensure start < end (allow overnight by treating end <= start as next day)
try{
    $sdt = new DateTime($start);
    $edt = new DateTime($end);
    $sMin = (int)$sdt->format('G') * 60 + (int)$sdt->format('i');
    $eMin = (int)$edt->format('G') * 60 + (int)$edt->format('i');
    // If end time is less-or-equal than start time, assume it is the next day
    if($eMin <= $sMin) $eMin += 24*60;

    if($sMin < 0 || $eMin < 0 || $sMin >= 24*60 || $eMin > 48*60){
        jsonResponse(['ok'=>false,'error'=>'Invalid reservation times']);
    }

    if(($sMin) >= ($eMin)) { jsonResponse(['ok'=>false,'error'=>'Start must be before end']); }
}catch(Exception $e){ jsonResponse(['ok'=>false,'error'=>'Invalid datetime format']); }

// Validate Function room: must be private (no overlapping bookings)
if(strtolower(trim($room)) === 'function'){
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reservations WHERE room = :room AND res_date = :date AND status != 'Cancelled' AND ((start_time < :end AND end_time > :start))");
    $stmt->execute([':room' => $room, ':date' => $date, ':start' => $start, ':end' => $end]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if($row['count'] > 0){
        jsonResponse(['ok'=>false,'error'=>'Function room is already booked for this time. Max capacity: 20 pax.']);
    }
}

// Validate Study room capacity: max 20 pax per date
if(strtolower(trim($room)) === 'study'){
    $stmt = $pdo->prepare("SELECT SUM(pax) as total_pax FROM reservations WHERE room = :room AND res_date = :date AND status != 'Cancelled' AND ((start_time < :end AND end_time > :start))");
    $stmt->execute([':room' => $room, ':date' => $date, ':start' => $start, ':end' => $end]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $current_pax = (int)($row['total_pax'] ?? 0);
    if($current_pax + $pax > 20){
        jsonResponse(['ok'=>false,'error'=>'Study room capacity exceeded for this time slot. Max 20 pax.']);
    }
}

// Generate a user-friendly reservation ID
$res_id = 'R#' . strtoupper(substr(sha1(uniqid('', true)), 0, 10));

try {
    $sql = "INSERT INTO reservations (res_id, name, room, res_date, start_time, end_time, pax, email, equipment, total) VALUES (:res_id,:name,:room,:res_date,:start_time,:end_time,:pax,:email,:equipment,:total)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':res_id' => $res_id,
        ':name' => $name,
        ':room' => $room,
        ':res_date' => $date,
        ':start_time' => $start,
        ':end_time' => $end,
        ':pax' => $pax,
        ':email' => $email,
        ':equipment' => $equipment,
        ':total' => $total,
    ]);
    jsonResponse(['ok' => true, 'res_id' => $res_id]);
} catch (Exception $e) {
    http_response_code(500);
    jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
}

?>
