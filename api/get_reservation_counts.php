<?php
require_once __DIR__ . '/db.php';

// Always return JSON from this endpoint
header('Content-Type: application/json; charset=utf-8');

$q = $_GET;
$filters = [];
$searchVal = '';
if(!empty($q['date'])) {
    $filters[] = ['field' => 'res_date', 'op' => '=', 'value' => $q['date']];
}
if(!empty($q['status'])) {
    $filters[] = ['field' => 'status', 'op' => '=', 'value' => $q['status']];
}
if(!empty($q['room'])) {
    $filters[] = ['field' => 'room', 'op' => '=', 'value' => $q['room']];
}

$whereSql = '';
$params = [];
if(count($filters)){
    $parts = [];
    foreach($filters as $i=>$f){
        $parts[] = "`{$f['field']}` {$f['op']} :f$i";
        $params[":f$i"] = $f['value'];
    }
    $whereSql = 'WHERE ' . implode(' AND ', $parts);
}

if(!empty($q['search'])){
    $searchVal = strtolower($q['search']);
    $s = '%' . $searchVal . '%';
    $searchClause = "(LOWER(name) LIKE :s OR LOWER(email) LIKE :s OR LOWER(res_id) LIKE :s)";
    if($whereSql) $whereSql .= ' AND ' . $searchClause;
    else $whereSql = 'WHERE ' . $searchClause;
    $params[':s'] = $s;
}

try{
    $sql = "SELECT COUNT(*) AS total,
            SUM(status = 'Confirmed') AS confirmed,
            SUM(status = 'Pending') AS pending,
            SUM(status = 'Cancelled') AS cancelled
            FROM reservations $whereSql";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    // ensure integers
    $row['total'] = (int)($row['total'] ?? 0);
    $row['confirmed'] = (int)($row['confirmed'] ?? 0);
    $row['pending'] = (int)($row['pending'] ?? 0);
    $row['cancelled'] = (int)($row['cancelled'] ?? 0);
    echo json_encode(['ok'=>true,'data'=>$row]);
}catch(Exception $e){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}

?>
