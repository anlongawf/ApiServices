const daemonService = require('../services/daemonService');
const pool = require('../config/db');

const serverController = {
    async createServer(req, res) {
        const { userId, serverName, templateId, ram } = req.body;
        // Default limits if not provided: 0.5 core (50%), 5GB disk (5120MB)
        const cpu = 50;
        const disk = 5120;

        try {
            // 1. Check user exists (Thử cả 'users' và 'Users' vì Linux phân biệt hoa thường)
            let user;
            try {
                [user] = await pool.execute('SELECT * FROM users WHERE Id = ?', [userId]);
            } catch (e) {
                if (e.code === 'ER_NO_SUCH_TABLE') {
                    [user] = await pool.execute('SELECT * FROM Users WHERE Id = ?', [userId]);
                } else {
                    throw e;
                }
            }

            if (!user || !user.length) return res.status(404).json({ error: 'User không tồn tại' });

            // 2. Validate template
            const [template] = await pool.execute('SELECT * FROM templates WHERE id = ?', [templateId]);
            if (!template.length) return res.status(400).json({ error: 'Phiên bản Minecraft không hợp lệ' });

            // 3. Hạn mức mặc định (Vì không sửa bảng users của bạn)
            const MAX_SERVERS = 1;
            const RAM_LIMIT = 2048; // 2GB
            const CPU_LIMIT = 100;  // 1 Core
            const DISK_LIMIT = 5120; // 5GB

            // Kiểm tra số lượng server hiện tại
            const [usage] = await pool.execute(
                'SELECT SUM(ram) as total_ram, COUNT(*) as count FROM servers WHERE user_id = ?',
                [userId]
            );

            if (usage[0].count >= MAX_SERVERS || (parseInt(usage[0].total_ram || 0) + ram) > RAM_LIMIT) {
                return res.status(400).json({ error: 'Bạn đã hết hạn mức tạo server (Tối đa 1 server/2GB RAM)' });
            }

            // 4. Call Daemon to create server with JAR URL
            const daemonResponse = await daemonService.createOnDaemon({
                serverName,
                cpu,
                ram,
                disk,
                jarUrl: template[0].jar_url,
                version: template[0].version_tag
            });

            // 5. Save to DB
            const [result] = await pool.execute(
                'INSERT INTO servers (user_id, daemon_id, name, cpu, ram, disk, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, daemonResponse.id, serverName, cpu, ram, disk, 'creating']
            );

            res.status(201).json({ message: 'Server creation initiated', serverId: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to initiate server creation' });
        }
    },

    async deleteServer(req, res) {
        const { id } = req.params;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            if (!server.length) return res.status(404).json({ error: 'Server not found' });

            await daemonService.deleteFromDaemon(server[0].daemon_id);
            await pool.execute('DELETE FROM servers WHERE id = ?', [id]);

            res.json({ message: 'Server deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete server' });
        }
    },

    async startServer(req, res) {
        const { id } = req.params;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            await daemonService.startServer(server[0].daemon_id);
            await pool.execute('UPDATE servers SET status = ? WHERE id = ?', ['online', id]);
            res.json({ message: 'Server starting' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to start server' });
        }
    },

    async stopServer(req, res) {
        const { id } = req.params;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            await daemonService.stopServer(server[0].daemon_id);
            await pool.execute('UPDATE servers SET status = ? WHERE id = ?', ['offline', id]);
            res.json({ message: 'Server stopping' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to stop server' });
        }
    },

    async readFiles(req, res) {
        const { id } = req.params;
        const { path } = req.query;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            const files = await daemonService.readFile(server[0].daemon_id, path);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read files' });
        }
    },

    async editFile(req, res) {
        const { id } = req.params;
        const { path, content } = req.body;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            await daemonService.writeFile(server[0].daemon_id, path, content);
            res.json({ message: 'File saved' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to edit file' });
        }
    },

    async getConsole(req, res) {
        const { id } = req.params;
        try {
            const [server] = await pool.execute('SELECT daemon_id FROM servers WHERE id = ?', [id]);
            const logs = await daemonService.streamLogs(server[0].daemon_id);
            res.json({ logs });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get logs' });
        }
    }
};

module.exports = serverController;
