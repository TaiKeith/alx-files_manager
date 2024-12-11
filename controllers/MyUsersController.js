import dbClient from '../utils/db'; // Import the database client for MongoDB interactions.
import crypto from 'crypto'; // Import crypto for hashing passwords.
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';


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

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) }); // Use ObjectId here

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
