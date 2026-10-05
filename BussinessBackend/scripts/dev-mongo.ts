// Starts a local MongoDB 7 for development when no Docker/system MongoDB is available
import { MongoMemoryServer } from 'mongodb-memory-server'

async function main(): Promise<void> {
  const port = Number(process.env.DEV_MONGO_PORT ?? 27018)
  const server = await MongoMemoryServer.create({
    instance: { port, dbPath: process.env.DEV_MONGO_PATH ?? '.data/mongo7', storageEngine: 'wiredTiger' },
    binary: { version: '7.0.14' },
  })
  process.stdout.write(`MongoDB running at ${server.getUri()}\n`)
  const stop = async () => {
    await server.stop({ doCleanup: false })
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

void main()
