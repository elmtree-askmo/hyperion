import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FlashcardsService } from '../src/video-transform/services/flashcards.service';

async function testFlashcardsService() {
  console.log('🃏 Testing Flashcards Service...\n');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the FlashcardsService
    const flashcardsService = app.get(FlashcardsService);

    // Test video ID and lesson number
    const videoId = 'henIVlCPVIY'; // Example video ID
    const lessonNumber = 1;

    console.log(`📹 Video ID: ${videoId}`);
    console.log(`📖 Lesson Number: ${lessonNumber}\n`);

    // Test 1: Generate flashcards for a specific lesson
    console.log('Test 1: Generating flashcards for lesson 1...');
    console.log('─'.repeat(60));

    const flashcards = await flashcardsService.generateFlashcards(videoId, lessonNumber);

    console.log(`✅ Generated ${flashcards.length} flashcards\n`);

    // Display flashcards
    flashcards.forEach((card, index) => {
      console.log(`\n🃏 Flashcard ${index + 1}:`);
      console.log(`   Word: ${card.word}`);
      console.log(`   Definition: ${card.definition}`);
      console.log(`   Thai Definition: ${card.thaiDefinition}`);
      console.log(`   Thai Translation: ${card.thaiTranslation}`);
      console.log(`   Pronunciation: ${card.pronunciation}`);
      console.log(`   Phonetic: ${card.phonetic}`);
      console.log(`   Part of Speech: ${card.partOfSpeech}`);
      console.log(`   Difficulty: ${card.difficulty}`);
      console.log(`   Memory Hook: ${card.memoryHook}`);
      console.log(`   Example: ${card.contextExample}`);
    });

    console.log('\n' + '─'.repeat(60));

    // Test 2: Get existing flashcards (should read from file)
    console.log('\nTest 2: Getting existing flashcards...');
    console.log('─'.repeat(60));

    const existingFlashcards = await flashcardsService.getFlashcards(videoId, lessonNumber);
    console.log(`✅ Retrieved ${existingFlashcards.length} flashcards from file\n`);

    // Test 3: Generate flashcards for all lessons
    console.log('\nTest 3: Generating flashcards for all lessons...');
    console.log('─'.repeat(60));

    const allFlashcards = await flashcardsService.generateFlashcardsForAllLessons(videoId);

    console.log(`✅ Generated flashcards for ${Object.keys(allFlashcards).length} lessons:`);
    Object.entries(allFlashcards).forEach(([lesson, cards]) => {
      console.log(`   ${lesson}: ${cards.length} flashcards`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('═'.repeat(60));

    await app.close();
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testFlashcardsService();
