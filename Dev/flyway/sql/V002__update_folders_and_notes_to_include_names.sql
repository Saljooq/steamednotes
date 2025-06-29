-- Adding room_name column to folders table
ALTER TABLE folders
ADD COLUMN room_name VARCHAR(100);

-- Update existing folders with corresponding room names
UPDATE folders
SET room_name = rooms.name
FROM rooms
WHERE folders.room_id = rooms.id;

-- Make room_name NOT NULL in folders
ALTER TABLE folders
ALTER COLUMN room_name SET NOT NULL;

-- Adding folder_name and room_name columns to notes table
ALTER TABLE notes
ADD COLUMN room_name VARCHAR(100),
ADD COLUMN folder_name VARCHAR(100);

-- Update existing notes with corresponding room and folder names
UPDATE notes
SET room_name = rooms.name,
    folder_name = folders.name
FROM rooms, folders
WHERE notes.room_id = rooms.id
AND notes.folder_id = folders.id;

-- Make room_name and folder_name NOT NULL in notes
ALTER TABLE notes
ALTER COLUMN room_name SET NOT NULL,
ALTER COLUMN folder_name SET NOT NULL;