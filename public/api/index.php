<?php
// PHP Backend API Router for Dhikr Counter
// Exposes API endpoints for PWA Client Authentication and Synchronization

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

// Helper to get raw JSON post data
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// Helper to get all request headers (for server compatibility)
function getRequestHeaders() {
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    // Also try apache_request_headers if available
    if (function_exists('apache_request_headers')) {
        $headers = array_merge($headers, apache_request_headers());
    }
    return $headers;
}

// Helper to authenticate user from Bearer Token
function authenticate($db) {
    $headers = getRequestHeaders();
    $authHeader = '';
    
    foreach ($headers as $key => $val) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $val;
            break;
        }
    }
    
    if (preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
        $token = $matches[1];
        $stmt = $db->prepare("SELECT * FROM users WHERE session_token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if ($user) {
            return $user;
        }
    }
    
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

// Generate simple UUID v4
function generateUuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// Route Handler
$action = isset($_GET['action']) ? $_GET['action'] : '';
$db = getDbConnection();
$input = getJsonInput();

try {
    switch ($action) {
        case 'google_login':
            $authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
                'client_id' => GOOGLE_CLIENT_ID,
                'redirect_uri' => GOOGLE_REDIRECT_URI,
                'response_type' => 'code',
                'scope' => 'email profile',
                'state' => 'google_oauth_state'
            ]);
            header("Location: " . $authUrl);
            exit;

        case 'google_callback':
            $code = isset($_GET['code']) ? $_GET['code'] : '';
            if (empty($code)) {
                die("OAuth Error: No authorization code received from Google.");
            }
            
            // Exchange code for tokens
            $ch = curl_init("https://oauth2.googleapis.com/token");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'code' => $code,
                'client_id' => GOOGLE_CLIENT_ID,
                'client_secret' => GOOGLE_CLIENT_SECRET,
                'redirect_uri' => GOOGLE_REDIRECT_URI,
                'grant_type' => 'authorization_code'
            ]));
            $response = curl_exec($ch);
            curl_close($ch);
            
            $tokenData = json_decode($response, true);
            if (isset($tokenData['error'])) {
                die("OAuth Error during exchange: " . $tokenData['error_description']);
            }
            
            $accessToken = $tokenData['access_token'];
            
            // Fetch profile info
            $ch = curl_init("https://www.googleapis.com/oauth2/v3/userinfo");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer " . $accessToken
            ]);
            $userInfoResponse = curl_exec($ch);
            curl_close($ch);
            
            $userInfo = json_decode($userInfoResponse, true);
            if (!isset($userInfo['email'])) {
                die("OAuth Error: Failed to retrieve user email from Google.");
            }
            
            $email = $userInfo['email'];
            $name = isset($userInfo['name']) ? $userInfo['name'] : 'Google User';
            
            // Query user in MySQL
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            $sessionToken = bin2hex(random_bytes(32));
            
            if ($user) {
                $stmt = $db->prepare("UPDATE users SET session_token = ? WHERE id = ?");
                $stmt->execute([$sessionToken, $user['id']]);
                $userId = $user['id'];
            } else {
                $userId = generateUuid();
                $randomPasswordHash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
                
                $stmt = $db->prepare("INSERT INTO users (id, email, password_hash, display_name, session_token) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$userId, $email, $randomPasswordHash, $name, $sessionToken]);
            }
            
            // Redirect back to login PWA with token query param
            header("Location: /login?token=" . urlencode($sessionToken));
            exit;

        case 'get_profile':
            $user = authenticate($db);
            echo json_encode([
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'display_name' => $user['display_name'],
                    'session_token' => $user['session_token']
                ]
            ]);
            break;

        case 'register':
            $email = isset($input['email']) ? trim($input['email']) : '';
            $password = isset($input['password']) ? $input['password'] : '';
            $displayName = isset($input['displayName']) ? trim($input['displayName']) : '';
            
            if (empty($email) || empty($password) || empty($displayName)) {
                http_response_code(400);
                echo json_encode(['error' => 'All fields (email, password, name) are required.']);
                break;
            }
            
            // Check if user exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'A user with this email already exists.']);
                break;
            }
            
            // Create user
            $userId = generateUuid();
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $token = bin2hex(random_bytes(32));
            
            $stmt = $db->prepare("INSERT INTO users (id, email, password_hash, display_name, session_token) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $email, $hash, $displayName, $token]);
            
            echo json_encode([
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'display_name' => $displayName,
                    'session_token' => $token
                ]
            ]);
            break;
            
        case 'login':
            $email = isset($input['email']) ? trim($input['email']) : '';
            $password = isset($input['password']) ? $input['password'] : '';
            
            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required.']);
                break;
            }
            
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($password, $user['password_hash'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email or password.']);
                break;
            }
            
            // Generate new session token on login
            $token = bin2hex(random_bytes(32));
            $stmt = $db->prepare("UPDATE users SET session_token = ? WHERE id = ?");
            $stmt->execute([$token, $user['id']]);
            
            echo json_encode([
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'display_name' => $user['display_name'],
                    'session_token' => $token
                ]
            ]);
            break;
            
        case 'fetch':
            $user = authenticate($db);
            $stmt = $db->prepare("SELECT * FROM dhikrs WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user['id']]);
            $dhikrs = $stmt->fetchAll();
            
            // Format dates/integers for JSON
            foreach ($dhikrs as &$d) {
                $d['total_count'] = (int)$d['total_count'];
                $d['daily_count'] = (int)$d['daily_count'];
                $d['daily_limit'] = $d['daily_limit'] !== null ? (int)$d['daily_limit'] : null;
            }
            
            echo json_encode(['dhikrs' => $dhikrs]);
            break;
            
        case 'add':
            $user = authenticate($db);
            $id = isset($input['id']) ? $input['id'] : generateUuid();
            $name = isset($input['name']) ? trim($input['name']) : '';
            $limit = isset($input['daily_limit']) ? $input['daily_limit'] : null;
            $today = date('Y-m-d');
            
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dhikr name is required.']);
                break;
            }
            
            $stmt = $db->prepare("INSERT INTO dhikrs (id, user_id, name, total_count, daily_count, daily_limit, last_reset_date) VALUES (?, ?, ?, 0, 0, ?, ?)");
            $stmt->execute([$id, $user['id'], $name, $limit, $today]);
            
            echo json_encode([
                'success' => true,
                'dhikr' => [
                    'id' => $id,
                    'user_id' => $user['id'],
                    'name' => $name,
                    'total_count' => 0,
                    'daily_count' => 0,
                    'daily_limit' => $limit !== null ? (int)$limit : null,
                    'last_reset_date' => $today,
                    'created_at' => date('c')
                ]
            ]);
            break;
            
        case 'sync':
            $user = authenticate($db);
            $deltas = isset($input['deltas']) ? $input['deltas'] : [];
            $today = date('Y-m-d');
            
            if (!empty($deltas)) {
                $db->beginTransaction();
                try {
                    foreach ($deltas as $id => $delta) {
                        $delta = (int)$delta;
                        if ($delta === 0) continue;
                        
                        // Fetch current
                        $stmt = $db->prepare("SELECT total_count, daily_count, last_reset_date FROM dhikrs WHERE id = ? AND user_id = ?");
                        $stmt->execute([$id, $user['id']]);
                        $row = $stmt->fetch();
                        
                        if ($row) {
                            $dayChanged = $row['last_reset_date'] !== $today;
                            $newDaily = ($dayChanged ? 0 : (int)$row['daily_count']) + $delta;
                            $newTotal = (int)$row['total_count'] + $delta;
                            
                            $stmt = $db->prepare("UPDATE dhikrs SET total_count = ?, daily_count = ?, last_reset_date = ? WHERE id = ?");
                            $stmt->execute([max(0, $newTotal), max(0, $newDaily), $today, $id]);
                        }
                    }
                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            }
            
            // Return fresh list of dhikrs after sync
            $stmt = $db->prepare("SELECT * FROM dhikrs WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user['id']]);
            $dhikrs = $stmt->fetchAll();
            foreach ($dhikrs as &$d) {
                $d['total_count'] = (int)$d['total_count'];
                $d['daily_count'] = (int)$d['daily_count'];
                $d['daily_limit'] = $d['daily_limit'] !== null ? (int)$d['daily_limit'] : null;
            }
            
            echo json_encode(['success' => true, 'dhikrs' => $dhikrs]);
            break;
            
        case 'update':
            $user = authenticate($db);
            $id = isset($input['id']) ? $input['id'] : '';
            $name = isset($input['name']) ? trim($input['name']) : '';
            $limit = isset($input['daily_limit']) ? $input['daily_limit'] : null;
            
            if (empty($id) || empty($name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dhikr ID and name are required.']);
                break;
            }
            
            $stmt = $db->prepare("UPDATE dhikrs SET name = ?, daily_limit = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$name, $limit, $id, $user['id']]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'delete':
            $user = authenticate($db);
            $id = isset($input['id']) ? $input['id'] : '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dhikr ID is required.']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM dhikrs WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['id']]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'reset':
            $user = authenticate($db);
            $id = isset($input['id']) ? $input['id'] : '';
            $today = date('Y-m-d');
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dhikr ID is required.']);
                break;
            }
            
            $stmt = $db->prepare("UPDATE dhikrs SET daily_count = 0, last_reset_date = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$today, $id, $user['id']]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'API Endpoint not found.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'An internal server error occurred.',
        'details' => $e->getMessage()
    ]);
}
