import { Injectable } from '@nestjs/common';
import dotenv from 'dotenv';
import logger from "vico-logger";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
dotenv.config();

@Injectable()
export class MessagesService {

    async findAll(userId: string): Promise<any> {
        try {

            const messages = await prisma.chatMessage.findMany({
                where: { userId: userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            //reverse the messages to have the oldest first
            const data = messages.reverse();

            return data; // Return the parsed data
        } catch (error) {
            logger.error(`Error fetching message: ${error}`)
            return null; // Handle error as needed, returning null or throwing an exception
        }
    }

    async delete(userId: string, id: string): Promise<any> {
        try {

            const messages = await prisma.chatMessage.delete({
                where: { id: id }
            });

            if (!messages) return null

            return messages;
        } catch (error) {
            logger.error(`Error deleting message: ${error}`)
            return null; // Handle error as needed, returning null or throwing an exception
        }
    }

    async deleteAll(userId: string): Promise<any> {
        try {

            const messages = await prisma.chatMessage.deleteMany({
                where: { userId: userId }
            });

            if (!messages) return null

            return messages;
        } catch (error) {
            logger.error(`Error deleting message: ${error}`)
            return null; // Handle error as needed, returning null or throwing an exception
        }
    }
}
