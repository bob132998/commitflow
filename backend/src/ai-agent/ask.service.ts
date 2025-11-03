// ask.service.ts
import { Injectable } from '@nestjs/common';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Socket } from 'socket.io';
import logger from "vico-logger"
import { PrismaClient } from '@prisma/client';
import { SYSTEM_MESSAGE } from "../common/ai.constants";
import { tools } from "./tools.constants";
import { getContributors, getRepos } from "./github.service";

const prisma = new PrismaClient();
dotenv.config();

@Injectable()
export class AskService {
  private emitThinking(socket: Socket | undefined, message: string) {
    if (socket) {
      socket.emit('ai_thinking', { type: 'thinking', message });
    }
  }

  private emitToolCall(socket: Socket | undefined, tool: string, args: any) {
    if (socket) {
      socket.emit('ai_thinking', {
        type: 'tool_call',
        message: `🤖 CommitFlow memproses permintaan...`
      });
    }
  }

  private emitToolAnalyst(socket: Socket | undefined) {
    if (socket) {
      socket.emit('ai_thinking', {
        type: 'tool_result',
        message: `🧠 CommitFlow Memulai analisis...`
      });
    }
  }

  private emitToolResult(socket: Socket | undefined, result: any) {
    if (socket) {
      socket.emit('ai_thinking', {
        type: 'tool_result',
        message: `📊 Data berhasil diproses dan siap ditampilkan.`
      });
    }
  }

  private emitDone(socket: Socket | undefined) {
    if (socket) {
      socket.emit('ai_thinking', {
        type: 'done',
        message: `✅ Semua proses selesai.`
      });
    }
  }

  async chat(data: any, res: any, socket?: any, userId?: string) {
    //save user message to database
    await prisma.chatMessage.create({
      data: {
        userId: userId || '',
        role: 'user',
        content: data.messages[data.messages.length - 1].content,
      },
    });
    //get messages from database by userId limit 10 and add system message at the beginning
    const getMessages = await prisma.chatMessage.findMany({
      where: { userId: userId || '' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    //reverse the messages to have the oldest message first
    const userMessages = getMessages.reverse();

    const messages = [
      {
        role: 'system',
        content: SYSTEM_MESSAGE,
      },
      ...userMessages.map(msg => ({ role: msg.role, content: msg.content })),
      ...data.messages
    ];
    this.emitThinking(socket, '🧠 Thinking...');

    try {
      // === Langkah 1: Cek apakah butuh tool (non-streaming) ===
      const firstRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          tools: tools,
          tool_choice: "auto"
        }),
      });


      if (!firstRes.ok) {
        logger.error(`OpenAI error: ${firstRes.status}`)
        throw new Error(`OpenAI error: ${firstRes.status} ${await firstRes.text()}`);
      }

      const firstResult: any = await firstRes.json();
      const msg = firstResult?.choices[0].message;
      messages.push(msg);

      // === Siapkan header SSE ===
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // pastikan header langsung dikirim

      if (msg.tool_calls) {
        // === Butuh tool ===
        console.log('CommitFlow membutuhkan tool untuk menjawab pertanyaan.');
        for (const call of msg.tool_calls) {
          const fn = call.function.name;
          const args: any = call.function.arguments ? JSON.parse(call.function.arguments) : {};

          if (!fn) continue;
          if (fn === 'getRepos' || fn === 'getContributors') {
            args['cacheDate'] = new Date().toISOString().split('T')[0]; // tambahkan cacheDate hanya untuk tool yang tidak memiliki parameter tanggal spesifik
          }

          let result: any = null;
          result = await prisma.aiToolCache.findFirst({
            where: {
              toolName: fn,
              parameters: {
                equals: args,
              },
            },
          });


          if (
            result &&
            result?.result !== null &&
            result?.result !== "null" &&
            result?.result !== "[]" &&
            result?.result !== "no data" &&
            result?.result !== undefined &&
            result?.length > 0
          ) {
            console.log(`Menggunakan cache untuk tool ${fn} dengan parameter ${JSON.stringify(args)}`);
            console.log('Hasil cache:', result);

            this.emitToolCall(socket, fn, args);
            this.emitToolResult(socket, result);

            messages.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: call.id,
            });
          } else {
            console.log(result);
            console.log(`⚠️ Cache invalid untuk tool ${fn} — result kosong atau null`);
            // Hapus cache yang tidak valid
            if (result) {
              await prisma.aiToolCache.deleteMany({
                where: {
                  id: result.id,
                },
              });
            }
          }


          if (
            !result ||
            result?.result === null ||
            result?.result === "[]" ||
            result?.result === "null" ||
            result?.result === "no data" ||
            result?.result === undefined ||
            !result?.length
          ) {

            if (fn === 'getRepos') {
              this.emitToolCall(socket, fn, args);
              result = await getRepos();
              this.emitToolResult(socket, result);

              messages.push({
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: call.id,
              });
            }

            if (fn === 'getContributors') {
              this.emitToolCall(socket, fn, args);
              result = await getContributors(args.repo);
              this.emitToolResult(socket, result);

              messages.push({
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: call.id,
              });
            }

            if (result !== "no data") {
              // Simpan hasil ke cache
              await prisma.aiToolCache.create({
                data: {
                  toolName: fn,
                  parameters: args,
                  result: result,
                },
              });
            }
          }
        }




        // === Langkah 2: Stream final answer dari OpenAI ===
        const finalStream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            stream: true,
          }),
        });

        if (!finalStream.body) {

          logger.error(`OpenAI error: No stream body`)
          throw new Error('No stream body');
        }

        const decoder = new TextDecoder('utf-8');
        let fullText = '';

        this.emitDone(socket);

        for await (const chunk of finalStream.body as any) {
          // streaming mentah ke client
          const text = decoder.decode(chunk);
          res.write(text);

          // parsing chunk untuk simpan ke DB
          const lines = text.split('\n').filter(line => line.startsWith('data:'));
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, '');
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content || '';
              fullText += token;
            } catch (err) {
              // abaikan error parse, tapi tetap stream ke client
              console.warn('Failed to parse chunk for DB:', err);
            }
          }
        }

        // Simpan teks murni ke DB setelah streaming selesai
        await prisma.chatMessage.create({
          data: {
            userId: userId || 'anonymous',
            role: 'assistant',
            content: fullText,
          },
        });

      } else {

        this.emitDone(socket);
        // === Tidak butuh tool → simulasi streaming dari teks yang sudah ada ===
        const finalText = msg.content || '';
        if (!finalText.trim()) {
          const defaultText: string = 'Maaf, saya tidak bisa menjawab pertanyaan tersebut.';
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: defaultText } }] })}\n\n`);

          // Simpan ke DB setelah streaming
          await prisma.chatMessage.create({
            data: {
              userId: userId || "anonymous",
              role: 'assistant',
              content: defaultText,
            },
          });
        } else {
          for (const char of finalText) {
            const sseChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: char } }] })}\n\n`;
            res.write(sseChunk);
            // Opsional: uncomment untuk efek mengetik
            await new Promise(r => setTimeout(r, 10));
          }
          // Simpan ke DB setelah streaming selesai
          await prisma.chatMessage.create({
            data: {
              userId: userId || "anonymous",
              role: 'assistant',
              content: finalText,
            },
          });
        }
        res.write(' [DONE]\n\n');
      }
    } catch (error) {

      this.emitDone(socket);
      logger.error('AI Chat Error:', error);
      res.write(`data: {"choices":[{"delta":{"content":"Terjadi kesalahan: ${error.message}"}}]}\n\n`);
      res.write(' [DONE]\n\n');
    } finally {
      res.end();
    }
  }
}