import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
@Entity('conversation_members')
@Unique(['user', 'conversation'])
export class ConversationMember {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  user!: User;
  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  conversation!: Conversation;
  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role!: MemberRole;
  @CreateDateColumn()
  joinedAt!: Date;
}
