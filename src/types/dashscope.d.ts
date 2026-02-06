declare module 'dashscope' {
    export const apiKey: string;
    export namespace audio {
        namespace SpeechSynthesizer {
            function call(params: {
                model: string;
                input: {
                    action?: string;
                    target_model?: string;
                    preferred_name?: string;
                    audio?: {
                        data: string;
                    };
                    text?: string;
                    language?: string;
                };
                parameters?: any;
            }): Promise<any>;
        }
    }
}
