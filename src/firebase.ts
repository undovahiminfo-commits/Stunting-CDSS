/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1xa1Ko_iaUANFaHQTk4_5jE_MD7U1J1A",
  authDomain: "khaki-bay-77k72.firebaseapp.com",
  projectId: "khaki-bay-77k72",
  storageBucket: "khaki-bay-77k72.firebasestorage.app",
  messagingSenderId: "955490392745",
  appId: "1:955490392745:web:1d955e90ba0fcb31fb27b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the custom database specified in firebase-applet-config
export const db = getFirestore(app, "ai-studio-8bde6f0f-dea2-4e83-bfb3-dd9acfd4d63e");
