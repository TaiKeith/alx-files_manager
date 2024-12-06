import dbClient from '../utils/db'; // Import the database client for MongoDB interactions.
import crypto from 'crypto'; // Import crypto for hashing passwords.

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body; // Extract email and password from the request body.

    // Step 1: Validate input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' }); // Email is required.
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' }); // Password is required.
    }

    // Step 2: Check if the email already exists
    const userCollection = dbClient.db.collection('users'); // Access the 'users' collection in MongoDB.
    const userExists = await userCollection.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' }); // Email must be unique.
    }

    // Step 3: Hash the password
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Step 4: Insert the new user into the database
    const newUser = { email, password: hashedPassword }; // Create the user object.
    const result = await userCollection.insertOne(newUser); // Insert the user into the database.

    // Step 5: Return the created user (excluding the password)
    return res.status(201).json({
      id: result.insertedId, // MongoDB auto-generated ID.
      email,
    });
  }
}

export default UsersController;
