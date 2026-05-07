import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  age: number;

  @Column({ type: 'date' })
  birthday: Date;

  @Column()
  password: string;

  @Column()
  salt: string;

  @Column({ default: 'user' })
  role: string; // 'admin' | 'user'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
