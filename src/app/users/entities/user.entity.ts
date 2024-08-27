import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProviderUserEntity } from '../../oauth/entities/provider-user.entity';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({
    name: 'user_name',
  })
  userName: string;

  @Column({
    name: 'email',
  })
  email: string;

  // Define the bidirectional part of UserEntity to ProviderUserEntity
  @OneToMany(() => ProviderUserEntity, (providerUser) => providerUser.user)
  providerUsers?: ProviderUserEntity[];

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
