'use client';

import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveFocusSessionToFirestore(session: {
  id: string;
  title: string;
  durationMinutes: number;
  date: string;
  createdAt: number;
  outcome?: string;
  rating?: number;
}) {
  const user = auth.currentUser;
  if (!user) return; // Silent fallback for Guest/Offline mode

  const path = `users/${user.uid}/focusSessions/${session.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'focusSessions', session.id), {
      ...session,
      userId: user.uid,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveBrainDumpToFirestore(
  sessionId: string,
  dump: {
    id: string;
    text: string;
    createdAt: number;
  }
) {
  const user = auth.currentUser;
  if (!user) return; // Silent fallback

  const path = `users/${user.uid}/brainDumps/${dump.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'brainDumps', dump.id), {
      id: dump.id,
      text: dump.text,
      savedAt: new Date().toISOString(),
      createdAt: dump.createdAt,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFocusSessionFromFirestore(sessionId: string) {
  const user = auth.currentUser;
  if (!user) return;

  const sessionPath = `users/${user.uid}/focusSessions/${sessionId}`;
  try {
    // We only delete the focus session document itself.
    // Independent brain dumps should persist globally and not be cascaded.
    await deleteDoc(doc(db, 'users', user.uid, 'focusSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, sessionPath);
  }
}

export async function deleteBrainDumpFromFirestore(sessionId: string, dumpId: string) {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/brainDumps/${dumpId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'brainDumps', dumpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
