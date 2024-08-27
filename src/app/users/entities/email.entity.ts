import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'emails',
})
export class EmailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'email_id' })
  emailId: string;

  @Column({
    name: 'email',
  })
  email: string;

  @ManyToOne(() => UserEntity, (user) => user.userId)
  @JoinColumn({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'verified',
  })
  verified: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
  })
  deletedAt: Date;
}
