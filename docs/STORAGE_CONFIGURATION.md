# Storage Configuration Guide

The Hyperion backend supports multiple storage options for video files, audio segments, and images.

## Storage Types

### 1. Local Filesystem (Default)

For development and local deployment.

**Environment Variables:**

```bash
STORAGE_TYPE=local
STORAGE_BASE_PATH=./videos  # Optional, defaults to ./videos
```

**Pros:**

- No additional setup required
- Fast access
- No cost

**Cons:**

- Not suitable for Vercel or other serverless platforms
- No redundancy
- Limited scalability

---

### 2. AWS S3

For production deployment with AWS infrastructure.

**Environment Variables:**

```bash
STORAGE_TYPE=s3
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_PUBLIC_URL=https://your-bucket-name.s3.amazonaws.com  # Optional
```

**Setup Steps:**

1. Create an S3 bucket in AWS Console
2. Configure bucket permissions (public or private with CloudFront)
3. Create IAM user with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name/*",
           "arn:aws:s3:::your-bucket-name"
         ]
       }
     ]
   }
   ```
4. Copy credentials to `.env`

**Pros:**

- Highly scalable
- 99.999999999% durability
- Integrates with CloudFront CDN
- Works on any platform (including Vercel)

**Cons:**

- Cost (storage + bandwidth)
- Requires AWS account

---

### 3. Cloudflare R2 (Recommended for Vercel)

S3-compatible storage with zero egress fees.

**Environment Variables:**

```bash
STORAGE_TYPE=r2
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=your-r2-access-key
STORAGE_SECRET_ACCESS_KEY=your-r2-secret-key
STORAGE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
STORAGE_PUBLIC_URL=https://your-custom-domain.com  # Optional, for public access
```

**Setup Steps:**

1. Create a Cloudflare account
2. Go to R2 in Cloudflare dashboard
3. Create a new bucket
4. Generate R2 API tokens:
   - Go to R2 > Manage R2 API Tokens
   - Create API Token with "Object Read & Write" permissions
5. Note your Account ID for the endpoint URL
6. (Optional) Configure custom domain for public access:
   - Go to bucket settings > Public Access
   - Add custom domain
   - Update DNS records as instructed

**Pros:**

- **Zero egress fees** (no bandwidth charges)
- S3-compatible API
- Fast global CDN
- Cost-effective
- Perfect for Vercel deployment

**Cons:**

- Requires Cloudflare account
- Newer service (less mature than S3)

---

### 4. Vercel Blob Storage

Native storage for Vercel deployments.

**Environment Variables:**

```bash
STORAGE_TYPE=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_token
VERCEL_BLOB_BASE_URL=https://your-blob-url.vercel-storage.app
```

**Setup Steps:**

1. Install Vercel Blob SDK:

   ```bash
   npm install @vercel/blob
   ```

2. Enable Blob Storage in Vercel dashboard:

   - Go to your project settings
   - Navigate to Storage tab
   - Create a Blob store

3. Tokens are automatically added to your environment

**Pros:**

- Native Vercel integration
- Simple setup
- Automatic environment configuration

**Cons:**

- Vendor lock-in
- Higher cost compared to R2
- Not yet implemented (TODO in storage.service.ts)

---

## Vercel Deployment Configuration

For deploying to Vercel with cloud storage:

### Recommended: Cloudflare R2

**1. Setup R2 (see above)**

**2. Add environment variables to Vercel:**

```bash
# In Vercel dashboard or CLI
vercel env add STORAGE_TYPE
# Enter: r2

vercel env add STORAGE_BUCKET
# Enter: your-bucket-name

vercel env add STORAGE_REGION
# Enter: auto

vercel env add STORAGE_ACCESS_KEY_ID
# Enter: your-r2-access-key

vercel env add STORAGE_SECRET_ACCESS_KEY
# Enter: your-r2-secret-key

vercel env add STORAGE_ENDPOINT
# Enter: https://your-account-id.r2.cloudflarestorage.com

vercel env add STORAGE_PUBLIC_URL
# Enter: https://your-custom-domain.com (or bucket URL)
```

**3. Deploy:**

```bash
cd backend
vercel --prod
```

### Alternative: AWS S3

Same process as R2, but use `STORAGE_TYPE=s3` and appropriate S3 credentials.

---

## File Access URLs

The storage service automatically generates correct URLs based on storage type:

```typescript
// In your code
import { StorageService } from "./services/storage.service";

// Get public URL for a file
const url = storageService.getPublicUrl("videoId/lesson_1/audio.wav");

// Local: /videos/videoId/lesson_1/audio.wav
// S3: https://bucket.s3.amazonaws.com/videoId/lesson_1/audio.wav
// R2: https://your-custom-domain.com/videoId/lesson_1/audio.wav
```

---

## Usage Examples

### Writing Files

```typescript
import { StorageService } from "./services/storage.service";

// Write JSON file
await storageService.writeFile(
  "videoId/lesson_1/metadata.json",
  JSON.stringify(metadata, null, 2)
);

// Write binary file (image, audio, video)
const audioBuffer = await generateAudio();
await storageService.writeFile("videoId/lesson_1/audio.wav", audioBuffer);
```

### Reading Files

```typescript
// Read file as buffer
const buffer = await storageService.readFile("videoId/lesson_1/audio.wav");

// Read JSON file
const jsonBuffer = await storageService.readFile(
  "videoId/lesson_1/metadata.json"
);
const metadata = JSON.parse(jsonBuffer.toString("utf-8"));
```

### Checking File Existence

```typescript
const exists = await storageService.fileExists("videoId/lesson_1/audio.wav");
if (!exists) {
  // Generate the file
}
```

### Creating Directories

```typescript
// Note: Only needed for local storage
await storageService.createDirectory("videoId/lesson_1/lesson_segments");
```

---

## Migration Guide

### From Local to Cloud Storage

1. **Upload existing files to cloud storage:**

   Using AWS CLI for S3:

   ```bash
   aws s3 sync ./backend/videos/ s3://your-bucket-name/ --recursive
   ```

   Using Rclone for R2:

   ```bash
   rclone sync ./backend/videos/ r2:your-bucket-name/
   ```

2. **Update environment variables**

3. **Test with a single video first:**

   ```bash
   # Set STORAGE_TYPE temporarily
   STORAGE_TYPE=r2 npm run start:dev
   ```

4. **Deploy to production**

### Hybrid Approach

You can use local storage for development and cloud storage for production:

**Local `.env`:**

```bash
STORAGE_TYPE=local
```

**Vercel environment variables:**

```bash
STORAGE_TYPE=r2
# ... other R2 credentials
```

---

## Cost Comparison

### Cloudflare R2 (Recommended)

- Storage: $0.015/GB/month
- Class A operations (write): $4.50/million
- Class B operations (read): $0.36/million
- **Egress: $0 (FREE)**

**Example:** 100GB storage + 1M reads/month = ~$1.86/month

### AWS S3

- Storage: $0.023/GB/month (S3 Standard)
- PUT requests: $0.005/1000
- GET requests: $0.0004/1000
- **Egress: $0.09/GB** (expensive!)

**Example:** 100GB storage + 1M reads + 50GB egress = ~$6.80/month

### Vercel Blob

- Storage: $0.15/GB/month
- Bandwidth: Included in plan
- Simple pricing model

**Example:** 100GB storage = ~$15/month

---

## Troubleshooting

### "S3 client not initialized"

Make sure you have set all required environment variables for your storage type.

### "Cloud storage upload failed"

Check:

1. Credentials are correct
2. Bucket exists
3. Permissions are properly configured
4. Network connectivity

### "Access Denied" errors

For S3/R2, verify IAM policy includes required permissions.

### Files not accessible on frontend

1. Check STORAGE_PUBLIC_URL is set correctly
2. Verify bucket CORS configuration:
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3600
       }
     ]
   }
   ```

---

## Security Best Practices

1. **Never commit credentials to git**

   - Use `.env` files (already in `.gitignore`)
   - Use Vercel environment variables for deployment

2. **Use separate buckets for dev/staging/prod**

3. **Enable versioning on production buckets**

4. **Use IAM roles instead of keys when possible**

5. **Restrict bucket permissions to minimum required**

6. **Enable logging for production buckets**

7. **Use HTTPS only for all URLs**

---

## Next Steps

After configuring storage:

1. Test file upload with a small video
2. Verify file accessibility from frontend
3. Monitor costs in cloud provider dashboard
4. Set up alerts for unusual activity
5. Configure CDN if needed for better performance
