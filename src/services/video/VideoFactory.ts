import { IVideoProvider } from './types.js';
import { DoubaoProvider } from './DoubaoProvider.js';

export class VideoFactory {
    private static instance: IVideoProvider;

    static getProvider(): IVideoProvider {
        // Simple Singleton for now, or just re-instantiate if config changes dynamically
        const providerName = process.env.VIDEO_PROVIDER || 'doubao';

        if (!this.instance) {
            console.log(`[VideoFactory] Initializing with provider: ${providerName}`);
            switch (providerName) {
                case 'runway':
                    // this.instance = new RunwayProvider();
                    throw new Error("Runway provider not yet implemented");
                case 'luma':
                    // this.instance = new LumaProvider();
                    throw new Error("Luma provider not yet implemented");
                case 'doubao':
                default:
                    this.instance = new DoubaoProvider();
                    break;
            }
        }
        return this.instance;
    }
}
