const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-language-translator';

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const collection = mongoose.connection.collection('users');
            // List indexes
            const indexes = await collection.indexes();
            console.log('Current Indexes:', indexes);

            const phoneIndex = indexes.find(i => i.key.phoneNo === 1);
            if (phoneIndex) {
                console.log('Dropping phoneNo_1 index...');
                await collection.dropIndex('phoneNo_1');
                console.log('Index dropped successfully.');
            } else {
                console.log('phoneNo_1 index not found.');
            }
        } catch (err) {
            console.error('Error dropping index:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error('Connection error:', err));
