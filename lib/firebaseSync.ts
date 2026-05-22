'use client';

import { doc, setDoc, deleteDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, firebaseReady } from './firebase';

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
  console.warn('Firestore Warning (Silenced): ', JSON.stringify(errInfo));
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
  if (!firebaseReady) return;
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
  if (!firebaseReady) return;
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
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const sessionPath = `users/${user.uid}/focusSessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'focusSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, sessionPath);
  }
}

export async function deleteBrainDumpFromFirestore(sessionId: string, dumpId: string) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/brainDumps/${dumpId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'brainDumps', dumpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// New Sync Functions for Additional Data Types
// ----------------------------------------------------

export async function saveGoalToFirestore(goal: {
  id: string;
  title: string;
  category: 'short' | 'medium' | 'long';
  status: 'active' | 'completed';
  type?: 'outcome' | 'process';
  notes?: string;
  targetDate?: string;
  createdAt: number;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/goals/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
      ...goal,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGoalFromFirestore(goalId: string) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveReflectionToFirestore(reflection: {
  id: string;
  text: string;
  date: string;
  createdAt: number;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/reflections/${reflection.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'reflections', reflection.id), {
      ...reflection,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveWeekendWantToFirestore(want: {
  id: string;
  text: string;
  status: 'open' | 'done' | 'missed';
  createdAt: number;
  date?: string;
  time?: string;
  closedAt?: number;
  enjoy?: string;
  feel?: string;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/weekendWants/${want.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'weekendWants', want.id), {
      ...want,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWeekendWantFromFirestore(wantId: string) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/weekendWants/${wantId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'weekendWants', wantId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSavedItemToFirestore(item: {
  id: string;
  title: string;
  category: string;
  status: 'inbox' | 'current' | 'done';
  savedAt: string;
  url?: string;
  type?: string;
  tags?: string[];
  notes?: string;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/savedItems/${item.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'savedItems', item.id), {
      ...item,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSavedItemFromFirestore(itemId: string) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/savedItems/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'savedItems', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTodayGoalToFirestore(goal: {
  id: string;
  title: string;
  doneText: string;
  priority: 'Normal' | 'High' | 'Critical';
  minutes: number;
  completed: boolean;
  date: string;
  archived?: boolean;
  rolledFromDate?: string;
  rolledToDate?: string;
  createdAt: number;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/todayGoals/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'todayGoals', goal.id), {
      ...goal,
      userId: user.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// Core Initialization & Load Helper
// ----------------------------------------------------

export async function loadUserDataFromFirestore(uid: string) {
  if (!firebaseReady) return null;
  try {
    const [
      userProfileSnap,
      focusSessionsSnap,
      brainDumpsSnap,
      goalsSnap,
      reflectionsSnap,
      weekendWantsSnap,
      savedItemsSnap,
      todayGoalsSnap,
    ] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDocs(collection(db, 'users', uid, 'focusSessions')),
      getDocs(collection(db, 'users', uid, 'brainDumps')),
      getDocs(collection(db, 'users', uid, 'goals')),
      getDocs(collection(db, 'users', uid, 'reflections')),
      getDocs(collection(db, 'users', uid, 'weekendWants')),
      getDocs(collection(db, 'users', uid, 'savedItems')),
      getDocs(collection(db, 'users', uid, 'todayGoals')),
    ]);

    const profile = userProfileSnap.exists() ? userProfileSnap.data() : null;

    return {
      profile,
      focusSessions: focusSessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      brainDumps: brainDumpsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      goals: goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      reflections: reflectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      weekendWants: weekendWantsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      savedItems: savedItemsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      todayGoals: todayGoalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/*`);
    return null;
  }
}

export async function saveUserProfileToFirestore(profile: {
  userName: string;
  birthDate: string;
  setupComplete: boolean;
}) {
  if (!firebaseReady) return;
  const user = auth.currentUser;
  if (!user) return; // Silent fallback for Guest/Offline mode

  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      userName: profile.userName,
      birthDate: profile.birthDate,
      setupComplete: profile.setupComplete,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
