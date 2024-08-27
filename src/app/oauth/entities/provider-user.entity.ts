import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProviderEntity } from './provider.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({
  name: 'provider_users',
})
export class ProviderUserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'provider_user_id' })
  providerUserId: string;

  @Column({
    name: 'external_id',
  })
  externalId: string;

  @ManyToOne(() => ProviderEntity)
  @JoinColumn({ name: 'provider_id' })
  provider: ProviderEntity;

  @ManyToOne(() => UserEntity, (user) => user.providerUsers)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

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
}
