const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs-extra'); // Cần chạy: npm install fs-extra
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const BASE_DIR = '/home/administrator/minecraft/servers';
const activeProcesses = new Map(); // Lưu trữ các process đang chạy

// Đảm bảo thư mục gốc tồn tại
fs.ensureDirSync(BASE_DIR);

// Middleware xác thực từ Backend
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1];
    if (apiKey !== process.env.DAEMON_API_KEY) {
        return res.status(403).json({ error: 'Daemon: Unauthorized' });
    }
    next();
};

app.use(authMiddleware);

// --- 1. API TẠO SERVER (Tải JAR, tạo EULA) ---
app.post('/servers/create', async (req, res) => {
    const { serverName, jarUrl, ram, cpu } = req.body;
    const serverPath = path.join(BASE_DIR, serverName);

    try {
        console.log(`[*] Đang tạo server: ${serverName}`);
        await fs.ensureDir(serverPath);

        // Tải jar
        console.log(`[*] Đang tải JAR từ: ${jarUrl}`);
        const response = await axios({
            method: 'get',
            url: jarUrl,
            responseType: 'stream'
        });

        const jarPath = path.join(serverPath, 'server.jar');
        const writer = fs.createWriteStream(jarPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            // Tạo eula.txt
            await fs.writeFile(path.join(serverPath, 'eula.txt'), 'eula=true');
            console.log(`[+] Server ${serverName} đã sẵn sàng!`);
            res.json({ id: serverName, status: 'ready' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi tạo server' });
    }
});

// --- 2. API START SERVER ---
app.post('/servers/:id/start', (req, res) => {
    const serverId = req.params.id;
    const serverPath = path.join(BASE_DIR, serverId);

    if (activeProcesses.has(serverId)) {
        return res.status(400).json({ error: 'Server đang chạy rồi' });
    }

    // Lệnh chạy: java -Xmx<RAM>M -jar server.jar nogui
    // RAM ở đây được backend truyền sang (ví dụ 1024)
    const minecraft = spawn('java', ['-Xmx2048M', '-jar', 'server.jar', 'nogui'], {
        cwd: serverPath
    });

    activeProcesses.set(serverId, minecraft);

    minecraft.stdout.on('data', (data) => {
        // Stream log về console (Sau này có thể đẩy qua WebSocket)
        console.log(`[${serverId}] ${data}`);
    });

    minecraft.on('close', (code) => {
        console.log(`[${serverId}] Server đã dừng với mã: ${code}`);
        activeProcesses.delete(serverId);
    });

    res.json({ status: 'starting' });
});

// --- 3. API STOP SERVER ---
app.post('/servers/:id/stop', (req, res) => {
    const serverId = req.params.id;
    const process = activeProcesses.get(serverId);

    if (process) {
        process.kill(); // Hoặc gửi lệnh "stop" vào stdin
        activeProcesses.delete(serverId);
        return res.json({ status: 'stopped' });
    }
    res.status(404).json({ error: 'Server không đang chạy' });
});

const PORT = 5006;
app.listen(PORT, () => {
    console.log(`Daemon đang lắng nghe tại port ${PORT}`);
});
