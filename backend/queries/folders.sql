-- name: CreateFolder :one
INSERT INTO folders (room_id, user_id, name, room_name)
VALUES ($1, $2, $3, $4)
RETURNING id, created_at;

-- name: FindFoldersByRoom :many
SELECT id, name, created_at FROM folders 
where room_id=$1 AND user_id=$2;

-- name: FindFolderById :one
SELECT * FROM folders where id=$1;