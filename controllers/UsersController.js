import dbClient from '../utils/db'; // MongoDB client.
import crypto from 'crypto'; // For SHA-1 hashing.
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Step 1: Validate input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Step 2: Check if the email already exists
    const userCollection = dbClient.db.collection('users');
    const userExists = await userCollection.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Step 3: Create a salt and hash the password
    const salt = crypto.randomBytes(16).toString('hex'); // Generate a 16-byte random salt.
    const hashedPassword = crypto
      .createHash('sha1')
      .update(salt + password)
      .digest('hex'); // Prepend the salt to the password before hashing.

    // Step 4: Store the salt and hash in the database
    const newUser = {
      email,
      password: hashedPassword,
      salt, // Save the salt to allow password verification later.
    };
    const result = await userCollection.insertOne(newUser);

    // Step 5: Return the created user (excluding the password and salt)
    return res.status(201).json({
      id: result.insertedId,
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
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

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
