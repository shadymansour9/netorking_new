const User = require('../backend/node_modules/user');

function createUser(data, callback) {
    const newUser = new User(data);
    newUser.save((err, user) => {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    });
}

function findUserByEmail(email, callback) {
    User.findOne({ email: email }, (err, user) => {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    });
}

module.exports = { createUser, findUserByEmail };
