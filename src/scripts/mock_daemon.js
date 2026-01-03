// scripts/mock_daemon.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/servers/create', (req, res) => {
    console.log('--- MOCK DAEMON: Nhận lệnh tạo server ---', req.body);
    res.json({ id: 'dummy-server-' + Math.random().toString(36).substr(2, 9), status: 'success' });
});

app.post('/servers/:id/start', (req, res) => {
    console.log(`--- MOCK DAEMON: Start server ${req.params.id} ---`);
    res.json({ status: 'online' });
});

app.get('/servers/:id/files', (req, res) => {
    res.json([{ name: 'server.properties', type: 'file' }, { name: 'logs', type: 'dir' }]);
});

app.listen(8082, () => console.log('Mock Daemon đang chạy tại port 8082 trên Mac của bạn!'));