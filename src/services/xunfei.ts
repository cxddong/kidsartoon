import WebSocket from 'ws'; // 现在有类型声明，不会报错
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 讯飞超拟人语音合成配置（替换为你的实际配置）
const XUNFEI_CONFIG = {
    appId: '你的APPID',
    apiKey: '你的APIKey',
    apiSecret: '你的APISecret',
    voiceName: 'xiaoyan', // 童声音色标识
    audioFormat: 'raw' // raw=WAV，lame=MP3
};

/**
 * 生成讯飞WebSocket鉴权URL
 */
function generateAuthUrl(): string {
    const { apiKey, apiSecret } = XUNFEI_CONFIG;
    const host = 'tts-api.xfyun.cn';
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;

    // HMAC-SHA256签名
    const signatureSha = crypto.createHmac('sha256', apiSecret)
        .update(signatureOrigin)
        .digest();
    const signature = Buffer.from(signatureSha).toString('base64');

    // 构造授权头
    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    // 拼接URL参数
    const params = new URLSearchParams({
        authorization,
        date,
        host
    });

    return `wss://${host}/v2/tts?${params.toString()}`;
}

/**
 * 讯飞语音合成核心方法
 * @param text 要合成的文本
 * @param outputPath 音频输出路径
 * @returns Promise<string> 音频文件路径
 */
export async function xunfeiTTS(text: string, outputPath: string = path.join(__dirname, '../audio', `${uuidv4()}.wav`)): Promise<string> {
    return new Promise((resolve, reject) => {
        const authUrl = generateAuthUrl();
        const ws = new WebSocket(authUrl);

        // 创建音频文件目录（若不存在）
        const audioDir = path.dirname(outputPath);
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // 监听连接成功
        ws.on('open', () => {
            console.log('讯飞TTS WebSocket连接成功');
            // 构造发送给讯飞的请求数据
            const requestData = {
                common: {
                    app_id: XUNFEI_CONFIG.appId
                },
                business: {
                    aue: XUNFEI_CONFIG.audioFormat,
                    vcn: XUNFEI_CONFIG.voiceName,
                    speed: 60, // 语速（0-100）
                    pitch: 55, // 语调（0-100）
                    volume: 50, // 音量（0-100）
                    rdn: 0 // 关闭随机断句
                },
                data: {
                    status: 2,
                    text: Buffer.from(text).toString('base64') // 文本Base64编码
                }
            };
            ws.send(JSON.stringify(requestData));
        });

        // 监听消息（核心：接收音频数据）
        // 修复：指定data为Buffer，isBinary为boolean
        ws.on('message', (data: Buffer, isBinary: boolean) => {
            if (isBinary) {
                // 音频数据是二进制，直接写入文件
                fs.appendFileSync(outputPath, data);
            } else {
                // 非二进制是讯飞的状态消息
                const msg = JSON.parse(data.toString());
                if (msg.code !== 0) {
                    reject(new Error(`讯飞TTS错误：${msg.code} - ${msg.message}`));
                    ws.close();
                }
            }
        });

        // 监听连接关闭
        // 修复：指定code为number，reason为Buffer
        ws.on('close', (code: number, reason: Buffer) => {
            console.log(`WebSocket连接关闭：code=${code}, reason=${reason.toString()}`);
            if (code === 1000) {
                // 正常关闭，返回音频文件路径
                resolve(outputPath);
            } else {
                reject(new Error(`连接异常关闭：${reason.toString()}`));
            }
        });

        // 监听错误
        // 修复：指定error为Error
        ws.on('error', (error: Error) => {
            console.error('讯飞TTS WebSocket错误：', error);
            reject(new Error(`WebSocket错误：${error.message}`));
            ws.close();
        });
    });
}