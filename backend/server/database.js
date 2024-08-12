const { MongoClient } = require('mongodb');

let dbConnection;
const uri = 'mongodb+srv://mohamdadm25:Domnef-ciwvu7-jutzyr@networking.rgrflkp.mongodb.net/networking?retryWrites=true&w=majority&appName=networking';
const clientOptions = {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true
};

const client = new MongoClient(uri, clientOptions);

function connectToDb(cb) {
    client.connect()
        .then((client) => {
            dbConnection = client.db(); // This will use the 'networking' database specified in the URI
            console.log('Connected to MongoDB successfully');
            return cb();
        })
        .catch((err) => {
            console.error('Failed to connect to MongoDB', err);
            return cb(err);
        });
}

function getDb() {
    return dbConnection;
}

module.exports = { connectToDb, getDb };
