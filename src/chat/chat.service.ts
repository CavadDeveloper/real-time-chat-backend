import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessageRead } from 'src/entities/message-read.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(MessageRead)
    private readonly messageReadRepository: Repository<MessageRead>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private memberRepository: Repository<ConversationMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createConversation(userId: number, createDto: CreateConversationDto) {
    const { memberIds, title } = createDto;

    const allMemberIds = Array.from(new Set([userId, ...memberIds]));

    const users = await this.userRepository.findBy({ id: In(allMemberIds) });
    if (users.length !== allMemberIds.length) {
      throw new NotFoundException(
        'İştirakçılardan biri və ya bir neçəsi tapılmadı.',
      );
    }

    const isGroup = allMemberIds.length > 2;

    const conversation = this.conversationRepository.create({
      title: isGroup ? title || 'Qrup Söhbəti' : '',
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    const members = users.map((user) =>
      this.memberRepository.create({
        conversation: savedConversation,
        user: user,
      }),
    );

    await this.memberRepository.save(members);

    return {
      message: 'Söhbət uğurla yaradıldı',
      conversationId: savedConversation.id,
    };
  }

  async getUserConversations(userId: number) {
    const memberships = await this.memberRepository.find({
      where: { user: { id: userId } },
      relations: {
        conversation: {
          members: {
            user: true,
          },
        },
      },
    });

    return memberships.map((m) => m.conversation);
  }

  async saveMessage(userId: number, conversationId: number, content: string) {
    const membership = await this.memberRepository.findOne({
      where: { user: { id: userId }, conversation: { id: conversationId } },
    });

    if (!membership) {
      throw new ForbiddenException('Bu söhbətə mesaj yazmaq icazəniz yoxdur.');
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const message = this.messageRepository.create({
      content: content,
      conversation: conversation!,
      sender: user!,
    });

    return await this.messageRepository.save(message);
  }
  async getMessages(
    userId: number,
    conversationId: number,
    cursor?: number,
    limit: number = 20,
  ) {
    const membership = await this.memberRepository.findOne({
      where: { user: { id: userId }, conversation: { id: conversationId } },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Bu söhbətin tarixçəsinə baxmaq icazəniz yoxdur.',
      );
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      query.andWhere('message.id < :cursor', { cursor });
    }

    const messages = await query.getMany();

    let nextCursor: number | null = null;
    if (messages.length > limit) {
      messages.pop();
      nextCursor = messages[messages.length - 1].id;
    }

    return {
      data: messages.reverse(),
      nextCursor,
    };
  }
  async markMessageAsRead(messageId: number, userId: number) {
    const existing = await this.messageReadRepository.findOne({
      where: { message: { id: messageId }, user: { id: userId } },
    });
    if (existing) return existing;
    const messageRead = this.messageReadRepository.create({
      message: { id: messageId },
      user: { id: userId },
    });
    return this.messageReadRepository.save(messageRead);
  }
  async editMessage(messageId: number, userId: number, newContent: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
      },
    });
    if (!message || message.sender.id !== userId) {
      throw new Error('Unauthorized or message not found');
    }
    message.content = newContent;
    message.isEdited = true;
    return this.messageRepository.save(message);
  }
  async deleteMessage(messageId: number, userId: number) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
      },
    });
    if (!message || message.sender.id !== userId) {
      throw new Error('Unauthorized or message not found');
    }
    message.isDeleted = true;
    message.content = 'This message was deleted';
    return this.messageRepository.save(message);
  }
}
