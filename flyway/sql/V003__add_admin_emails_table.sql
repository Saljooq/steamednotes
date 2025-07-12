CREATE TABLE IF NOT EXISTS admin_emails (
    email TEXT PRIMARY KEY
);

INSERT INTO admin_emails (email) VALUES
    ('saljoooq@gmail.com')
ON CONFLICT (email) DO NOTHING;