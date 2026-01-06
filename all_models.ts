import 'dotenv/config';
import fetch from 'node-fetch';

async function listAll() {
    const key = process.env.GOOGLE_API_KEY;
    console.log("Checking v1...");
    const rv1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const dv1: any = await rv1.json();
    console.log("v1 models:", dv1.models?.map((m: any) => m.name));

    console.log("\nChecking v1beta...");
    const rv1b = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const dv1b: any = await rv1b.json();
    console.log("v1beta models:", dv1b.models?.map((m: any) => m.name));
}
listAll();
