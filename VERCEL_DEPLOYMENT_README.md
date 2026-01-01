# Vercel Deployment Guide

This guide will help you deploy the Blockchain Certificate System to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Hosted Database**: Since Vercel doesn't support SQLite, you need a hosted database

## Database Migration (Required)

Vercel doesn't support SQLite databases. You must migrate to a hosted database service:

### Option 1: PlanetScale (Recommended for Vercel)
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Create account at https://planetscale.com
# Create a new database
pscale database create blockchain-cert --org YOUR_ORG

# Connect to your database
pscale connect blockchain-cert main --org YOUR_ORG
```

### Option 2: Railway
```bash
# Create account at https://railway.app
# Create MySQL database
# Get connection details from Railway dashboard
```

### Option 3: AWS RDS / Google Cloud SQL
Configure your preferred cloud provider's MySQL instance.

## Environment Variables Setup

Create a `.env.local` file in the `frontend v2` directory:

```bash
# Database Configuration
DB_TYPE=mysql
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id

# Blockchain Configuration (Optional)
BLOCKCHAIN_RPC_URL=https://your-rpc-endpoint
BLOCKCHAIN_ADMIN_PRIVATE_KEY=your-private-key
```

## Database Schema

Create the following tables in your hosted database:

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'employer', 'registrar', 'admin') NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    university VARCHAR(255),
    wallet_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    password_history TEXT,
    otp VARCHAR(10),
    otp_expire TIMESTAMP NULL,
    session_id VARCHAR(255),
    refresh_token VARCHAR(255),
    is_banned BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255),
    requires_password_set BOOLEAN DEFAULT FALSE,
    registration_number VARCHAR(255),
    graduation_year INT,
    degree_type VARCHAR(255),
    certificate_file VARCHAR(255),
    transcripts_file VARCHAR(255),
    id_passport_file VARCHAR(255)
);

-- Certificates table
CREATE TABLE certificates (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    issued_at VARCHAR(50),
    issued_by VARCHAR(255),
    student_email VARCHAR(255),
    wallet_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    token_id VARCHAR(255),
    grade VARCHAR(50),
    description TEXT,
    certificate_type VARCHAR(100),
    institution VARCHAR(255),
    honors VARCHAR(255),
    registration_number VARCHAR(255),
    registrar_address VARCHAR(255)
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_certificates_student ON certificates(student_email);
```

## Deployment Steps

### Step 1: Prepare the Repository

1. **Move API routes to correct location**:
   ```bash
   # The API routes should be in frontend v2/src/pages/api/
   # Vercel will automatically detect them
   ```

2. **Update import paths** in API routes if needed

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `frontend v2`

2. **Configure Build Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend v2`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   Add all the environment variables from your `.env.local` file

### Step 3: File Upload Configuration

Vercel has limitations with file uploads. Consider these options:

#### Option 1: Vercel Blob (Recommended)
```bash
npm install @vercel/blob
```

Update your upload handling to use Vercel Blob storage.

#### Option 2: Cloudinary / AWS S3
```bash
npm install cloudinary
# or
npm install aws-sdk
```

Configure external storage for file uploads.

## API Routes Structure

Your API routes should be organized as follows:

```
frontend v2/src/pages/api/
├── health.js
├── auth/
│   ├── login.js
│   ├── register.js
│   └── logout.js
├── certificates/
│   ├── index.js
│   └── [id].js
└── admin/
    ├── users.js
    └── stats.js
```

## Testing Deployment

1. **Local Testing**:
   ```bash
   cd frontend v2
   npm install
   npm run build
   npm run preview
   ```

2. **Vercel Preview Deployment**:
   - Push changes to a feature branch
   - Vercel will create a preview deployment
   - Test all functionality

3. **Production Deployment**:
   - Merge to main branch
   - Vercel will deploy to production

## Common Issues & Solutions

### Database Connection Issues
- Ensure all environment variables are set correctly
- Check database firewall settings allow Vercel IPs
- Use SSL connections for production

### Cold Start Performance
- Vercel's serverless functions have cold starts
- Consider keeping frequently used functions warm

### File Upload Limits
- Vercel has a 4.5MB request limit for serverless functions
- Use external storage for larger files

### CORS Issues
- Vercel handles CORS automatically for same-origin requests
- Configure CORS headers in API routes if needed

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Database Security**: Use SSL connections and strong passwords
3. **Rate Limiting**: Implement proper rate limiting in API routes
4. **Input Validation**: Validate all user inputs
5. **HTTPS**: Vercel provides SSL certificates automatically

## Monitoring & Maintenance

1. **Vercel Analytics**: Monitor performance and errors
2. **Database Monitoring**: Set up alerts for database issues
3. **Backup Strategy**: Regular database backups
4. **Update Dependencies**: Keep packages updated for security

## Cost Considerations

- **Vercel Hobby Plan**: Free for personal projects
- **Database Costs**: Depends on your chosen provider
- **Storage Costs**: If using external file storage
- **Bandwidth**: Monitor usage for large file transfers

## Troubleshooting

If deployment fails:

1. Check Vercel build logs
2. Verify environment variables are set
3. Test database connection locally
4. Check for missing dependencies
5. Ensure API routes are properly structured

For support:
- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://vercel.com/discord
