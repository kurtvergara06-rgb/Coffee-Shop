<?php
require_once __DIR__ . '/db.php';

// CSV export — optionally filter by date
$date = $_GET['date'] ?? null;
$params = [];
$where = '';
if($date) { $where = 'WHERE res_date = :date'; $params[':date'] = $date; }

try {
    $sql = "SELECT res_id,name,room,res_date,start_time,end_time,pax,email,equipment,total,status,created_at FROM reservations $where ORDER BY res_date ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="reservations_export.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, array_keys($rows[0] ?? ['res_id','name','room','res_date','start_time','end_time','pax','email','equipment','total','status','created_at']));
    foreach($rows as $r) {
        if(is_array($r['equipment'])) $r['equipment'] = json_encode($r['equipment']);
        fputcsv($out, $r);
    }
    fclose($out);
    exit;
} catch(Exception $e) {
    http_response_code(500);
    echo 'Export failed: ' . $e->getMessage();
}

?>
