import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Onlayn istifadəçiləri izləmək üçün: userId -> socketId
  private onlineUsers = new Map<number, string>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`İstifadəçi qoşuldu: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`İstifadəçi ayrıldı: ${client.id}`);
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        this.server.emit('user_offline', { userId });
        break;
      }
    }
  }

  @SubscribeMessage('user_connected')
  handleUserConnected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    this.onlineUsers.set(data.userId, client.id);
    this.server.emit('user_online', { userId: data.userId });
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room_${data.conversationId}`);
    return { event: 'joined_room', conversationId: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: { conversationId: number; content: string; senderId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const savedMessage = await this.chatService.saveMessage(
        data.senderId,
        data.conversationId,
        data.content,
      );

      this.server
        .to(`room_${data.conversationId}`)
        .emit('new_message', savedMessage);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: { conversationId: number; userId: number; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      username: data.username,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() data: { conversationId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room_${data.conversationId}`).emit('user_stop_typing', {
      userId: data.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: number; conversationId: number; userId: number },
  ) {
    await this.chatService.markMessageAsRead(data.messageId, data.userId);
    this.server.to(`room_${data.conversationId}`).emit('message_read', {
      messageId: data.messageId,
      userId: data.userId,
      readAt: new Date(),
    });
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: number;
      conversationId: number;
      userId: number;
      newContent: string;
    },
  ) {
    const updatedMessage = await this.chatService.editMessage(
      data.messageId,
      data.userId,
      data.newContent,
    );

    this.server
      .to(`room_${data.conversationId}`)
      .emit('message_updated', updatedMessage);
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: number; conversationId: number; userId: number },
  ) {
    const deletedMessage = await this.chatService.deleteMessage(
      data.messageId,
      data.userId,
    );

    this.server.to(`room_${data.conversationId}`).emit('message_deleted', {
      messageId: deletedMessage.id,
      isDeleted: true,
    });
  }
  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: number; limit?: number; offset?: number },
  ) {
    const messages = await this.chatService.getMessageForConversation(
      data.conversationId,
      data.limit || 20,
      data.offset || 0,
    );
    client.emit('messages_list', messages);
  }
  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    const count = await this.chatService.getUnreadCount(
      data.userId,
      data.conversationId,
    );
    client.emit('unread_count', { conversationId: data.conversationId, count });
  }
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    const result = await this.chatService.markMessagesAsRead(
      data.userId,
      data.conversationId,
    );
    if (result) {
      this.server.to(`room_${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        userId: data.userId,
        lastReadMessageId: result.lastReadMessageId,
      });
    }
  }
}
