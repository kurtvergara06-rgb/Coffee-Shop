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

// Optional search across name/email/res_id
if(!empty($q['search'])){
    // will add a wildcard search later into whereParts
    $searchVal = strtolower($q['search']);
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
// Append search condition if given
if(!empty($searchVal)){
    $searchParam = '%' . $searchVal . '%';
    // either append with AND or with WHERE
    $searchClause = "(LOWER(name) LIKE :search OR LOWER(email) LIKE :search OR LOWER(res_id) LIKE :search)";
    if($whereSql) $whereSql .= ' AND ' . $searchClause;
    else $whereSql = 'WHERE ' . $searchClause;
    $params[':search'] = $searchParam;
}

try {
    $sql = "SELECT id,res_id,name,room,res_date,start_time,end_time,pax,email,equipment,total,status,created_at FROM reservations $whereSql ORDER BY res_date DESC, start_time DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok'=>true,'data'=>$rows]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}

?>
