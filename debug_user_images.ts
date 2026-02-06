
import { adminDb } from './src/services/firebaseAdmin';

const userId = 'lLcqrs6ZfnZLqaWzSt88nfcdkcv2';

async function debugImages() {
    console.log(`Querying images for user: ${userId}`);
    try {
        const snapshot = await adminDb.collection('images')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        console.log(`Found ${snapshot.size} images.`);

        if (snapshot.empty) {
            console.log("No images found!");
            return;
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log('------------------------------------------------');
            console.log(`ID: ${doc.id}`);
            console.log(`Type: '${data.type}'`); // Quote to see spaces/empty
            console.log(`ImageURL: ${data.imageUrl ? data.imageUrl.slice(0, 50) + '...' : 'UNDEFINED'}`);
            console.log(`CreatedAt:`, data.createdAt);
            console.log(`Meta:`, JSON.stringify(data.meta || {}));

            // Test filter logic
            const validTypes = ['upload', 'generated', 'masterpiece', 'comic', 'pixel-art', 'drawing'];
            const isCorrectType = validTypes.includes(data.type);
            const imageUrl = data.imageUrl || '';
            const isVideoOrAudio = /\.(mp4|webm|mov|avi|mp3|wav|m4a)($|\?)/i.test(imageUrl);
            const hasUrl = !!imageUrl;
            const isAnalysis = data.meta?.isAnalysisOnly;

            console.log(`Passes Filter? Type(${isCorrectType}) Url(${hasUrl}) !Video(${!isVideoOrAudio}) !Analysis(${!isAnalysis})`);
        });

    } catch (error) {
        console.error("Error querying images:", error);
    }
}

debugImages().then(() => process.exit());
