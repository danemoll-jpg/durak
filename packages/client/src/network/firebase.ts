// Firebase project init — the one shared backend both players' browsers connect to for
// online play. The apiKey etc. below are NOT secret (Firebase web config is meant to be
// public in client code; actual access control is enforced by Firestore security rules,
// not by hiding this object) — see console.firebase.google.com project settings if these
// ever need to be regenerated. Same pattern as the Par Five project's firebase.js.
//
// Project: durak-60720. No Analytics SDK here on purpose — this app doesn't use it, and
// skipping it keeps the (already sizeable, see README) client bundle a bit smaller.
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyASSs8o0KVTn9f23AzG0JsPUdpU5bvyMhw',
  authDomain: 'durak-60720.firebaseapp.com',
  projectId: 'durak-60720',
  storageBucket: 'durak-60720.firebasestorage.app',
  messagingSenderId: '688002831991',
  appId: '1:688002831991:web:353c6eec763b0cce7f5872',
};

const app = initializeApp(firebaseConfig);
// The engine's GameState has several optional fields (PlayerState.personality,
// .finishPlace) that come through as `undefined` rather than omitted for human
// players/mid-game — Firestore rejects `undefined` field values by default, so this
// tells it to silently drop them instead of throwing on every game-state write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
