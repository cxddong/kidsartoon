import 'dotenv/config';

const key = process.env.OPENAI_API_KEY;
if (key) {
    console.log(`OPENAI_API_KEY is set: ${key.substring(0, 5)}...`);
} else {
    console.log("OPENAI_API_KEY is NOT set.");
}
