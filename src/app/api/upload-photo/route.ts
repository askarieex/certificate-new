import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

export async function POST(request: NextRequest) {
  console.log('Processing photo upload request');
  
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json(
        { status: 'error', message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    console.log(`Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Get the filename from the form or generate one
    const customFileName = formData.get('fileName') as string;
    const fileName = customFileName || `${uuidv4()}.jpg`;
    console.log(`Using filename: ${fileName}`);
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`Converted file to buffer, size: ${fileBuffer.length} bytes`);
    
    // Directory to save photos
    const publicDir = path.join(process.cwd(), 'public');
    const photoDir = path.join(publicDir, 'photos');
    
    console.log(`Saving to directory: ${photoDir}`);
    ensureDirectoryExists(photoDir);
    
    // Save the file
    const filePath = path.join(photoDir, fileName);
    console.log(`Writing file to: ${filePath}`);
    
    try {
      fs.writeFileSync(filePath, fileBuffer);
      console.log(`File saved successfully at: ${filePath}`);
      
      // Verify file was saved
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`Verified file exists: ${filePath}, size: ${stats.size} bytes`);
      } else {
        throw new Error(`File was not saved correctly at: ${filePath}`);
      }
    } catch (writeError) {
      console.error(`Error writing file: ${writeError}`);
      throw writeError;
    }
    
    // Success response with full URL
    const relativePath = `/photos/${fileName}`;
    console.log(`Returning photo path: ${relativePath}`);
    
    return NextResponse.json({
      status: 'success',
      photoPath: relativePath,
      debug: {
        filename: fileName,
        originalSize: file.size,
        savedSize: fs.statSync(filePath).size,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Error uploading file',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 