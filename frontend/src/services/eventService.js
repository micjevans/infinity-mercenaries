import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";

// Event CRUD operations
export const createEvent = async (eventData, creatorId) => {
  const eventRef = await addDoc(collection(db, "events"), {
    ...eventData,
    organizers: [creatorId], // Add the creator as an organizer
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return eventRef.id;
};

export const getEvents = async () => {
  const eventsSnapshot = await getDocs(collection(db, "events"));
  return eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getEvent = async (eventId) => {
  const eventDoc = await getDoc(doc(db, "events", eventId));
  if (eventDoc.exists()) {
    return { id: eventDoc.id, ...eventDoc.data() };
  }
  return null;
};

export const updateEvent = async (eventId, eventData) => {
  await updateDoc(doc(db, "events", eventId), {
    ...eventData,
    updatedAt: serverTimestamp(),
  });
};

// Add a function to check if a user is an event organizer
export const isEventOrganizer = (event, userId) => {
  if (!event || !userId) return false;

  // Check if the organizers array exists and the user is in it
  return Array.isArray(event.organizers) && event.organizers.includes(userId);
};

// Add a function to add a new organizer to an event
export const addEventOrganizer = async (eventId, organizerId) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      organizers: arrayUnion(organizerId),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding event organizer:", error);
    return { success: false, error };
  }
};

// Event signup
export const signupForEvent = async (eventId, userId, companyId) => {
  await updateDoc(doc(db, "events", eventId), {
    participants: arrayUnion({ userId, companyId }),
    updatedAt: serverTimestamp(),
  });
};

// Round operations
export const createRound = async (eventId, roundData) => {
  const roundRef = await addDoc(collection(db, "events", eventId, "rounds"), {
    ...roundData,
    complete: false,
    createdAt: serverTimestamp(),
  });
  return roundRef.id;
};

export const getRounds = async (eventId) => {
  const roundsSnapshot = await getDocs(
    collection(db, "events", eventId, "rounds")
  );
  return roundsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const completeRound = async (eventId, roundId, isComplete) => {
  await updateDoc(doc(db, "events", eventId, "rounds", roundId), {
    complete: isComplete,
    updatedAt: serverTimestamp(),
  });
};

// Pairing operations
export const createPairing = async (eventId, roundId, pairingData) => {
  const pairingRef = await addDoc(
    collection(db, "events", eventId, "rounds", roundId, "pairings"),
    {
      ...pairingData,
      complete: false,
      createdAt: serverTimestamp(),
    }
  );
  return pairingRef.id;
};

export const getPairings = async (eventId, roundId) => {
  const pairingsSnapshot = await getDocs(
    collection(db, "events", eventId, "rounds", roundId, "pairings")
  );
  return pairingsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const completePairing = async (
  eventId,
  roundId,
  pairingId,
  isComplete
) => {
  await updateDoc(
    doc(db, "events", eventId, "rounds", roundId, "pairings", pairingId),
    {
      complete: isComplete,
      updatedAt: serverTimestamp(),
    }
  );
};

// Result operations
export const submitResult = async (eventId, roundId, pairingId, resultData) => {
  const resultRef = await addDoc(
    collection(
      db,
      "events",
      eventId,
      "rounds",
      roundId,
      "pairings",
      pairingId,
      "results"
    ),
    {
      ...resultData,
      createdAt: serverTimestamp(),
    }
  );
  return resultRef.id;
};

export const getResults = async (eventId, roundId, pairingId) => {
  const resultsSnapshot = await getDocs(
    collection(
      db,
      "events",
      eventId,
      "rounds",
      roundId,
      "pairings",
      pairingId,
      "results"
    )
  );
  return resultsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
