import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { Attachment } from './attachment.entity';
import { MessageReaction } from './message-reaction.entity';
import { MessageRead } from './message-read.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ unique: true, nullable: true })
  idempotencyKey!: string;

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  sender!: User;

  @ManyToOne(() => Message, (message) => message.replies, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parentMessage!: Message;

  @OneToMany(() => Message, (message) => message.parentMessage)
  replies!: Message[];

  @OneToMany(() => Attachment, (attachment) => attachment.message, {
    cascade: true,
  })
  attachments!: Attachment[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.message, {
    cascade: true,
  })
  reactions!: MessageReaction[];
  @OneToMany(() => MessageRead, (read) => read.message)
  reads: MessageRead[];

  @CreateDateColumn()
  @Index()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
