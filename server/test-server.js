const express = require('express');
const app = express();
const PORT = 3001; // Different port for testing

app.get('/', (req, res) => {
    res.send('Test server is working!');
});

app.get('/test', (req, res) => {
    res.json({ message: 'API test successful' });
});

app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
});