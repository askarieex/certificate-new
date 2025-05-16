import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generateCertificateHtml, createTemplateContent } from '@/utils/certificateUtils';
import { Student } from '@/utils/types';
import { logger } from '@/utils/loggingUtils';

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      logger.info(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Set permissions if creating directory (important for server deployment)
    try {
      fs.chmodSync(dirPath, 0o777);
    } catch (permError) {
      logger.error(`Failed to set directory permissions:`, permError);
    }
  } catch (error) {
    logger.error('Error creating directory:', error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Certificate generation API called');
    
    // Parse the request body
    const reqBody = await request.json();
    const { students, includePhotos = true } = reqBody;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No students provided'
      }, { status: 400 });
    }
    
    logger.info(`Received request to generate ${students.length} certificates`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'output');
    logger.info(`Creating output directory at: ${outputDir}`);
    
    ensureDirectoryExists(outputDir);
    
    const results = [];
    
    // Generate certificates for each student
    for (const student of students) {
      logger.info(`Generating certificate for: ${student.name}`);
      
      // Generate HTML content using the imported function
      const htmlContent = generateCertificateHtml(student, includePhotos);
      
      // Create file name
      const safeName = student.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const fileName = `${safeName}_certificate.html`;
      const filePath = path.join(outputDir, fileName);
      
      // Write the file
      fs.writeFileSync(filePath, htmlContent);
      logger.info(`HTML file saved at: ${filePath}`);
      
      // Add to results
      results.push({
        htmlPath: `/output/${fileName}`,
        name: student.name
      });
    }
    
    logger.info(`Successfully generated ${results.length} certificates`);
    
    // Return success response
    return NextResponse.json({
      status: 'success',
      message: `Generated ${results.length} certificates`,
      data: results
    });
    
  } catch (error: any) {
    logger.error('Error generating certificates:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error generating certificates: ${error.message}`
    }, { status: 500 });
  }
} 