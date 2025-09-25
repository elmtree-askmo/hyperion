# OpenAI API Connectivity Test

This TypeScript script tests the connectivity and functionality of the OpenAI API using the native OpenAI library.

## Prerequisites

1. **OpenAI API Key**: You need a valid OpenAI API key
2. **Environment Variables**: Set up your `.env` file with the OpenAI API key

## Setup

1. Install dependencies (already done if you're in the main project):

   ```bash
   npm install openai dotenv
   ```

2. Create or update your `.env` file in the project root:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

## Usage

### Running the test script:

```bash
# Using npm script (recommended)
npm run test:openai

# Or directly with ts-node
npx ts-node scripts/test-openai-connectivity.ts
```

## Tests Performed

The script performs the following connectivity tests:

1. **API Key Configuration Test**
   - Verifies that the OPENAI_API_KEY environment variable is set
   - Checks if the API key has the correct format (starts with 'sk-')

2. **Basic Connection Test**
   - Tests basic connectivity to OpenAI API
   - Fetches the list of available models

3. **Chat Completion Test**
   - Tests the chat completions endpoint
   - Sends a simple test message and verifies the response

4. **Model Availability Test**
   - Checks which common models are available in your account
   - Looks for models like gpt-3.5-turbo, gpt-4, text-embedding-ada-002

## Sample Output

```
[2025-09-25T02:49:34.867Z] INFO: Starting OpenAI API Connectivity Tests...
============================================================
[2025-09-25T02:49:34.867Z] INFO: Testing API Key Configuration...
[2025-09-25T02:49:34.867Z] SUCCESS: ✓ API Key Configuration test passed
[2025-09-25T02:49:34.868Z] INFO: Testing basic API connection...
[2025-09-25T02:49:35.296Z] SUCCESS: ✓ Basic Connection test passed. Found 50 models
[2025-09-25T02:49:35.296Z] INFO: Testing Chat Completions API...
[2025-09-25T02:49:35.332Z] SUCCESS: ✓ Chat Completion test passed. Response: "Hello, World!"
[2025-09-25T02:49:35.332Z] INFO: Testing model availability...
[2025-09-25T02:49:35.364Z] SUCCESS: ✓ Model Availability test passed. Found models: gpt-3.5-turbo, gpt-4
============================================================
Test Summary:
============================================================
✓ API Key Configuration: API key is properly configured (5ms)
✓ Basic Connection: Successfully connected. Found 50 models (428ms)
✓ Chat Completion: Response: "Hello, World!" (36ms)
✓ Model Availability: Found 2/3 common models: gpt-3.5-turbo, gpt-4 (32ms)
============================================================
Total Tests: 4
Passed: 4
Failed: 0
Total Duration: 531ms
============================================================
🎉 All tests passed! OpenAI API connectivity is working correctly.
```

## Troubleshooting

### Common Issues:

1. **Missing API Key**

   ```
   ✗ API Key Configuration test failed: OPENAI_API_KEY environment variable is not set
   ```

   - Solution: Add your OpenAI API key to the `.env` file

2. **Invalid API Key Format**

   ```
   ✗ API Key Configuration test failed: OPENAI_API_KEY does not appear to be a valid OpenAI API key format
   ```

   - Solution: Ensure your API key starts with 'sk-'

3. **Network/Authentication Errors**

   ```
   ✗ Basic Connection test failed: Request failed with status code 401
   ```

   - Solution: Check if your API key is valid and has not expired
   - Verify your OpenAI account has sufficient credits

4. **Model Access Issues**

   ```
   ✗ Chat Completion test failed: Model gpt-4 is not available
   ```

   - Solution: Use a model available in your OpenAI plan (e.g., gpt-3.5-turbo)

## Integration

You can also import and use the test class in your own TypeScript code:

```typescript
import { OpenAIConnectivityTest } from './scripts/test-openai-connectivity';

const tester = new OpenAIConnectivityTest();
await tester.runAllTests();
```
