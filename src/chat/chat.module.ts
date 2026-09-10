import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { MessageRead } from 'src/entities/message-read.entity';
import { MessageReaction } from 'src/entities/message-reaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationMember,
      Message,
      User,
      MessageRead,
      MessageReaction,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
