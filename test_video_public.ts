import { doubaoService } from './src/services/doubao.js';

async function testVideoComponents() {
    console.log("=== Testing Doubao Video Components ===");

    // 1. Test with Public URL (known good)
    const publicUrl = "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_i2v.png";

    console.log("--- 1. Testing with Public URL ---");
    try {
        const url = await doubaoService.generateVideo(publicUrl, "Test video prompt");
        console.log("SUCCESS (Public URL):", url);
    } catch (e: any) {
        console.error("FAILURE (Public URL):", e.message);
    }

    // 2. Test with Base64
    // console.log("\n--- 2. Testing with Base64 ---");
    // const tinyBase64 = "data:image/jpeg;base64,..."; 
    // try {
    //    const url = await doubaoService.generateVideo(tinyBase64, "Test video prompt");
    //    console.log("SUCCESS (Base64):", url);
    //} catch (e: any) {
    //    console.error("FAILURE (Base64):", e.message);
    //}
}

testVideoComponents();
