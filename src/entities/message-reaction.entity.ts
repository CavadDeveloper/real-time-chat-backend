import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
@Entity('message_reactions')
@Unique(['message', 'user', 'emoji'])
export class MessageReaction {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  emoji!: string;
  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: 'CASCADE',
  })
  message!: Message;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
}
