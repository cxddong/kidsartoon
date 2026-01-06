/**
 * 快速设置管理员积分 - 使用Firebase Admin SDK
 * 运行: node set_admin_points.js YOUR_USER_ID
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminPoints(userId) {
    try {
        console.log(`Setting admin points for user: ${userId}...`);

        const userRef = db.collection('users').doc(userId);

        // 检查用户是否存在
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.error(`❌ User ${userId} does not exist!`);
            return;
        }

        // 更新积分为99999（管理员标识）
        await userRef.update({
            points: 99999
        });

        console.log(`✅ Successfully set points to 99999 for user: ${userId}`);
        console.log(`✅ User is now an admin and will bypass all point checks!`);
        console.log(`✅ Please refresh your browser to see the changes.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting admin points:', error);
        process.exit(1);
    }
}

// 从命令行参数获取user ID
const userId = process.argv[2];

if (!userId) {
    console.error('❌ Usage: node set_admin_points.js YOUR_USER_ID');
    console.error('💡 Hint: You can find your user ID in browser console: localStorage.getItem("uid")');
    process.exit(1);
}

setAdminPoints(userId);
