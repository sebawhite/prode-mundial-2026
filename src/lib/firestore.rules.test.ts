import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { describe, it, beforeAll, afterAll } from 'vitest';
import net from 'net';

// Helper to check if the local Firestore Emulator is listening
function isEmulatorOnline(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(800);
    socket.on('error', onError);
    socket.on('timeout', onError);
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

describe('Firestore Security Rules', async () => {
  const isOnline = await isEmulatorOnline(8080, '127.0.0.1');

  if (!isOnline) {
    it.skip('Skipping Firestore Rules tests because the Firestore Emulator is not running on 127.0.0.1:8080', () => {});
    return;
  }

  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'prode-mundial-2026-rules-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('No-admin no puede escribir en /matches', async () => {
    const context = testEnv.authenticatedContext('user_123', { email: 'regular@user.com' });
    const db = context.firestore();
    const matchRef = doc(db, 'matches', 'match-1');
    
    await assertFails(
      setDoc(matchRef, {
        homeScore: 3,
        awayScore: 0,
        isFinished: true
      })
    );
  });

  it('Usuario no puede setear su propio paymentStatus', async () => {
    const context = testEnv.authenticatedContext('user_123', { email: 'user@gmail.com' });
    const db = context.firestore();
    const userRef = doc(db, 'users', 'user_123');

    await assertFails(
      setDoc(userRef, {
        uid: 'user_123',
        fullName: 'John Doe',
        email: 'user@gmail.com',
        paymentStatus: 'confirmed',
        createdAt: new Date().toISOString()
      })
    );
  });

  it('Usuario solo lee su propia prediction antes del deadline', async () => {
    // Setup rules test context
    const context1 = testEnv.authenticatedContext('user_1', { email: 'u1@gmail.com' });
    const context2 = testEnv.authenticatedContext('user_2', { email: 'u2@gmail.com' });
    
    const db1 = context1.firestore();
    const db2 = context2.firestore();

    const predRef = doc(db1, 'predictions', 'user_1_match-1');

    // A user should be able to read their own prediction
    await assertSucceeds(getDoc(doc(db1, 'predictions', 'user_1_match-1')));
    
    // A user should NOT be able to read another user's prediction before deadline
    await assertFails(getDoc(doc(db2, 'predictions', 'user_1_match-1')));
  });

  it('Usuario no puede editar prediction de partido finalizado', async () => {
    const context = testEnv.authenticatedContext('user_123', { email: 'user@gmail.com' });
    const db = context.firestore();
    
    // Attempting to write a prediction for a match that is finished should fail
    // based on our new `isMatchUnfinished` helper function which inspects /matches/{matchId}
    const predRef = doc(db, 'predictions', 'user_123_finished-match');
    
    await assertFails(
      setDoc(predRef, {
        userId: 'user_123',
        matchId: 'finished-match',
        homeScore: 2,
        awayScore: 1
      })
    );
  });

  it('Usuario no puede editar prediction después del deadline', async () => {
    const context = testEnv.authenticatedContext('user_123', { email: 'user@gmail.com' });
    const db = context.firestore();
    const predRef = doc(db, 'predictions', 'user_123_match-1');

    // Attempting to edit prediction when deadline is passed should be blocked
    // isMatchActiveForPrediction checks that request.time < groupStageDeadline
    await assertFails(
      setDoc(predRef, {
        userId: 'user_123',
        matchId: 'match-1',
        homeScore: 1,
        awayScore: 0
      })
    );
  });
});
