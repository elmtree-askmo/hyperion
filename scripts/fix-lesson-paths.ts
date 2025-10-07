/**
 * Fix audio and background URLs in lesson JSON files
 * Converts: /videos/lesson_1/... -> /videos/henIVlCPVIY/lesson_1/...
 */
import * as fs from 'fs/promises';
import * as path from 'path';

async function fixLessonPaths() {
  const lessonPath = path.join(process.cwd(), 'videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json');

  console.log('Reading lesson file:', lessonPath);

  // Read the file
  const content = await fs.readFile(lessonPath, 'utf-8');
  const data = JSON.parse(content);

  // Fix paths
  let modified = false;
  if (data.lesson && data.lesson.segmentBasedTiming) {
    data.lesson.segmentBasedTiming.forEach((segment: any) => {
      // Fix audioUrl
      if (segment.audioUrl && segment.audioUrl.startsWith('/videos/lesson_')) {
        segment.audioUrl = segment.audioUrl.replace('/videos/lesson_', '/videos/henIVlCPVIY/lesson_');
        modified = true;
      }

      // Fix backgroundUrl
      if (segment.backgroundUrl && segment.backgroundUrl.startsWith('/videos/lesson_')) {
        segment.backgroundUrl = segment.backgroundUrl.replace('/videos/lesson_', '/videos/henIVlCPVIY/lesson_');
        modified = true;
      }
    });
  }

  if (modified) {
    // Backup original
    const backupPath = lessonPath + '.backup';
    await fs.copyFile(lessonPath, backupPath);
    console.log('Created backup:', backupPath);

    // Write fixed file
    await fs.writeFile(lessonPath, JSON.stringify(data, null, 2));
    console.log('✅ Fixed paths in:', lessonPath);
  } else {
    console.log('ℹ️  No changes needed');
  }
}

fixLessonPaths()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
