// Firebase project init — the one shared backend both players' browsers connect to for
// online play. The apiKey etc. below are NOT secret (Firebase web config is meant to be
// public in client code; actual access control is enforced by Firestore security rules,
// not by hiding this object) — see console.firebase.google.com project settings if these
// ever need to be regenerated. Same pattern as the Par Five project's firebase.js.
//
// TODO: replace with the real config once the Firebase project exists — see the
// "Deploying" section in the repo README for the exact steps (create project, enable
// Firestore, copy this object from Project Settings > General > Your apps > Web app,
// then paste `firestore.rules`'s contents into Firestore > Rules > Publish).
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.firebasestorage.app',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

const app = initializeApp(firebaseConfig);
// The engine's GameState has several optional fields (PlayerState.personality,
// .finishPlace) that come through as `undefined` rather than omitted for human
// players/mid-game — Firestore rejects `undefined` field values by default, so this
// tells it to silently drop them instead of throwing on every game-state write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
