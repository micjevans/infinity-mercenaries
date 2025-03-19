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
import store from "../redux/store";
import { showNotification } from "../redux/notificationsSlice";

// Event CRUD operations
export const createEvent = async (eventData, creatorId) => {
  try {
    const eventRef = await addDoc(collection(db, "events"), {
      ...eventData,
      organizers: [creatorId], // Add the creator as an organizer
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(showNotification("Event created successfully!"));

    return eventRef.id;
  } catch (error) {
    console.error("Error creating event:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error creating event: ${error.message}`, "error")
    );

    throw error;
  }
};

export const getEvents = async () => {
  const eventsSnapshot = await getDocs(collection(db, "events"));
  return eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getEvent = async (eventId) => {
  try {
    // Fetch the basic event data
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) {
      return null;
    }

    const eventData = { id: eventDoc.id, ...eventDoc.data() };

    // Fetch rounds for the event
    const roundsSnapshot = await getDocs(
      collection(db, "events", eventId, "rounds")
    );
    const rounds = await Promise.all(
      roundsSnapshot.docs.map(async (roundDoc) => {
        const roundData = { id: roundDoc.id, ...roundDoc.data() };

        // Fetch pairings for each round
        const pairingsSnapshot = await getDocs(
          collection(db, "events", eventId, "rounds", roundDoc.id, "pairings")
        );

        const pairings = pairingsSnapshot.docs.map((pairingDoc) => ({
          id: pairingDoc.id,
          ...pairingDoc.data(),
        }));

        return { ...roundData, pairings };
      })
    );

    // Fetch detailed participant information if there are participants
    let detailedParticipants = [];
    if (eventData.participants && eventData.participants.length > 0) {
      // Get unique user IDs from participants
      const userIds = [...new Set(eventData.participants.map((p) => p.userId))];

      // Fetch user data for each participant
      const userDetails = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              return { id: userId, ...userDoc.data() };
            }
            return { id: userId, displayName: "Unknown User" };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return { id: userId, displayName: "Unknown User" };
          }
        })
      );

      // Fetch company data for each participant
      const companyData = await Promise.all(
        eventData.participants.map(async (participant) => {
          try {
            if (participant.companyId) {
              // Get company details from user's companies subcollection
              const companyDoc = await getDoc(
                doc(
                  db,
                  "users",
                  participant.userId,
                  "companies",
                  participant.companyId
                )
              );

              if (companyDoc.exists()) {
                return {
                  userId: participant.userId,
                  companyId: participant.companyId,
                  companyDetails: { id: companyDoc.id, ...companyDoc.data() },
                };
              }
            }
            return {
              userId: participant.userId,
              companyId: participant.companyId,
              companyDetails: null,
            };
          } catch (error) {
            console.error(
              `Error fetching company for user ${participant.userId}:`,
              error
            );
            return {
              userId: participant.userId,
              companyId: participant.companyId,
              companyDetails: null,
            };
          }
        })
      );

      // Merge participant data with user and company details
      detailedParticipants = eventData.participants.map((participant) => {
        const userDetail = userDetails.find((u) => u.id === participant.userId);
        const companyDetail = companyData.find(
          (c) =>
            c.userId === participant.userId &&
            c.companyId === participant.companyId
        );

        return {
          ...participant,
          userDetails: userDetail || { displayName: "Unknown User" },
          companyDetails: companyDetail?.companyDetails || {
            name: "Unknown Company",
          },
        };
      });
    }

    // Return the complete event data with rounds and detailed participants
    return {
      ...eventData,
      rounds,
      detailedParticipants,
    };
  } catch (error) {
    console.error("Error fetching event details:", error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    await updateDoc(doc(db, "events", eventId), {
      ...eventData,
      updatedAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(showNotification("Event updated successfully!"));
  } catch (error) {
    console.error("Error updating event:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error updating event: ${error.message}`, "error")
    );

    throw error;
  }
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

    // Show success notification
    store.dispatch(showNotification("Organizer added successfully!"));

    return { success: true };
  } catch (error) {
    console.error("Error adding event organizer:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error adding organizer: ${error.message}`, "error")
    );

    return { success: false, error };
  }
};

// Event signup
export const signupForEvent = async (eventId, userId, companyId) => {
  try {
    await updateDoc(doc(db, "events", eventId), {
      participants: arrayUnion({ userId, companyId }),
      updatedAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(
      showNotification(
        "Registration successful! You are now signed up for this event."
      )
    );
  } catch (error) {
    console.error("Error signing up for event:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error registering for event: ${error.message}`, "error")
    );

    throw error;
  }
};

// Round operations
export const createRound = async (eventId, roundData) => {
  try {
    const roundRef = await addDoc(collection(db, "events", eventId, "rounds"), {
      ...roundData,
      // Remove explicit complete flag as we're using dates now
      createdAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(showNotification("Round created successfully!"));

    return roundRef.id;
  } catch (error) {
    console.error("Error creating round:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error creating round: ${error.message}`, "error")
    );

    throw error;
  }
};

export const updateRoundDates = async (
  eventId,
  roundId,
  { startDate, endDate, mission, description }
) => {
  try {
    const updates = {};
    if (startDate) {
      updates.startDate = startDate;
    }
    if (endDate) {
      updates.endDate = endDate;
    }
    if (mission !== undefined) {
      updates.mission = mission;
    }
    if (description !== undefined) {
      updates.description = description;
    }

    await updateDoc(doc(db, "events", eventId, "rounds", roundId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(showNotification("Round details updated successfully!"));
  } catch (error) {
    console.error("Error updating round details:", error);

    // Show error notification
    store.dispatch(
      showNotification(
        `Error updating round details: ${error.message}`,
        "error"
      )
    );

    throw error;
  }
};

// Keep the original completeRound function for backward compatibility
// but update it to modify end date instead of the complete flag
export const completeRound = async (eventId, roundId, isComplete) => {
  try {
    if (isComplete) {
      // If marking complete, set end date to now
      await updateDoc(doc(db, "events", eventId, "rounds", roundId), {
        endDate: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
        },
        updatedAt: serverTimestamp(),
      });
    } else {
      // If marking incomplete, set end date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 0);

      await updateDoc(doc(db, "events", eventId, "rounds", roundId), {
        endDate: {
          seconds: Math.floor(tomorrow.getTime() / 1000),
          nanoseconds: 0,
        },
        updatedAt: serverTimestamp(),
      });
    }

    // Show success notification
    store.dispatch(
      showNotification(
        isComplete
          ? "Round marked as complete!"
          : "Round marked as in progress!"
      )
    );
  } catch (error) {
    console.error("Error updating round status:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error updating round status: ${error.message}`, "error")
    );

    throw error;
  }
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

// Pairing operations
export const createPairing = async (eventId, roundId, pairingData) => {
  try {
    const pairingRef = await addDoc(
      collection(db, "events", eventId, "rounds", roundId, "pairings"),
      {
        ...pairingData,
        complete: false,
        createdAt: serverTimestamp(),
      }
    );

    // Show success notification
    store.dispatch(showNotification("Pairing created successfully!"));

    return pairingRef.id;
  } catch (error) {
    console.error("Error creating pairing:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error creating pairing: ${error.message}`, "error")
    );

    throw error;
  }
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
  try {
    await updateDoc(
      doc(db, "events", eventId, "rounds", roundId, "pairings", pairingId),
      {
        complete: isComplete,
        updatedAt: serverTimestamp(),
      }
    );

    // Show success notification
    store.dispatch(
      showNotification(
        isComplete
          ? "Pairing marked as complete!"
          : "Pairing marked as in progress!"
      )
    );
  } catch (error) {
    console.error("Error updating pairing status:", error);

    // Show error notification
    store.dispatch(
      showNotification(
        `Error updating pairing status: ${error.message}`,
        "error"
      )
    );

    throw error;
  }
};

// Result operations
export const submitResult = async (eventId, roundId, pairingId, resultData) => {
  try {
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

    // Show success notification
    store.dispatch(showNotification("Result submitted successfully!"));

    return resultRef.id;
  } catch (error) {
    console.error("Error submitting result:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error submitting result: ${error.message}`, "error")
    );

    throw error;
  }
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
