import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVideoGenerationStatus1758624000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add video_generation_status column
    await queryRunner.addColumn(
      'video_jobs',
      new TableColumn({
        name: 'video_generation_status',
        type: 'enum',
        enum: ['not_started', 'generating', 'completed', 'failed'],
        default: "'not_started'",
        isNullable: false,
      }),
    );

    // Add video_generation_data column
    await queryRunner.addColumn(
      'video_jobs',
      new TableColumn({
        name: 'video_generation_data',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop video_generation_data column
    await queryRunner.dropColumn('video_jobs', 'video_generation_data');

    // Drop video_generation_status column
    await queryRunner.dropColumn('video_jobs', 'video_generation_status');
  }
}
