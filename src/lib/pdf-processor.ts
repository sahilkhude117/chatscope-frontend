import pdf from 'pdf-parse';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pineconeIndex } from './pinecone';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    pageNumber: number;
    chunkIndex: number;
  };
}

export async function processPDF(buffer: Buffer, filename: string): Promise<string> {
  try {
    // Extract text from PDF
    const data = await pdf(buffer);
    const text = data.text;

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitText(text);

    // Create embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    // Process chunks and store in vector database
    const documentChunks: DocumentChunk[] = [];
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuidv4();
      const chunk: DocumentChunk = {
        id: chunkId,
        content: chunks[i],
        metadata: {
          source: filename,
          pageNumber: Math.floor(i / 10) + 1, // Approximate page numbering
          chunkIndex: i,
        },
      };

      documentChunks.push(chunk);

      // Generate embedding for this chunk
      const embedding = await embeddings.embedQuery(chunks[i]);

      vectors.push({
        id: chunkId,
        values: embedding,
        metadata: {
          content: chunks[i],
          source: filename,
          pageNumber: chunk.metadata.pageNumber,
          chunkIndex: i,
        },
      });
    }

    // Store vectors in Pinecone
    await pineconeIndex.upsert(vectors);

    return `Successfully processed ${chunks.length} chunks from ${filename}`;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF');
  }
}