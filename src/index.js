// /src/server.js
const express = require('express');
const { connectRedis } = require('./config/redis');
const { imageQueue } = require('./queues/imageQueues');
const connectDB=require('../src/config/db')
const router=require('../src/routes/imageRoutes')
const imageWorker = require('../workers/imageWorker');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Redis
 connectRedis();
 connectDB()

// Middleware to parse JSON
app.use(express.json());

app.use('/api',router)
// Example route to add a job to the queue
app.post('/process-image', async (req, res) => {
    const { imageUrl } = req.body;
    const job = await imageQueue.add('imageProcessing', { imageUrl });
    res.status(202).json({ jobId: job.id, message: 'Image processing started' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
