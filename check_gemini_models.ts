import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function listAllModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey!);

    // In @google/generative-ai, listModels is not on genAI but usually on a management client
    // however, we can try to probe common ones
    const props = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp'];

    for (const p of props) {
        try {
            const m = genAI.getGenerativeModel({ model: 'models/' + p });
            await m.generateContent('Hi');
            console.log(`TEST ${p}: SUCCESS`);
        } catch (e: any) {
            console.log(`TEST ${p}: FAIL`);
        }
    }
}

listAllModels();
