const express = require('express');
const { connectToDb, getDb } = require('./database');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3005; // Define the port here

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
  methods: ['GET', 'POST'], // Allow specific methods
  allowedHeaders: ['Content-Type'], // Allow specific headers
}));

// Database connection
let db;
connectToDb((err) => {
    if (!err) {
        db = getDb();
        app.listen(port, () => {
            console.log(`App listening on port ${port}`);
        });
    } else {
        console.error('Failed to connect to the database');
    }
});

// User registration endpoint
app.post('/register', async (req, res) => {
    console.log('Request received at /register');
    console.log('Request body:', req.body);

    const { username, first_name, last_name, gender, email, password, phone_number, education, photo, skills, recovery_q1, recovery_q2 } = req.body;

    try {
        // Create user object
        const newUser = {
            user_name: username,
            first_name,
            last_name,
            gender,
            email,
            password,
            phone_number,
            education,
            photo
        };

        // Insert new user into users collection
        const result = await db.collection('users').insertOne(newUser);

        if (result.acknowledged && result.insertedId) {
            const userId = result.insertedId;

            // Insert skills into skills collection
            const skillsData = skills.map(skill => ({ user_id: userId, skill }));
            await db.collection('skills').insertMany(skillsData);

            // Insert recovery questions into recovery_questions collection
            const recoveryData = {
                user_id: userId,
                question1: recovery_q1.question,
                answer1: recovery_q1.answer,
                question2: recovery_q2.question,
                answer2: recovery_q2.answer
            };
            await db.collection('recovery').insertOne(recoveryData);

            // Return the new user object with just the user fields
            res.json({ message: 'Registration successful', user: newUser });
        } else {
            console.error('Failed to insert user into the database');
            res.status(500).send('Error registering user');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error registering user');
    }
});

// Verify user function for login
const verifyUser = async (email, password, callback) => {
    try {
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            console.log('No user found with this email:', email);
            return callback(null, { message: 'Wrong email or password.' });
        }

        if (password !== user.password) {
            return callback(null, { message: 'Wrong email or password.' });
        } else {
            const userObject = {
                user_id: user._id,
                user_name: user.user_name,
                first_name: user.first_name,
                last_name: user.last_name,
                gender: user.gender,
                email: user.email,
                password: user.password,
                phone_number: user.phone_number,
                education: user.education,
                photo: user.photo
            };

            callback(null, userObject);
        }
    } catch (err) {
        console.error('Database query error:', err);
        return callback(err);
    }
};

// Add login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log("server side :");
    console.log(email, password);
    verifyUser(email, password, (err, result) => {
        console.log("err:", err);
        console.log(result);
        if (err) {
            return res.status(500).send('An error occurred. Please try again.');
        }
        if (result.message) {
            return res.status(401).send(result.message);
        }

        res.json({ message: 'Login successful', user: result });
    });
});

// Routes
app.get('/users', (req, res) => {
    db.collection('users')
        .find()
        .toArray()
        .then((documents) => {
            res.status(200).json(documents);
        })
        .catch((error) => {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Could not fetch the users' });
        });
});
