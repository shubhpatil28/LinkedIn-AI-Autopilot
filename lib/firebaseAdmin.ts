import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      let parsedKey = serviceAccountKey.trim();

      // Strip quotes if wrapped in single or double quotes in Vercel UI
      if (
        (parsedKey.startsWith("'") && parsedKey.endsWith("'")) ||
        (parsedKey.startsWith('"') && parsedKey.endsWith('"'))
      ) {
        parsedKey = parsedKey.slice(1, -1).trim();
      }

      // Base64 decode if string doesn't start with '{'
      if (!parsedKey.startsWith('{')) {
        parsedKey = Buffer.from(parsedKey, 'base64').toString('utf8').trim();
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(parsedKey);
      } catch {
        serviceAccount = JSON.parse(parsedKey.replace(/\\"/g, '"'));
      }
      if (typeof serviceAccount === 'string') {
        serviceAccount = JSON.parse(serviceAccount);
      }

      // Ensure private_key has real newline characters (crucial for Vercel env vars where \n becomes \\n)
      if (serviceAccount && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      const projectId =
        serviceAccount.project_id ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        'linkedin-ai-autopilot';

      if (serviceAccount && serviceAccount.client_email && serviceAccount.private_key) {
        return initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing client_email or private_key fields.');
      }
    } catch (err: any) {
      console.error('Failed to parse or initialize FIREBASE_SERVICE_ACCOUNT_KEY:', err?.message || err);
    }
  }

  // Fallback project ID initialization if no valid service account credential is found
  const fallbackProjectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'linkedin-ai-autopilot';
  console.warn(`Initializing Firebase Admin with project ID fallback (${fallbackProjectId}).`);
  return initializeApp({
    projectId: fallbackProjectId,
  });
}

const adminApp = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
