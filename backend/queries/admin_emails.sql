-- name: CheckIfAdmin :one
SELECT email FROM admin_emails
where email=$1;