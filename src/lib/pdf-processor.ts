// lib/pdf-processor.ts
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

// Dynamic import to avoid build-time issues
async function parsePDF(buffer: Buffer) {
  const pdf = await import('pdf-parse');
  return pdf.default(buffer);
}

export async function processPDF(buffer: Buffer, filename: string): Promise<string> {
  try {
    // Extract text from PDF with dynamic import
    const data = await parsePDF(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF');
    }

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const chunks = await textSplitter.splitText(text);

    if (chunks.length === 0) {
      throw new Error('No chunks created from PDF text');
    }

    // Create embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      batchSize: 512, // Process in batches to avoid rate limits
    });

    // Process chunks and store in vector database
    const vectors = [];

    // Process chunks in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunkId = uuidv4();
        const content = batch[j];

        try {
          // Generate embedding for this chunk
          const embedding = await embeddings.embedQuery(content);

          vectors.push({
            id: chunkId,
            values: embedding,
            metadata: {
              content: content,
              source: filename,
              pageNumber: Math.floor(chunkIndex / 10) + 1,
              chunkIndex: chunkIndex,
            },
          });
        } catch (embeddingError) {
          console.error(`Error creating embedding for chunk ${chunkIndex}:`, embeddingError);
          // Continue with next chunk instead of failing completely
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (vectors.length === 0) {
      throw new Error('No vectors created from PDF chunks');
    }

    // Store vectors in Pinecone in batches
    const vectorBatchSize = 100;
    for (let i = 0; i < vectors.length; i += vectorBatchSize) {
      const vectorBatch = vectors.slice(i, i + vectorBatchSize);
      await pineconeIndex.upsert(vectorBatch);
    }

    return `Successfully processed ${vectors.length} chunks from ${filename}`;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}