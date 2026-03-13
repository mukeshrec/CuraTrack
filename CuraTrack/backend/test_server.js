const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/summarize-patient', (req, res) => {
    console.log('Body received:', req.body);
    res.json({ message: 'Success', received: req.body });
});

app.listen(3002, () => console.log('Test server on 3002'));
