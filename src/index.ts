import express from 'express';
import dotenv from 'dotenv';

const app = express();
const port = 3000;

if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();  // Loads the default `.env`
}

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
