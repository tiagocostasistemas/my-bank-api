import express from 'express';
import { accountModel } from '../models/account.js';

const app = express();

app.get('/accounts', async (_, res) => {
    try {
        const accounts = await accountModel.find({});
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/accounts/balance/:agencia/:conta', async (req, res) => {
    try {
        const { agencia, conta } = req.params;
        const account = await accountModel.findOne({ agencia: agencia, conta: conta });
        res.send({ balance: account.balance });
    } catch (error) {
        res.status(500).send(error);
    }
});

app.delete('/accounts/:agencia/:conta', async (req, res) => {
    try {
        const { agencia, conta } = req.params;
        await accountModel.deleteOne({ agencia: agencia, conta: conta });
        const accounts = await accountModel.find({ agencia: agencia });
        res.send({ accounts: accounts.length });
    } catch (error) {
        res.status(500).send(error);
    }
});

app.put('/accounts/deposit/', async (req, res) => {
    try {
        const { agencia, conta, value } = req.body;
        let account = await accountModel.findOne({ agencia: agencia, conta: conta });
        account.balance += value;
        const newAccount = await accountModel.findOneAndUpdate({ _id: account._id }, account, { new: true });
        res.send(newAccount);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.put('/accounts/withdraw/', async (req, res) => {
    try {
        const { agencia, conta, value } = req.body;
        let account = await accountModel.findOne({ agencia: agencia, conta: conta });
        if (account.balance <= value)
            throw new Error('Saldo insuficiente');
        account.balance -= value + 1;
        const newAccount = await accountModel.findOneAndUpdate({ _id: account._id }, account, { new: true });
        res.send(newAccount);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.put('/accounts/transference/', async (req, res) => {
    try {
        const { origem, destino, value } = req.body;
        let contaOrigem = await accountModel.findOne({ conta: origem });
        let contaDestino = await accountModel.findOne({ conta: destino });

        contaOrigem.balance -= value;
        contaDestino.balance += value;

        if (contaOrigem.agencia !== contaDestino.agencia)
            contaOrigem.balance -= 8;

        contaOrigem = await accountModel.findOneAndUpdate({ _id: contaOrigem._id }, contaOrigem, { new: true });
        contaDestino = await accountModel.findOneAndUpdate({ _id: contaDestino._id }, contaDestino, { new: true });

        res.send({ saldoOrigem: contaOrigem.balance, saldoDestino: contaDestino.balance });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/accounts/average/:agencia', async (req, res) => {
    try {
        const { agencia } = req.params;
        const average = await accountModel.aggregate([
            { '$match': { agencia: parseInt(agencia) } },
            { '$group': { _id: null, average: { $avg: '$balance' } } },
            { '$project': { '_id': 0, 'average': 1 } }
        ]);

        res.send({ average: average[0].average });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/accounts/:agencia', async (req, res) => {
    try {
        const { agencia } = req.params;
        const accounts = await accountModel.find({ agencia: agencia });
        const sum = accounts.reduce((accumulator, current) => {
            return accumulator + current.balance;
        }, 0);
        const average = sum / accounts.length
        res.send({ sum: sum, count: accounts.length, average: average });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/accounts/poor/:quantity', async (req, res) => {
    try {
        const { quantity } = req.params;
        const accounts = await accountModel.find({}).sort({ balance: 1, name: 1 }).limit(parseInt(quantity));
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/accounts/rich/:quantity', async (req, res) => {
    try {
        const { quantity } = req.params;
        const accounts = await accountModel.find({}).sort({ balance: -1, name: 1 }).limit(parseInt(quantity));
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/accounts/transference/private', async (_, res) => {
    try {
        const agencias = await accountModel.find({}).distinct('agencia');
        const AGENCIA_PRIVATE = 99
        for (let agencia of agencias) {
            let account = await accountModel.findOne({ agencia: agencia }).sort({ balance: -1 }).limit(1);
            await accountModel.updateOne({ _id: account._id }, { agencia: AGENCIA_PRIVATE });
        }
        const accounts = await accountModel.find({ agencia: AGENCIA_PRIVATE });
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});



export { app as accountsRouter };