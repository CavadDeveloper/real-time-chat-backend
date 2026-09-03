import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  createConversation(
    @Req() req: any,
    @Body() createDto: CreateConversationDto,
  ) {
    const userId = req.user.userId;
    return this.chatService.createConversation(userId, createDto);
  }
  @Get()
  getUserConversation(@Req() req: any) {
    const userId = req.user.userId;
    return this.chatService.getUserConversations(userId);
  }
}
