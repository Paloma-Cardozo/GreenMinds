-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Favorite Plants table (mirrors data from the Plantbook API)
CREATE TABLE favorite_plants (
    id SERIAL PRIMARY KEY,
    pid VARCHAR(100) NOT NULL UNIQUE,   -- Plantbook's unique plant ID
    alias VARCHAR(150),
    img_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Junction table: user favorites (many-to-many)
CREATE TABLE users_favorite_plants (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plant_id INT NOT NULL REFERENCES favorite_plants(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, plant_id)
);