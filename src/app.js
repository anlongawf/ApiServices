const express = require('express');
const dotenv = require('dotenv');
const serverRoutes = require('./routes/serverRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use('/api/servers', serverRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
});
