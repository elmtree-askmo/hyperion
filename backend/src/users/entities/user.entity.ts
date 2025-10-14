import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'User password (hashed)' })
  @Column()
  password: string;

  @ApiProperty({ description: 'User first name' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'User role', enum: ['user', 'admin'] })
  @Column({ default: 'user' })
  role: string;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;
}
