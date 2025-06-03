export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=steamed_user
export DB_PASSWORD=steamed_password
export DB_NAME=steamed_notes

sqlc generate

go build -o steamednotes .

./steamednotes