import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'providers',
})
export class ProviderEntity {
  @PrimaryGeneratedColumn('increment', { name: 'provider_id' })
  providerId: number;

  @Column({
    name: 'name',
  })
  name: string;
}
