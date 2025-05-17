# School DOB Certificate Generator

A web application for generating school Date of Birth (DOB) certificates from Excel data.

## Features

- Excel upload with auto-detection of columns
- Manage student data with a searchable, paginated table
- Photo management with bulk photo assignment
- Certificate generation with DOB data
- Preview and print certificates

## Tech Stack

- **Frontend**: Next.js (React) with Tailwind CSS
- **Backend** (optional): PHP with PHPSpreadsheet and PHPWord

## Setup Instructions

### Frontend Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd certificate-generator
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### PHP Backend Setup (Optional)

The application can run with client-side only features. However, for full functionality including server-side certificate generation:

1. Install PHP 7.4 or higher and Composer

2. Navigate to the PHP directory
   ```bash
   cd public/api
   ```

3. Install PHP dependencies
   ```bash
   composer install
   ```

4. Ensure the output and photos directories are writable
   ```bash
   chmod -R 755 ../../output
   chmod -R 755 ../../photos
   ```

## Usage

1. **Upload Excel**: Use the upload section to select your Excel file containing student data.
   - The application will automatically detect columns for Name, Father's Name, Mother's Name, DOB, DOB in Words, Class, and Address.

2. **Manage Students**: The data table allows you to:
   - Search, filter, and paginate student records
   - Select students for certificate generation
   - Double-click a row to edit student details

3. **Photo Management**:
   - Bulk-assign photos to selected students
   - Toggle whether to include photos in certificates

4. **Generate Certificates**:
   - Create a certificate template or use the default
   - Select students and click "Generate Certificates"
   - Preview, print, or download the generated certificates

## Sample Excel Format

Create a sample Excel file with the following columns:
- Name
- Father's Name
- Mother's Name
- DOB
- DOB in Words
- Class
- Address

## License

MIT
