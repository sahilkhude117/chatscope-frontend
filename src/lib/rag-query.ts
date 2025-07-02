import { OpenAIEmbeddings } from '@langchain/openai';
import { pineconeIndex } from './pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function queryDocuments(question: string): Promise<string> {
  try {
    // Generate embedding for the question
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    const queryEmbedding = await embeddings.embedQuery(question);

    // Search for similar chunks in Pinecone
    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    // Extract relevant context
    const context = searchResults.matches
      .map((match) => match.metadata?.content)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return "I couldn't find relevant information in the uploaded documents to answer your question.";
    }

    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the provided context. 
                   Use only the information from the context to answer questions. 
                   If the context doesn't contain enough information to answer the question, say so.`,
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Error querying documents:', error);
    throw new Error('Failed to query documents');
  }
}