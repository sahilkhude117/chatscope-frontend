// lib/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';

console.log('Initializing Pinecone...');

// Validate environment variables
if (!process.env.PINECONE_API_KEY) {
  console.error('PINECONE_API_KEY is not set');
  throw new Error('PINECONE_API_KEY environment variable is required');
}

if (!process.env.PINECONE_INDEX_NAME) {
  console.error('PINECONE_INDEX_NAME is not set');
  throw new Error('PINECONE_INDEX_NAME environment variable is required');
}

console.log('Environment variables check passed');
console.log('Index name:', process.env.PINECONE_INDEX_NAME);

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

console.log('Pinecone initialized successfully');

// Export pinecone client for testing
export { pinecone };