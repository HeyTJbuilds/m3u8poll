const express = require('express');
const axios = require('axios');

const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Endpoint to poll task status
app.post('/poll-status', async (req, res) => {
    const { task_id, api_key } = req.body;

    if (!task_id || !api_key) {
        return res.status(400).json({ error: 'task_id and api_key are required' });
    }

    const POLL_URL = `http://203.161.50.73:8000/status/${task_id}`;
    const TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    const POLL_INTERVAL = 60 * 1000; // 60 seconds

    const startTime = Date.now();

    try {
        const poll = async () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= TIMEOUT) {
                throw new Error('Polling timed out');
            }

            const response = await axios.get(POLL_URL, {
                headers: {
                    'X-API-KEY': api_key,
                },
            });

            if (response.data.status === 'completed') {
                return response.data.url; // Assuming the response contains the URL
            }

            // Wait for the next poll
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

            // Poll again
            return poll();
        };

        const url = await poll();
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;

// For local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
