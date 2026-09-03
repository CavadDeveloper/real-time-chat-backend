import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';
@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  fileUrl!: string;
  @Column()
  fileType!: string;
  @Column()
  fileName!: string;
  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  message!: Message;
  @CreateDateColumn()
  createdAt!: Date;
}
