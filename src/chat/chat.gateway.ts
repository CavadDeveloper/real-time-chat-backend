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
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`İstifadəçi qoşuldu: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`İstifadəçi ayrıldı: ${client.id}`);
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
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
