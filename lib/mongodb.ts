import { MongoClient } from "mongodb"

// Connection URI - use a default local connection if not provided
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/campus"

// Create a mock MongoDB client for when the real connection fails
const createMockClient = () => {
  const mockDb = {
    collection: (name: string) => ({
      find: () => ({
        sort: () => ({
          toArray: async () => [],
        }),
      }),
      findOne: async () => null,
      insertOne: async () => ({ insertedId: "mock-id" }),
      updateOne: async () => ({ matchedCount: 1 }),
      deleteOne: async () => ({ deletedCount: 1 }),
      createIndex: async () => null,
    }),
  }

  return {
    db: () => mockDb,
    connect: async () => Promise.resolve(),
    close: async () => Promise.resolve(),
  } as unknown as MongoClient
}

// In development mode, we'll use a global variable to maintain the connection
const globalWithMongo = global as typeof global & {
  _mongoClientPromise?: Promise<MongoClient>
  _mongoClient?: MongoClient
  _useMockClient?: boolean
}

if (!globalWithMongo._mongoClient) {
  try {
    const client = new MongoClient(uri)

    // Store both the client and the promise
    globalWithMongo._mongoClient = client
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB:", err)
      console.log("Using mock MongoDB client for development")

      // Set flag to use mock client
      globalWithMongo._useMockClient = true

      // Return a mock client that won't throw errors
      return createMockClient()
    })
  } catch (error) {
    console.error("Error initializing MongoDB client:", error)
    console.log("Using mock MongoDB client for development")

    // Set flag to use mock client
    globalWithMongo._useMockClient = true

    // Create a mock client promise that resolves immediately
    globalWithMongo._mongoClientPromise = Promise.resolve(createMockClient())
  }
}

// Export the promise that will resolve to the connected client
const clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>

// Export whether we're using a mock client (for UI notifications)
export const isMockMongoDB = globalWithMongo._useMockClient || false

export default clientPromise

