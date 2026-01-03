const axios = require('axios');
require('dotenv').config();

const daemonApi = axios.create({
    baseURL: process.env.DAEMON_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.DAEMON_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const serverService = {
    async createOnDaemon(serverData) {
        const response = await daemonApi.post('/servers/create', serverData);
        return response.data;
    },

    async deleteFromDaemon(serverId) {
        const response = await daemonApi.delete(`/servers/${serverId}`);
        return response.data;
    },

    async startServer(serverId) {
        const response = await daemonApi.post(`/servers/${serverId}/start`);
        return response.data;
    },

    async stopServer(serverId) {
        const response = await daemonApi.post(`/servers/${serverId}/stop`);
        return response.data;
    },

    async readFile(serverId, filePath) {
        const response = await daemonApi.get(`/servers/${serverId}/files`, { params: { path: filePath } });
        return response.data;
    },

    async writeFile(serverId, filePath, content) {
        const response = await daemonApi.post(`/servers/${serverId}/files/edit`, { path: filePath, content });
        return response.data;
    },

    async streamLogs(serverId) {
        // For logs, it might be a WebSocket or SSE, but for this basic implementation 
        // we'll assume a polling or simple GET for now as a placeholder.
        const response = await daemonApi.get(`/servers/${serverId}/logs`);
        return response.data;
    }
};

module.exports = serverService;
