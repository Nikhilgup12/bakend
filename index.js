const express = require('express');
const { ObjectId, MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());
app.use(cors());


let client;
const initializeDBAndServer = async () => {
    // Replace 'username' and 'password' with your MongoDB Atlas username and password
    const username = encodeURIComponent("Nikhil");
    const password = encodeURIComponent("Nikhil#123");

    // Replace this URI with your Node JS MongoDB connection URI obtained from MongoDB Atlas
    const uri = `mongodb+srv://${username}:${password}@cluster0.lmgtktf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

    client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB.....");
        app.listen(3000,() => {
            console.log('Server running on port: 3000');
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

initializeDBAndServer();

app.post('/register', async (request, response) => {
    try {
        const collection = client.db('nxttrendz').collection('User');
        const userDetails = request.body;
        const { email } = userDetails;
        
        // Check if user with the same email exists
        const existingUser = await collection.findOne({ email });

        if (existingUser) {
            return response.status(400).json({ errorMsg: 'User with this Email ID already exists' });
        }

        // Hash the passw
// Hash the password before saving to database
        const hashedPassword = await bcrypt.hash(userDetails.password, 10);
        userDetails.password = hashedPassword;

        // Insert user details into database
        const result = await collection.insertOne(userDetails);
        
        response.status(200).json({ yourId: result.insertedId, message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app 


