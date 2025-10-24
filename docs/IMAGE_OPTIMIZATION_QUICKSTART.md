# Image Optimization Quick Start

This guide shows you how to use the image optimization feature in Hyperion.

## Overview

When Gemini generates images, they can be quite large (4-8 MB). The image optimization feature automatically:

1. Saves the original high-quality PNG
2. Creates an optimized WebP version (70-85% smaller)
3. Logs the size reduction for monitoring

## Quick Example

### Generate and Optimize Images

Images are automatically optimized during the video processing pipeline:

```bash
cd backend

# Process a video (includes image generation and optimization)
npm run start:dev

# Or test image optimization specifically
npm run test:image-optimization
```

### Manual Image Generation with Optimization

```typescript
import { GeminiImageService } from "./services/gemini-image.service";

// Generate image with automatic optimization (default)
const result = await geminiImageService.generateImage(
  "A modern illustration of a laptop and coffee",
  "output/my-image.png",
  true // Enable optimization (default)
);

console.log("Original:", result.originalPath);
// Output: output/my-image.png (5.2MB)

console.log("Optimized:", result.optimizedPath);
// Output: output/my-image_optimized.webp (1.1MB)
```

### Disable Optimization (If Needed)

```typescript
// Generate without optimization
const result = await geminiImageService.generateImage(
  "A modern illustration",
  "output/my-image.png",
  false // Disable optimization
);
```

## File Structure

After generation, you'll have:

```
lesson_segments/
├── segment_1.png              # Original (5.2MB)
├── segment_1_optimized.webp   # Optimized (1.1MB)
├── segment_2.png              # Original (4.8MB)
└── segment_2_optimized.webp   # Optimized (0.9MB)
```

## Using Optimized Images

### In Interactive Viewer

Update your image loading logic to prefer optimized versions:

```typescript
// Try optimized version first, fallback to original
const imagePath = segment.id;
const optimizedPath = `${imagePath}_optimized.webp`;
const originalPath = `${imagePath}.png`;

// Check if optimized exists
const imageUrl = (await checkImageExists(optimizedPath))
  ? optimizedPath
  : originalPath;
```

### In Remotion

```typescript
import { staticFile } from "remotion";

// Use optimized image in video composition
const imageUrl = staticFile(`lesson_segments/${segment.id}_optimized.webp`);

// Or with fallback
const getImageUrl = (segmentId: string) => {
  const optimized = `lesson_segments/${segmentId}_optimized.webp`;
  const original = `lesson_segments/${segmentId}.png`;

  // Use optimized for better performance
  return staticFile(optimized);
};
```

## Testing the Feature

### Run the Test Script

```bash
cd backend
npm run test:image-optimization
```

This will:

1. Generate 3 test images with different complexity levels
2. Optimize each image automatically
3. Display a comparison table with file sizes and reduction percentages
4. Show average metrics

### Expected Output

```
🧪 Testing Image Optimization Feature

============================================================
Test 1/3: Simple Scene
============================================================

📸 Original image saved: test-outputs/test_simple.png (4.20MB, 7.82s)
🔧 Optimizing image: test-outputs/test_simple.png
✅ Image optimized: 4.20MB → 0.85MB (79.8% reduction) in 0.48s

✅ Test completed:
   Original: 4.20 MB
   Optimized: 0.85 MB
   Reduction: 79.8%
   Total time: 8.30s

============================================================
📊 TEST SUMMARY
============================================================

Results by Test Case:

┌─────────┬───────────────────────┬──────────────┬────────────────┬────────────────┬───────────────┐
│ (index) │ Test Case             │ Original (MB)│ Optimized (MB) │ Reduction (%)  │ Duration (s)  │
├─────────┼───────────────────────┼──────────────┼────────────────┼────────────────┼───────────────┤
│    0    │ 'Simple Scene'        │   '4.20'     │    '0.85'      │    '79.8'      │    '8.30'     │
│    1    │ 'Complex Scene'       │   '6.50'     │    '1.20'      │    '81.5'      │   '10.50'     │
│    2    │ 'Educational Visual'  │   '5.10'     │    '1.00'      │    '80.4'      │    '9.20'     │
└─────────┴───────────────────────┴──────────────┴────────────────┴────────────────┴───────────────┘

📈 Average Metrics:

   Original Size: 5.27 MB
   Optimized Size: 1.02 MB
   Size Reduction: 80.6%
   Processing Time: 9.33s per image

💾 Total Storage Saved: 12.75 MB
```

## Configuration

### Default Settings

Current defaults (optimized for web):

```typescript
{
  maxWidth: 1920,      // Full HD width
  maxHeight: 1080,     // Full HD height
  quality: 80,         // 80% quality
  format: 'webp'       // WebP format
}
```

### Customizing Settings

To change optimization settings, edit `gemini-image.service.ts`:

```typescript
// For higher quality (larger files)
private readonly defaultOptimizationOptions = {
  maxWidth: 2560,      // 2K width
  maxHeight: 1440,     // 2K height
  quality: 90,         // Higher quality
  format: 'webp'
};

// For smaller files (lower quality)
private readonly defaultOptimizationOptions = {
  maxWidth: 1280,      // 720p width
  maxHeight: 720,      // 720p height
  quality: 70,         // Lower quality
  format: 'webp'
};

// For JPEG instead of WebP
private readonly defaultOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'jpeg'       // JPEG format
};
```

## Performance Tips

### 1. Use Optimized Images in Production

Always use the `_optimized.webp` versions in production:

- 70-85% smaller file sizes
- Faster page loads
- Better mobile performance
- Lower bandwidth costs

### 2. Keep Original Images as Backup

Don't delete original PNGs:

- Useful for debugging
- Can regenerate optimized versions with different settings
- Lossless quality for archival

### 3. Background Optimization

For large batches, consider optimizing in background:

```typescript
// Optimize asynchronously
Promise.all(
  images.map((img) =>
    geminiImageService.generateImage(img.prompt, img.path, true)
  )
).then((results) => {
  console.log("All images optimized");
});
```

## Troubleshooting

### Sharp Installation Failed

```bash
cd backend
npm rebuild sharp
```

### Optimized Images Not Generated

Check logs for errors:

```
⚠️ Failed to optimize image, using original: [error]
```

The service will fall back to original images if optimization fails.

### Images Still Too Large

Reduce the quality or dimensions in the service configuration:

```typescript
quality: 70,         // Lower from 80
maxWidth: 1280,      // Reduce from 1920
maxHeight: 720       // Reduce from 1080
```

### WebP Not Supported in Browser

For very old browsers, implement fallback logic:

```html
<picture>
  <source srcset="image_optimized.webp" type="image/webp" />
  <img src="image.png" alt="Fallback" />
</picture>
```

## Best Practices

1. **Always enable optimization** for web-facing images
2. **Keep original files** for archival and re-processing
3. **Test optimization settings** with your specific image types
4. **Monitor file sizes** to ensure compression is working
5. **Use WebP format** for best compression and quality balance
6. **Implement fallbacks** for older browsers if needed

## Related Documentation

- [Image Optimization Details](IMAGE_OPTIMIZATION.md)
- [Gemini Image Generation](../backend/GEMINI.md)
- [Video Processing Pipeline](VIDEO_GENERATION_SUMMARY.md)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

## Need Help?

- Check the logs for detailed optimization metrics
- Run `npm run test:image-optimization` to verify setup
- Adjust settings in `gemini-image.service.ts` for your needs
- See [IMAGE_OPTIMIZATION.md](IMAGE_OPTIMIZATION.md) for advanced usage
