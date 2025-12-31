import admin from 'firebase-admin';

// ตรวจสอบว่ามี credentials หรือไม่
const hasCredentials =
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PROJECT_ID;

if (!admin.apps.length && hasCredentials) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Handle escaped newlines
            : undefined;

        if (!privateKey) {
            console.error('Firebase Admin: Private Key is missing or invalid.');
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                })
            });
            console.log('✅ Firebase Admin initialized successfully.');
        }
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
    }
} else if (!hasCredentials) {
    console.warn('⚠️ Firebase Admin: Missing credentials in environment variables.');
    // Debug: Log which variables are missing (safely)
    if (!process.env.FIREBASE_PROJECT_ID) console.warn(' - Missing: FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_CLIENT_EMAIL) console.warn(' - Missing: FIREBASE_CLIENT_EMAIL');
    if (!process.env.FIREBASE_PRIVATE_KEY) console.warn(' - Missing: FIREBASE_PRIVATE_KEY');
}

// Helper function สำหรับตรวจสอบว่า Firebase Admin พร้อมใช้งานหรือไม่
function isFirebaseAdminReady(): boolean {
    return admin.apps.length > 0;
}

export { isFirebaseAdminReady };
export default admin;
