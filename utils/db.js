import { MongoClient } from 'mongodb';

/**
 * Contains the class DBClient
 */

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const dbURL = `mongodb://${host}:${port}`;
    this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
    this.dbName = database;
    this.isConnected = false;

    // Connect to MongoDB
    this.client.connect()
      .then(() => {
        this.isConnected = true;
        this.db = this.client.db(this.dbName);
      })
      .catch((error) => {
        console.error(`Failed to connect to MongoDB: ${error.message}`);
        this.isConnected = false;
      });
  }

  // Check if the connection to MongoDB is alive
  isAlive() {
    return this.isConnected;
  }

  /**
   * Retrieves the number of users in the database.
   * @returns {Promise<Number>}
   */
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  /**
   * Retrieves the number of files in the database.
   * @returns {Promise<Number>}
   */
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
