import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

class AuthController {
  // Sign-in user and generate token
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hash the password and find user in the database
    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate token and store it in Redis
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 3600);

    return res.status(200).json({ token });
  }

  // Sign-out user
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

export default AuthController;
