import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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

  @Get(':id/messages')
  getMessages(
    @Req() req: any,
    @Param('id') conversationId: number,
    @Query('cursor') cursor?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.userId;
    return this.chatService.getMessages(
      userId,
      Number(conversationId),
      cursor ? Number(cursor) : undefined,
      limit ? Number(limit) : 20,
    );
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl yüklənmədi');
    }
    return {
      url: `http://localhost:3000/uploads/${file.filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
    };
  }

  @Get(':conversationId/search')
  @ApiOperation({ summary: 'Söhbət daxilində mesaj axtarışı' })
  async searchMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: number,
    @Query('q') query: string,
  ) {
    const userId = req.user.userId;
    return this.chatService.searchMessages(
      userId,
      Number(conversationId),
      query,
    );
  }
}
