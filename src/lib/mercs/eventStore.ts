import { loadLocalCompanies, type LocalCompany } from "./companyStore";

const STORAGE_KEY = "mercenaries.localEvents.v1";

export type EventParticipant = {
  id: string;
  userName: string;
  companyId: string;
  companyName: string;
  registeredAt: string;
};

export type EventPairing = {
  id: string;
  player1Id: string;
  player2Id: string;
  mission?: string;
  complete: boolean;
  results?: Record<string, PairingResult>;
  createdAt: string;
  updatedAt: string;
};

export type TrooperMissionResult = {
  trooper: string;
  aid?: boolean;
  aidCount?: number;
  state?: boolean;
  stateCount?: number;
  objective?: "" | "attempt" | "success";
  tag?: "" | "scan" | "fo-scan" | "tag";
  alive?: boolean;
  injury?: string;
  mvp?: boolean;
};

export type PairingDowntimeOutcome = "" | "failure" | "pass" | "critical-pass";

export type PairingDowntimeResult = {
  roll?: number | null;
  eventId: string;
  choiceId: string;
  participantTrooperId: string;
  beneficiaryTrooperId: string;
  opponentBeneficiaryTrooperId: string;
  spentCr: number;
  outcome: PairingDowntimeOutcome;
  notes: string;
};

export type PairingResult = {
  participantId: string;
  op: number;
  won: boolean;
  downtime: PairingDowntimeResult;
  troopers: TrooperMissionResult[];
  submitted: boolean;
  updatedAt: string;
};

export type EventRound = {
  id: string;
  name: string;
  number: number;
  startDate?: string;
  endDate?: string;
  mission?: string;
  description?: string;
  pairings: EventPairing[];
  createdAt: string;
  updatedAt: string;
};

export type LocalEvent = {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  participants: EventParticipant[];
  rounds: EventRound[];
  organizers: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewEventInput = {
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function sortEvents(events: LocalEvent[]): LocalEvent[] {
  return [...events].sort((a, b) => {
    const aTime = a.startDate
      ? new Date(a.startDate).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.startDate
      ? new Date(b.startDate).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

function touchEvent(event: LocalEvent): LocalEvent {
  return {
    ...event,
    updatedAt: nowIso(),
  };
}

export function loadLocalEvents(): LocalEvent[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortEvents(parsed) : [];
  } catch {
    return [];
  }
}

export function saveLocalEvents(events: LocalEvent[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortEvents(events)));
}

export function getLocalEvent(eventId: string): LocalEvent | null {
  return loadLocalEvents().find((event) => event.id === eventId) || null;
}

export function createLocalEvent(input: NewEventInput): LocalEvent {
  const timestamp = nowIso();

  return {
    id: makeId("event"),
    name: input.name.trim(),
    description: input.description?.trim() || "",
    location: input.location?.trim() || "",
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    maxParticipants: input.maxParticipants || undefined,
    participants: [],
    rounds: [],
    organizers: ["local-organizer"],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function upsertLocalEvent(event: LocalEvent): LocalEvent[] {
  const events = loadLocalEvents();
  const updatedEvent = touchEvent(event);
  const index = events.findIndex((existing) => existing.id === event.id);

  if (index >= 0) {
    events[index] = updatedEvent;
  } else {
    events.push(updatedEvent);
  }

  saveLocalEvents(events);
  return loadLocalEvents();
}

export function deleteLocalEvent(eventId: string): LocalEvent[] {
  const events = loadLocalEvents().filter((event) => event.id !== eventId);
  saveLocalEvents(events);
  return events;
}

export function addEventParticipant(
  eventId: string,
  input: { userName: string; company: LocalCompany },
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event) return null;

  const existingParticipant = event.participants.find(
    (participant) => participant.companyId === input.company.id,
  );
  if (existingParticipant) return event;

  const participant: EventParticipant = {
    id: makeId("participant"),
    userName: input.userName.trim() || "Local Player",
    companyId: input.company.id,
    companyName: input.company.name,
    registeredAt: nowIso(),
  };

  const updatedEvent = touchEvent({
    ...event,
    participants: [...event.participants, participant],
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}

export function removeEventParticipant(
  eventId: string,
  participantId: string,
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event) return null;

  const updatedEvent = touchEvent({
    ...event,
    participants: event.participants.filter(
      (participant) => participant.id !== participantId,
    ),
    rounds: event.rounds.map((round) => ({
      ...round,
      pairings: round.pairings.filter(
        (pairing) =>
          pairing.player1Id !== participantId &&
          pairing.player2Id !== participantId,
      ),
    })),
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}

export function createEventRound(
  eventId: string,
  input: {
    name?: string;
    startDate?: string;
    endDate?: string;
    mission?: string;
    description?: string;
  },
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event) return null;

  const timestamp = nowIso();
  const number = event.rounds.length + 1;
  const round: EventRound = {
    id: makeId("round"),
    name: input.name?.trim() || `Round ${number}`,
    number,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    mission: input.mission?.trim() || "",
    description: input.description?.trim() || "",
    pairings: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const updatedEvent = touchEvent({
    ...event,
    rounds: [...event.rounds, round],
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}

export function updateEventRound(
  eventId: string,
  roundId: string,
  input: Partial<
    Omit<EventRound, "id" | "number" | "pairings" | "createdAt" | "updatedAt">
  >,
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event) return null;

  const updatedEvent = touchEvent({
    ...event,
    rounds: event.rounds.map((round) =>
      round.id === roundId
        ? {
            ...round,
            ...input,
            updatedAt: nowIso(),
          }
        : round,
    ),
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}

export function createEventPairing(
  eventId: string,
  roundId: string,
  input: { player1Id: string; player2Id: string; mission?: string },
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event || input.player1Id === input.player2Id) return null;

  const timestamp = nowIso();
  const pairing: EventPairing = {
    id: makeId("pairing"),
    player1Id: input.player1Id,
    player2Id: input.player2Id,
    mission: input.mission?.trim() || "",
    complete: false,
    results: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const updatedEvent = touchEvent({
    ...event,
    rounds: event.rounds.map((round) =>
      round.id === roundId
        ? {
            ...round,
            pairings: [...round.pairings, pairing],
            updatedAt: timestamp,
          }
        : round,
    ),
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}

export function getAvailableEventCompanies(): LocalCompany[] {
  return loadLocalCompanies();
}

export function getEventRoundPairing(
  eventId: string,
  roundId: string,
  pairingId: string,
) {
  const event = getLocalEvent(eventId);
  const round = event?.rounds.find((entry) => entry.id === roundId) || null;
  const pairing =
    round?.pairings.find((entry) => entry.id === pairingId) || null;

  return { event, round, pairing };
}

export function upsertPairingResult(
  eventId: string,
  roundId: string,
  pairingId: string,
  result: PairingResult,
): LocalEvent | null {
  const event = getLocalEvent(eventId);
  if (!event) return null;

  const timestamp = nowIso();
  const updatedEvent = touchEvent({
    ...event,
    rounds: event.rounds.map((round) =>
      round.id === roundId
        ? {
            ...round,
            updatedAt: timestamp,
            pairings: round.pairings.map((pairing) => {
              if (pairing.id !== pairingId) return pairing;

              const results = {
                ...(pairing.results || {}),
                [result.participantId]: {
                  ...result,
                  updatedAt: timestamp,
                },
              };

              const bothSubmitted = [
                pairing.player1Id,
                pairing.player2Id,
              ].every((participantId) => results[participantId]?.submitted);

              return {
                ...pairing,
                results,
                complete: bothSubmitted,
                updatedAt: timestamp,
              };
            }),
          }
        : round,
    ),
  });

  upsertLocalEvent(updatedEvent);
  return updatedEvent;
}
