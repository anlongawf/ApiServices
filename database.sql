CREATE DATABASE IF NOT EXISTS freehosting;
USE freehosting;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    max_servers INT DEFAULT 1,
    cpu_limit INT DEFAULT 100, -- percent
    ram_limit INT DEFAULT 1024, -- MB
    disk_limit INT DEFAULT 5120, -- MB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daemon_id VARCHAR(255) NOT NULL, -- ID used on the daemon side
    name VARCHAR(255) NOT NULL,
    cpu INT NOT NULL,
    ram INT NOT NULL,
    disk INT NOT NULL,
    status ENUM('creating', 'online', 'offline', 'error') DEFAULT 'creating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Template table for different Minecraft versions/types
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- e.g. "Paper 1.20.1"
    version_tag VARCHAR(50) NOT NULL, -- e.g. "paper-1.20.1"
    jar_url TEXT NOT NULL,
    default_properties TEXT, -- JSON string of default server.properties
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed comprehensive templates
INSERT INTO templates (name, version_tag, jar_url) VALUES 
-- PaperMC Versions
('Paper 1.8.8', 'paper-1.8.8', 'https://api.papermc.io/v2/projects/paper/versions/1.8.8/builds/445/downloads/paper-1.8.8-445.jar'),
('Paper 1.12.2', 'paper-1.12.2', 'https://api.papermc.io/v2/projects/paper/versions/1.12.2/builds/1620/downloads/paper-1.12.2-1620.jar'),
('Paper 1.16.5', 'paper-1.16.5', 'https://api.papermc.io/v2/projects/paper/versions/1.16.5/builds/794/downloads/paper-1.16.5-794.jar'),
('Paper 1.19.4', 'paper-1.19.4', 'https://api.papermc.io/v2/projects/paper/versions/1.19.4/builds/550/downloads/paper-1.19.4-550.jar'),
('Paper 1.20.1', 'paper-1.20.1', 'https://api.papermc.io/v2/projects/paper/versions/1.20.1/builds/196/downloads/paper-1.20.1-196.jar'),
('Paper 1.20.4', 'paper-1.20.4', 'https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar'),
('Paper 1.21', 'paper-1.21', 'https://api.papermc.io/v2/projects/paper/versions/1.21/builds/130/downloads/paper-1.21-130.jar'),

-- Purpur Versions (Dynamic latest download links)
('Purpur 1.16.5', 'purpur-1.16.5', 'https://api.purpurmc.org/v2/purpur/1.16.5/latest/download'),
('Purpur 1.18.2', 'purpur-1.18.2', 'https://api.purpurmc.org/v2/purpur/1.18.2/latest/download'),
('Purpur 1.19.4', 'purpur-1.19.4', 'https://api.purpurmc.org/v2/purpur/1.19.4/latest/download'),
('Purpur 1.20.1', 'purpur-1.20.1', 'https://api.purpurmc.org/v2/purpur/1.20.1/latest/download'),
('Purpur 1.20.4', 'purpur-1.20.4', 'https://api.purpurmc.org/v2/purpur/1.20.4/latest/download'),
('Purpur 1.20.6', 'purpur-1.20.6', 'https://api.purpurmc.org/v2/purpur/1.20.6/latest/download'),
('Purpur 1.21', 'purpur-1.21', 'https://api.purpurmc.org/v2/purpur/1.21/latest/download');
