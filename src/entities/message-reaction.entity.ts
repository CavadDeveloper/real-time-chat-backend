import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('message_reactions')
export class MessageReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reaction: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  message: Message;

  @CreateDateColumn()
  createdAt: Date;
}
