-- name: ListUsers :many
SELECT id, username, email, created_at FROM users ORDER BY created_at DESC;

-- name: CreateUser :one
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at;