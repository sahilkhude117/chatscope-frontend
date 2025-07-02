// app/api/test-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      pineconeConfigured: !!process.env.PINECONE_API_KEY,
      indexNameConfigured: !!process.env.PINECONE_INDEX_NAME,
      openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + '...',
      pineconeKeyPrefix: process.env.PINECONE_API_KEY?.substring(0, 8) + '...',
      indexName: process.env.PINECONE_INDEX_NAME,
    };

    // Test OpenAI connection
    let openaiTest = false;
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Simple test request
      await openai.models.list();
      openaiTest = true;
    } catch (openaiError) {
      console.error('OpenAI test failed:', openaiError);
    }

    // Test Pinecone connection
    let pineconeTest = false;
    try {
      const { pineconeIndex } = await import('@/lib/pinecone');
      const stats = await pineconeIndex.describeIndexStats();
      pineconeTest = true;
      console.log('Pinecone stats:', stats);
    } catch (pineconeError) {
      console.error('Pinecone test failed:', pineconeError);
    }

    return NextResponse.json({
      ...config,
      openaiTest,
      pineconeTest,
      status: 'Configuration test completed'
    });

  } catch (error) {
    console.error('Config test error:', error);
    return NextResponse.json(
      { 
        error: 'Configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}