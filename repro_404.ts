import fetch from 'node-fetch';

async function test() {
    const key = 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY';
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Hi" }] }]
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
test();
