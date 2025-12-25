export interface VideoTaskParams {
    imageUrl: string;
    prompt: string;
    cameraFixed?: boolean;
    userId?: string;
}

export interface VideoTaskResult {
    taskId: string;
    provider: string; // 'doubao' | 'runway' | 'luma'
}

export interface VideoStatusResult {
    status: 'SUCCEEDED' | 'FAILED' | 'RUNNING' | 'PENDING';
    videoUrl?: string;
    error?: string;
}

export interface IVideoProvider {
    createTask(params: VideoTaskParams): Promise<VideoTaskResult>;
    getTaskStatus(taskId: string): Promise<VideoStatusResult>;
}
