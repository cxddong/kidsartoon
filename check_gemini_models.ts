import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// The key currently forced in gemini.ts
const API_KEY = "AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY";
const LOG_FILE = 'model_status.txt';

async function listModels() {
    fs.writeFileSync(LOG_FILE, '--- Model Check Start ---\n');

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const models = [
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash',
            'gemini-pro'
        ];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Test");
                fs.appendFileSync(LOG_FILE, `SUCCESS: ${modelName}\n`);
            } catch (error: any) {
                fs.appendFileSync(LOG_FILE, `FAILED: ${modelName} - ${error.message}\n`);
            }
        }
    } catch (error: any) {
        fs.appendFileSync(LOG_FILE, `FATAL: ${error.message}\n`);
    }
    fs.appendFileSync(LOG_FILE, '--- Model Check End ---\n');
}

listModels();
