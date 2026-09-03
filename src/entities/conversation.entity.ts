import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConversationMember } from './conversation-member.entity';
import { Message } from './message.entity';
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;
  @Column({ nullable: true })
  title!: string;
  @Column({ nullable: true })
  imageUrl!: string;
  @OneToMany(() => ConversationMember, (member) => member.conversation, {
    cascade: true,
  })
  members!: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  uptadedAt!: Date;
}
