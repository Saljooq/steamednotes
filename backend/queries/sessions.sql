-- name: CreateSession :one
INSERT INTO user_sessions (
    user_id, 
    session_token, 
    device_name, 
    device_type, 
    browser_name, 
    browser_version, 
    os_name, 
    os_version, 
    ip_address, 
    user_agent, 
    expires_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM user_sessions 
WHERE session_token = $1 AND is_active = true;

-- name: GetSessionByID :one
SELECT * FROM user_sessions 
WHERE id = $1 AND is_active = true;

-- name: UpdateSessionLastUsed :one
UPDATE user_sessions 
SET last_used_at = CURRENT_TIMESTAMP,
    expires_at = CASE 
        WHEN expires_at - CURRENT_TIMESTAMP < INTERVAL '6 days' 
        THEN CURRENT_TIMESTAMP + INTERVAL '7 days'
        ELSE expires_at
    END
WHERE id = $1
RETURNING *;

-- name: GetSessionsByUser :many
SELECT * FROM user_sessions 
WHERE user_id = $1 AND is_active = true
ORDER BY last_used_at DESC;

-- name: DeleteSession :exec
UPDATE user_sessions 
SET is_active = false 
WHERE id = $1 AND user_id = $2;

-- name: DeleteAllSessionsExceptCurrent :exec
UPDATE user_sessions 
SET is_active = false 
WHERE user_id = $1 AND id != $2;

-- name: CleanupExpiredSessions :exec
UPDATE user_sessions 
SET is_active = false 
WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;

-- name: DeactivateSession :exec
UPDATE user_sessions 
SET is_active = false 
WHERE id = $1 AND user_id = $2;