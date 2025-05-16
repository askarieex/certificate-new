const fs = require('fs');
const path = require('path');

console.log('Preparing build files for deployment...');

// Define paths
const outDir = path.join(__dirname, '..', 'out');
const indexHtmlPath = path.join(outDir, 'index.html');
const outputDir = path.join(outDir, 'output');

// Verify output directory exists
if (!fs.existsSync(outDir)) {
    console.error('Error: Build directory "out" does not exist!');
    console.log('Please run "npm run build" first to generate the build files.');
    process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: index.html does not exist in the build directory!');
    process.exit(1);
}

try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        console.log('Creating output directory for certificates...');
        fs.mkdirSync(outputDir, { recursive: true });
        
        // Create a placeholder file to ensure the directory is not empty
        fs.writeFileSync(
            path.join(outputDir, 'README.txt'), 
            'This directory will contain generated certificates.\n' +
            'Certificate files will be saved here when you generate them through the application.'
        );
    }

    // Read index.html content
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Check for instances where null might be concatenated to URLs
    const nullPattern = /(href="|src=")([^"]*)(null)([^"]*")/g;
    const nullReplaced = indexHtml.replace(nullPattern, '$1$2$4');

    if (indexHtml !== nullReplaced) {
        console.log('Fixed instances of "null" in URLs');
        fs.writeFileSync(indexHtmlPath, nullReplaced, 'utf8');
    }

    // Check other HTML files in the output directory
    const htmlFiles = fs.readdirSync(outDir).filter(file => file.endsWith('.html'));
    console.log(`Scanning ${htmlFiles.length} HTML files...`);

    htmlFiles.forEach(htmlFile => {
        if (htmlFile === 'index.html') return; // Already processed

        const filePath = path.join(outDir, htmlFile);
        let content = fs.readFileSync(filePath, 'utf8');

        const nullReplaced = content.replace(nullPattern, '$1$2$4');

        if (content !== nullReplaced) {
            console.log(`Fixed instances of "null" in ${htmlFile}`);
            fs.writeFileSync(filePath, nullReplaced, 'utf8');
        }
    });

    // Create a .htaccess file for better routing with static hosting
    const htaccessContent = `
# Redirect all requests to index.html for client-side routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Set correct MIME types
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
`;

    fs.writeFileSync(path.join(outDir, '.htaccess'), htaccessContent);
    console.log('Created .htaccess file for better routing');

    console.log('Build files preparation complete!');
    console.log('\nDeployment steps:');
    console.log('1. Upload all files from the "out" directory to your Hostinger hosting root');
    console.log('2. Make sure .htaccess file is included in the upload');
    console.log('3. If using a custom domain, ensure DNS settings are correct');
    console.log('4. IMPORTANT: Make sure the "output" directory exists and is writable by the web server');

} catch (error) {
    console.error('Error preparing build files:', error);
    process.exit(1);
} 