import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { Response } from 'express';

@Injectable()
export class TtsService {
    async tts(data: { text: string }, res: Response) {
        if (!data.text) return res.status(400).send('No text provided');

        const text = encodeURIComponent(data.text.slice(0, 200)); // batasi 200 char
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=id&client=tw-ob`;

        // Fetch audio dari Google TTS
        const ttsRes = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0', // wajib, kalau tidak 404
            },
        });

        const arrayBuffer = await ttsRes.arrayBuffer();

        // Kirim langsung sebagai stream audio
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'inline; filename="tts.mp3"');
        res.send(Buffer.from(arrayBuffer));
    }
}
