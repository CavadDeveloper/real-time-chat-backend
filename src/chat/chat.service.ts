import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private memberRepository: Repository<ConversationMember>,
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
}
