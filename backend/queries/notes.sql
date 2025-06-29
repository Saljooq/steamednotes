-- name: CreateNotes :one
INSERT INTO notes (room_id, folder_id, user_id, title, content)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, created_at;

-- name: FindNotesByFolder :many
SELECT id, title, created_at FROM notes
where folder_id=$1 AND user_id=$2;

-- name: FindNotesById :one
SELECT * FROM folders where id=$1;