import 'dotenv/config'; // Load env vars
import { xunfeiService } from './src/services/xunfei.js';

async function test() {
    console.log('Testing Xunfei Service Integration...');
    try {
        const audio = await xunfeiService.generateSpeech("你好，测试一下服务的集成。");
        console.log('Success! Audio generated, size:', audio.length);
    } catch (error) {
        console.error('Integration Test Failed:', error);
    }
}

test();
