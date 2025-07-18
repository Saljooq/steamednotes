// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: admin_emails.sql

package db

import (
	"context"
)

const checkIfAdmin = `-- name: CheckIfAdmin :one
SELECT email FROM admin_emails
where email=$1
`

func (q *Queries) CheckIfAdmin(ctx context.Context, email string) (string, error) {
	row := q.db.QueryRow(ctx, checkIfAdmin, email)
	err := row.Scan(&email)
	return email, err
}
