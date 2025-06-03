-- name: ListUsers :many
SELECT id, username, email, created_at FROM users ORDER BY created_at DESC;

-- name: CreateUser :one
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at;

-- name: FindUserByEmail :one
SELECT id, password_hash, username FROM users
where email=$1;

-- -- name: CreateRoom :one
-- INSERT INTO rooms (name, user_id)
-- VALUES ($1, $2)
-- RETURNING id, created_at;

-- -- name: CreateFolder :one
-- INSERT INTO folders (room_id, user_id, name)
-- VALUES ($1, $2, $3)
-- RETURNING id, created_at;

-- -- name: CreateNote :one
-- INSERT INTO notes (room_id, room_id, folder_id, user_id, title, content)
-- VALUES ($1, $2, $3, $4, $5, $6)
-- RETURNING id, created_at;
