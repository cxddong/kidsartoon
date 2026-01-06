import { magicMentorService } from './src/services/mentor';
import fs from 'fs';

async function testV2Mentor() {
    console.log("=== V2 Cost-Optimized Mentor Test ===");

    const imagePath = 'C:/Users/cxd-d/.gemini/antigravity/brain/7921c3bf-6262-4ebe-be11-733c5f286976/uploaded_image_1767168268517.png';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const req = {
        userId: 'test-user-v2',
        seriesId: 'test-series-v2-' + Date.now(),
        step: 1,
        image: base64Image
    };

    try {
        console.log("Processing Step (V2 Cost-Optimized)...");
        const result = await magicMentorService.processStep(req);

        if (result.success) {
            const feedback = result.series.chapters[0].coachingFeedback;
            console.log("\n✅ V2 SUCCESS!");
            console.log("---");
            console.log("Visual Diagnosis:", feedback.visualDiagnosis);
            console.log("Artist Match:", feedback.masterConnection.artist);
            console.log("Compliment:", feedback.advice.compliment);
            console.log("Actionable Task:", feedback.advice.actionableTask);
            console.log("---");

            // Calculate approximate word count
            const allText = JSON.stringify(feedback);
            const wordCount = allText.split(/\s+/).length;
            console.log(`📊 Response Word Count: ~${wordCount} words (Target: <200)`);
        } else {
            console.error("❌ V2 FAILED:", result);
        }
    } catch (e: any) {
        console.error("❌ V2 ERROR:", e.message);
    }
}

testV2Mentor();
