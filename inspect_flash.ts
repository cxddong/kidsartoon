import 'dotenv/config';
import fetch from 'node-fetch';

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    const data: any = await res.json();
    const flash = data.models?.find((m: any) => m.name.includes('gemini-1.5-flash'));
    console.log(JSON.stringify(flash, null, 2));
}
listModels();
