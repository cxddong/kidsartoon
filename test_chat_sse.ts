import fetch from 'node-fetch';

async function testChat() {
    console.log("Tracing /api/magic-lab/chat SSE events...\n");
    try {
        const res = await fetch('http://localhost:3001/api/magic-lab/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Tell me a story about a dragon and a cat in 3 sentences.' })
        });

        if (!res.body) throw new Error("No response body");

        let fullText = "";
        let audioCount = 0;

        (res.body as any).on('data', (chunk: Buffer) => {
            const dataStr = chunk.toString();
            const lines = dataStr.split('\n\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(line.replace('data: ', ''));
                    if (data.type === 'text') {
                        process.stdout.write(data.content);
                        fullText += data.content;
                    } else if (data.type === 'audio') {
                        audioCount++;
                        console.log(`\n[EVENT] Audio Segment #${audioCount} received. Current text length: ${fullText.length}`);
                    }
                } catch (e) { }
            }
        });

        (res.body as any).on('end', () => {
            console.log("\n\nStream ended.");
            console.log(`Summary: ${audioCount} audio segments received.`);
        });

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testChat();
