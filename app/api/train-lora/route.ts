import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user has available trainings
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData?.loraTrainingsAvailable || userData.loraTrainingsAvailable < 1) {
      return NextResponse.json({ error: 'No Lora trainings available. Please purchase a new training.' }, { status: 403 });
    }

    // Decrement available trainings
    await db.collection('users').doc(userId).update({
      loraTrainingsAvailable: userData.loraTrainingsAvailable - 1
    });

    // Your existing Lora training logic goes here
    // This should handle the file uploads, trigger word, and start the training process

    return NextResponse.json({ success: true, message: 'Lora training started successfully' });
  } catch (error) {
    console.error('Error in Lora training:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}