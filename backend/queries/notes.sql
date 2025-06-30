-- name: CreateNote :one
INSERT INTO notes (room_id, room_name, folder_id, folder_name, user_id, title, content)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, created_at;

-- name: FindNotesByFolder :many
SELECT id, title, created_at FROM notes
where folder_id=$1 AND user_id=$2;

-- name: FindNotesById :one
SELECT * FROM notes where id=$1;

-- name: UpdateNoteNameAndContent :exec
UPDATE notes
SET title = $1, content = $2
WHERE id = $3 AND user_id = $4;