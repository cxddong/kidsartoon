import { IVideoProvider, VideoTaskParams, VideoTaskResult, VideoStatusResult } from './types.js';
import { doubaoService } from '../doubao.js';

export class DoubaoProvider implements IVideoProvider {
    async createTask(params: VideoTaskParams): Promise<VideoTaskResult> {
        // Use the robust tiered generation method
        // Map abstract params to specific implementation details
        // CameraFixed essentially means less motion / more stability
        const { taskId } = await doubaoService.generateVideoTask(
            params.imageUrl,
            params.prompt + (params.cameraFixed ? ", stationary camera, stable view" : ", dynamic camera"),
            {
                quality: 'SD', // Default to SD for speed/safety
                duration: 4
            }
        );

        return {
            taskId,
            provider: 'doubao'
        };
    }

    async getTaskStatus(taskId: string): Promise<VideoStatusResult> {
        // Reuse existing service method
        const result = await doubaoService.getVideoTaskStatus(taskId);

        // Explicitly cast or map status
        const status = result.status as 'SUCCEEDED' | 'FAILED' | 'RUNNING' | 'PENDING';

        return {
            status,
            videoUrl: result.videoUrl,
            error: result.error
        };
    }
}
