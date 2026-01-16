import { ImageRecord } from "../../client/src/components/history/ImageModal";

export interface NudgeResult {
    type: 'upsell' | 'milestone' | null;
    message?: string;
    targetRoute?: string;
    icon?: string;
}

export const nudgeService = {
    checkMilestones(images: ImageRecord[]): NudgeResult {
        const imageCount = images.length;
        const animationCount = images.filter(img => img.type === 'animation').length;

        // Strategy 1: Magic Storybook Upsell (Near 20 pages)
        if (imageCount >= 10 && imageCount < 20) {
            const pagesNeeded = 20 - imageCount;
            if (pagesNeeded <= 3) {
                return {
                    type: 'milestone',
                    message: `Almost there! Create ${pagesNeeded} more masterpieces to print your own REAL BOOK!`,
                    targetRoute: '/press',
                    icon: '📚'
                };
            }
        }

        // Strategy 2: Full Book ready
        if (imageCount >= 20 && imageCount <= 22) {
            return {
                type: 'upsell',
                message: "Wow! You have enough art for a Magic Storybook! Want to see it?",
                targetRoute: '/press',
                icon: '🌟'
            };
        }

        // Strategy 3: Cinema Book Upsell
        if (animationCount >= 3) {
            return {
                type: 'upsell',
                message: "Your movies are amazing! Put them in a Magic Cinema Book? (It plays video!)",
                targetRoute: '/press',
                icon: '🎬'
            };
        }

        return { type: null };
    }
};
