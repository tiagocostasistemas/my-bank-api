import express from 'express';
import mongoose from 'mongoose';
import { accountsRouter } from './routes/accountsRouter.js'

require('dotenv').config();

const user = process.env.USERDB;
const password = process.env.PWDDB;

(async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://${user}:${password}@cluster0.qv4ds.mongodb.net/my-bank?retryWrites=true&w=majority`,
            { useNewUrlParser: true, useUnifiedTopology: true });
    } catch (error) {
        console.log(error);
    }
})();

const app = express();

app.use(express.json());
app.use(accountsRouter);

app.listen(3000, () => console.log('API Started'));