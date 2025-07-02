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
  try {
    console.log('Importing pdf-parse...');
    const pdf = await import('pdf-parse');
    console.log('pdf-parse imported successfully');
    
    console.log('Parsing PDF buffer...');
    const result = await pdf.default(buffer);
    console.log('PDF parsed successfully, text length:', result.text.length);
    
    return result;
  } catch (error) {
    console.error('Error in parsePDF:', error);
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processPDF(buffer: Buffer, filename: string): Promise<string> {
  try {
    console.log(`Starting PDF processing for: ${filename}`);
    
    // Validate inputs
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }

    if (!filename) {
      throw new Error('Filename is required');
    }

    // Extract text from PDF with dynamic import
    console.log('Extracting text from PDF...');
    const data = await parsePDF(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF. The PDF might be image-based or corrupted.');
    }

    console.log(`Extracted text length: ${text.length} characters`);

    // Split text into chunks
    console.log('Splitting text into chunks...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await textSplitter.splitText(text);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('No chunks created from PDF text');
    }

    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    // Create embeddings
    console.log('Initializing OpenAI embeddings...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      batchSize: 512,
      maxRetries: 3,
    });

    // Test embedding creation with first chunk
    console.log('Testing embedding creation...');
    try {
      await embeddings.embedQuery(chunks[0].substring(0, 100));
      console.log('Embedding test successful');
    } catch (embeddingError) {
      console.error('Embedding test failed:', embeddingError);
      throw new Error(`OpenAI embedding failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
    }

    // Process chunks and store in vector database
    console.log('Creating embeddings for all chunks...');
    const vectors = [];
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
      
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunkId = uuidv4();
        const content = batch[j];

        if (!content || content.trim().length === 0) {
          console.warn(`Skipping empty chunk at index ${chunkIndex}`);
          continue;
        }

        try {
          // Generate embedding for this chunk
          const embedding = await embeddings.embedQuery(content);
          
          if (!embedding || embedding.length === 0) {
            console.warn(`Empty embedding for chunk ${chunkIndex}`);
            continue;
          }

          vectors.push({
            id: chunkId,
            values: embedding,
            metadata: {
              content: content.substring(0, 1000), // Limit metadata size
              source: filename,
              pageNumber: Math.floor(chunkIndex / 10) + 1,
              chunkIndex: chunkIndex,
            },
          });

          processedCount++;
          
          // Add delay to respect rate limits
          if (j < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (embeddingError) {
          console.error(`Error creating embedding for chunk ${chunkIndex}:`, embeddingError);
          // Continue with next chunk instead of failing completely
        }
      }

      // Add delay between batches
      if (i + batchSize < chunks.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Created ${vectors.length} vectors from ${processedCount} processed chunks`);

    if (vectors.length === 0) {
      throw new Error('No vectors created from PDF chunks. Check your OpenAI API key and quota.');
    }

    // Test Pinecone connection
    console.log('Testing Pinecone connection...');
    try {
      const stats = await pineconeIndex.describeIndexStats();
      console.log('Pinecone connection successful, index stats:', stats);
    } catch (pineconeError) {
      console.error('Pinecone connection failed:', pineconeError);
      throw new Error(`Pinecone connection failed: ${pineconeError instanceof Error ? pineconeError.message : 'Unknown error'}`);
    }

    // Store vectors in Pinecone in batches
    console.log('Storing vectors in Pinecone...');
    const vectorBatchSize = 100;
    
    for (let i = 0; i < vectors.length; i += vectorBatchSize) {
      const vectorBatch = vectors.slice(i, i + vectorBatchSize);
      console.log(`Storing batch ${Math.floor(i/vectorBatchSize) + 1}/${Math.ceil(vectors.length/vectorBatchSize)}`);
      
      try {
        await pineconeIndex.upsert(vectorBatch);
        console.log(`Successfully stored ${vectorBatch.length} vectors`);
        
        // Add delay between batches
        if (i + vectorBatchSize < vectors.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (upsertError) {
        console.error(`Error storing vector batch:`, upsertError);
        throw new Error(`Failed to store vectors in Pinecone: ${upsertError instanceof Error ? upsertError.message : 'Unknown error'}`);
      }
    }

    const successMessage = `Successfully processed ${vectors.length} chunks from ${filename}`;
    console.log(successMessage);
    return successMessage;
    
  } catch (error) {
    console.error('Error in processPDF:', error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    } else {
      throw new Error('PDF processing failed: Unknown error');
    }
  }
}