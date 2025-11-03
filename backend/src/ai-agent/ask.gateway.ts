import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AskGateway {
    @WebSocketServer()
    server: Server;

    // contoh menerima pesan dari client
    @SubscribeMessage('chat')
    handleChat(@MessageBody() data: any) {
        // broadcast ke semua client
        this.server.emit('chatResponse', { message: 'Hello from server!' });
    }
}
