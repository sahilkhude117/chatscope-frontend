// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid build issues
async function processPDFSafely(buffer: Buffer, filename: string) {
  try {
    const { processPDF } = await import('@/lib/pdf-processor');
    return await processPDF(buffer, filename);
  } catch (error) {
    console.error('Error in processPDF:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type);
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    console.log('Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Buffer created, size:', buffer.length);

    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    if (!process.env.PINECONE_API_KEY) {
      console.error('Missing PINECONE_API_KEY');
      return NextResponse.json({ error: 'Pinecone API key not configured' }, { status: 500 });
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      console.error('Missing PINECONE_INDEX_NAME');
      return NextResponse.json({ error: 'Pinecone index name not configured' }, { status: 500 });
    }

    console.log('Processing PDF...');
    const result = await processPDFSafely(buffer, file.name);
    console.log('PDF processed successfully:', result);

    return NextResponse.json({ message: result });
  } catch (error) {
    console.error('Upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'OpenAI API error: ' + error.message },
          { status: 500 }
        );
      }
      if (error.message.includes('Pinecone')) {
        return NextResponse.json(
          { error: 'Pinecone error: ' + error.message },
          { status: 500 }
        );
      }
      if (error.message.includes('PDF')) {
        return NextResponse.json(
          { error: 'PDF processing error: ' + error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process PDF - Unknown error' },
      { status: 500 }
    );
  }
}