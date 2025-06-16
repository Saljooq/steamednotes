-- name: CreateRoom :exec
INSERT INTO rooms (name, user_id)
VALUES ($1, $2);

-- name: FindRoomsByUser :many
SELECT id, name, created_at FROM rooms 
where user_id=$1;