
import { adminDb } from './src/services/firebaseAdmin.js'; // Ensure correct path to your admin init

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(`
    Usage: npx tsx create_promo_code.ts <CODE> <POINTS> [MAX_USES]

    Example:
    npx tsx create_promo_code.ts WELCOME100 100 1000
    npx tsx create_promo_code.ts VIPUSER 500 1
    `);
    process.exit(1);
}

const code = args[0].toUpperCase();
const points = parseInt(args[1], 10);
const maxUses = args[2] ? parseInt(args[2], 10) : 10000;

async function createCode() {
    try {
        console.log(`Creating Code: ${code} for ${points} Points (Limit: ${maxUses})...`);

        await adminDb.collection('promotion_codes').doc(code).set({
            code: code,
            points: points,
            maxUses: maxUses,
            currentUses: 0,
            redeemedBy: [],
            active: true,
            createdAt: new Date().toISOString()
        });

        console.log(`✅ Success! Code '${code}' created.`);
        process.exit(0);
    } catch (e) {
        console.error('Error creating code:', e);
        process.exit(1);
    }
}

createCode();
