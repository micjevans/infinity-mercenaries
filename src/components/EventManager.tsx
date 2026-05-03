import { useEffect, useMemo, useState } from "react";
import {
  isSignedIn as getGoogleSignedIn,
  subscribeAuthState,
  listEventRegistrationFormResponses,
  listAppDataEventReferences,
  listAppDataCompanyReferences,
  readSharedFile,
  updateSharedFile,
  upsertAppDataEventReference,
  checkSharedFileAccess,
  removeAppDataEventReference,
  deleteSharedFile,
  type AppDataEventReference,
  type EventRegistrationForm,
} from "../lib/google-drive-adapter";
import {
  addEventParticipant,
  createEventPairing,
  createEventRound,
  deleteLocalEvent,
  getAvailableEventCompanies,
  getLocalEvent,
  loadLocalEvents,
  removeEventParticipant,
  upsertLocalEvent,
  type EventParticipant,
  type EventRound,
  type LocalEvent,
} from "../lib/mercs/eventStore";
import {
  loadLocalCompanies,
  type LocalCompany,
} from "../lib/mercs/companyStore";
import { AppIcon } from "./AppIcon";

type EventManagerProps = {
  mode: "list" | "detail";
};

type RoundFormState = {
  name: string;
  mission: string;
  startDate: string;
  endDate: string;
  description: string;
};

type RegisteredCompany = {
  fileId: string;
  shareLink: string;
  companyName: string;
  addedAt: string;
};

type SharedEventPairing = {
  id: string;
  player1FileId: string;
  player1Name: string;
  player2FileId: string;
  player2Name: string;
  mission?: string;
  createdAt: string;
};

type SharedEventRound = {
  id: string;
  name: string;
  number: number;
  startDate?: string;
  endDate?: string;
  mission?: string;
  description?: string;
  pairings: SharedEventPairing[];
  createdAt: string;
  updatedAt: string;
};

type SharedEventPayload = {
  kind: "infinity-mercenaries-event";
  updatedAt?: string;
  registrationForm?: EventRegistrationForm;
  registeredCompanies?: RegisteredCompany[];
  event?: {
    name?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    maxPlayers?: number;
  };
  rounds?: SharedEventRound[];
};

function emptyRoundForm(roundCount: number): RoundFormState {
  return {
    name: `Round ${roundCount + 1}`,
    mission: "",
    startDate: "",
    endDate: "",
    description: "",
  };
}

function formatDate(value?: string): string {
  if (!value) return "TBD";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: string): string {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function eventHref(eventId: string): string {
  return `/events/manage/?id=${encodeURIComponent(eventId)}`;
}

function driveEventHref(fileId: string): string {
  return `/events/manage/?fileId=${encodeURIComponent(fileId)}`;
}

function getEventIdFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("id") || "";
}

function getDriveEventFileIdFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("fileId") || "";
}

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractFileId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const idParam = url.searchParams.get("id");
    if (idParam) return idParam;
    const fileParam = url.searchParams.get("fileId");
    if (fileParam) return fileParam;

    const driveMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch?.[1]) return driveMatch[1];
  } catch {
    // Allow plain IDs.
  }

  return /^[a-zA-Z0-9_-]{10,}$/.test(trimmed) ? trimmed : null;
}

function sortRegisteredCompanies(
  companies: RegisteredCompany[],
): RegisteredCompany[] {
  return [...companies].sort((a, b) => {
    const aTime = new Date(a.addedAt || 0).getTime();
    const bTime = new Date(b.addedAt || 0).getTime();
    return bTime - aTime;
  });
}

function getRegisteredCompaniesFromEventData(
  payload: SharedEventPayload,
): RegisteredCompany[] {
  const raw = Array.isArray(payload.registeredCompanies)
    ? payload.registeredCompanies
    : [];

  const mapped = raw
    .map((entry) => {
      const normalizedId =
        extractFileId(String(entry.fileId || "")) ||
        extractFileId(String(entry.shareLink || "")) ||
        String(entry.fileId || "").trim();
      if (!normalizedId) return null;

      return {
        fileId: normalizedId,
        shareLink:
          String(entry.shareLink || "").trim() ||
          `${window.location.origin}/view?id=${encodeURIComponent(normalizedId)}`,
        companyName:
          String(entry.companyName || "Unnamed Company").trim() ||
          "Unnamed Company",
        addedAt: String(entry.addedAt || new Date().toISOString()),
      } as RegisteredCompany;
    })
    .filter((entry): entry is RegisteredCompany => Boolean(entry));

  return sortRegisteredCompanies(mapped);
}

function parseResponseEntryIdsFromPrefilledLink(value: string): {
  companyNameEntryId: string;
  companyLinkEntryId: string;
  eventFileIdEntryId: string;
} | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const mapping: Partial<{
      companyNameEntryId: string;
      companyLinkEntryId: string;
      eventFileIdEntryId: string;
    }> = {};

    url.searchParams.forEach((paramValue, key) => {
      if (!key.startsWith("entry.")) return;
      const entryId = key.slice("entry.".length);
      if (paramValue === "COMPANY_NAME") mapping.companyNameEntryId = entryId;
      if (paramValue === "COMPANY_LINK") mapping.companyLinkEntryId = entryId;
      if (paramValue === "EVENT_FILE_ID") mapping.eventFileIdEntryId = entryId;
    });

    if (
      mapping.companyNameEntryId &&
      mapping.companyLinkEntryId &&
      mapping.eventFileIdEntryId
    ) {
      return mapping as {
        companyNameEntryId: string;
        companyLinkEntryId: string;
        eventFileIdEntryId: string;
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getParticipantName(event: LocalEvent, participantId: string): string {
  const participant = event.participants.find(
    (entry) => entry.id === participantId,
  );
  return participant
    ? `${participant.companyName} (${participant.userName})`
    : "Unknown participant";
}

function getRoundStatus(round: EventRound): { label: string; tone: string } {
  const now = Date.now();
  const start = round.startDate ? new Date(round.startDate).getTime() : null;
  const end = round.endDate ? new Date(round.endDate).getTime() : null;

  if (end && now > end) return { label: "Complete", tone: "complete" };
  if (start && now < start) return { label: "Scheduled", tone: "scheduled" };
  if (start) return { label: "In Progress", tone: "active" };
  return { label: "Draft", tone: "draft" };
}

function EventListView() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [driveEvents, setDriveEvents] = useState<AppDataEventReference[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [brokenEventFileIds, setBrokenEventFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [deletingEventFileIds, setDeletingEventFileIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setEvents(loadLocalEvents());
  }, []);

  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setDriveEvents([]);
      return;
    }

    let alive = true;
    listAppDataEventReferences()
      .then((entries) => {
        if (!alive) return;
        setDriveEvents(entries);
      })
      .catch((error) => {
        console.error("Failed to load appdata event index:", error);
      });

    return () => {
      alive = false;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || driveEvents.length === 0) {
      setBrokenEventFileIds(new Set());
      return;
    }

    let alive = true;
    void (async () => {
      const broken = new Set<string>();
      for (const event of driveEvents) {
        const isAccessible = await checkSharedFileAccess(event.fileId);
        if (!isAccessible) {
          broken.add(event.fileId);
        }
      }
      if (alive) setBrokenEventFileIds(broken);
    })();

    return () => {
      alive = false;
    };
  }, [signedIn, driveEvents]);

  async function handleDeleteDriveEvent(fileId: string, eventName: string) {
    if (
      !window.confirm(
        `Delete "${eventName}" from Drive and remove from your account?`,
      )
    )
      return;

    setDeletingEventFileIds((current) => new Set([...current, fileId]));
    try {
      await deleteSharedFile(fileId);
      await removeAppDataEventReference(fileId);
      setDriveEvents((current) =>
        current.filter((event) => event.fileId !== fileId),
      );
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setDeletingEventFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    }
  }

  async function handleCleanupBrokenEventReference(
    fileId: string,
    eventName: string,
  ) {
    if (
      !window.confirm(
        `Remove broken reference to "${eventName}" from your account?`,
      )
    )
      return;

    setDeletingEventFileIds((current) => new Set([...current, fileId]));
    try {
      await removeAppDataEventReference(fileId);
      setDriveEvents((current) =>
        current.filter((event) => event.fileId !== fileId),
      );
      setBrokenEventFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    } catch (error) {
      console.error("Failed to remove reference:", error);
    } finally {
      setDeletingEventFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    }
  }

  const filteredEvents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return events;

    return events.filter((event) => {
      return [event.name, event.description, event.location].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [events, searchTerm]);

  const filteredDriveEvents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return driveEvents;

    return driveEvents.filter((event) => {
      return [event.name, event.description || "", event.location || ""].some(
        (value) => value.toLowerCase().includes(normalized),
      );
    });
  }, [driveEvents, searchTerm]);

  function handleDelete(eventId: string) {
    setEvents(deleteLocalEvent(eventId));
  }

  return (
    <section className="company-manager event-manager" aria-label="Events">
      <div className="company-manager__masthead">
        <p className="eyebrow">Organizer Tools</p>
        <h1>Events</h1>
        <p>
          Manage your event list, open an event workspace, and run rounds and
          pairings.
        </p>
      </div>

      <div className="event-list-toolbar">
        <button
          className="command-button command-button--primary"
          type="button"
          disabled={!signedIn}
          onClick={() => {
            window.location.href = "/events/create/";
          }}
        >
          Create Event
        </button>
      </div>

      {!signedIn && (
        <p className="legacy-empty-note">
          Sign in with Google to create events. Event creation needs Drive
          permissions to create and share event files.
        </p>
      )}

      <section className="company-section-card event-index-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Saved Events</span>
            <h2>Event List</h2>
          </div>
          <span className="company-count">{events.length}</span>
        </div>

        <label className="field">
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Find by name, location, or description"
          />
        </label>

        <div className="event-card-list">
          {filteredEvents.map((event) => (
            <article className="event-index-item" key={event.id}>
              <a href={eventHref(event.id)}>
                <span className="panel-kicker">
                  {event.location || "Location TBD"}
                </span>
                <h3>{event.name}</h3>
                <p>{event.description || "No description yet."}</p>
                <div className="event-mini-stats">
                  <span>{formatDate(event.startDate)}</span>
                  <span>{event.participants.length} players</span>
                  <span>{event.rounds.length} rounds</span>
                </div>
              </a>
              <button
                className="command-button command-button--danger"
                type="button"
                onClick={() => handleDelete(event.id)}
              >
                <AppIcon name="trash" size={16} />
                Delete
              </button>
            </article>
          ))}
          {filteredDriveEvents.map((event) => (
            <article className="event-index-item" key={`drive-${event.fileId}`}>
              {brokenEventFileIds.has(event.fileId) ? (
                <div>
                  <span className="panel-kicker">
                    Drive-backed (Broken Link)
                  </span>
                  <h3>{event.name}</h3>
                  <p>File not found. Event organizer may have deleted it.</p>
                  <div className="event-mini-stats">
                    <span>Broken link</span>
                  </div>
                </div>
              ) : (
                <a href={driveEventHref(event.fileId)}>
                  <span className="panel-kicker">
                    {event.location || "Shared event"}
                  </span>
                  <h3>{event.name}</h3>
                  <p>
                    {event.description ||
                      "Loaded from your Google Drive app data."}
                  </p>
                  <div className="event-mini-stats">
                    <span>{formatDate(event.startDate)}</span>
                    <span>Drive-backed</span>
                  </div>
                </a>
              )}
              {brokenEventFileIds.has(event.fileId) ? (
                <button
                  className="command-button command-button--danger"
                  type="button"
                  disabled={deletingEventFileIds.has(event.fileId)}
                  onClick={() =>
                    handleCleanupBrokenEventReference(event.fileId, event.name)
                  }
                >
                  <AppIcon name="trash" size={16} />
                  {deletingEventFileIds.has(event.fileId)
                    ? "Removing..."
                    : "Remove Reference"}
                </button>
              ) : (
                <>
                  <a
                    className="command-button"
                    href={driveEventHref(event.fileId)}
                  >
                    Open
                  </a>
                  <button
                    className="command-button command-button--danger"
                    type="button"
                    disabled={deletingEventFileIds.has(event.fileId)}
                    onClick={() =>
                      handleDeleteDriveEvent(event.fileId, event.name)
                    }
                  >
                    <AppIcon name="trash" size={16} />
                    {deletingEventFileIds.has(event.fileId)
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </>
              )}
            </article>
          ))}
          {filteredEvents.length === 0 && filteredDriveEvents.length === 0 && (
            <p className="empty-note">
              No events yet. Create one to get started.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}

function SharedEventWorkspace({
  fileId,
  eventData,
  onEventDataChange,
}: {
  fileId: string;
  eventData: SharedEventPayload;
  onEventDataChange: (next: SharedEventPayload) => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [registeredCompanies, setRegisteredCompanies] = useState<
    RegisteredCompany[]
  >([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [registrationRefreshNonce, setRegistrationRefreshNonce] = useState(0);
  const [roundForm, setRoundForm] = useState<RoundFormState>(
    emptyRoundForm(eventData.rounds?.length || 0),
  );
  const [pairingRoundId, setPairingRoundId] = useState("");
  const [player1FileId, setPlayer1FileId] = useState("");
  const [player2FileId, setPlayer2FileId] = useState("");
  const [pairingMission, setPairingMission] = useState("");
  const [savingRounds, setSavingRounds] = useState(false);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [prefilledLink, setPrefilledLink] = useState("");
  const [prefillConfigError, setPrefillConfigError] = useState<string | null>(
    null,
  );
  const [prefillConfigSuccess, setPrefillConfigSuccess] = useState<
    string | null
  >(null);
  const [savingPrefillConfig, setSavingPrefillConfig] = useState(false);
  const [ownedCompanyFileIds, setOwnedCompanyFileIds] = useState<Set<string>>(
    new Set(),
  );

  const rounds = Array.isArray(eventData.rounds) ? eventData.rounds : [];
  const formId = String(eventData.registrationForm?.formId || "").trim();
  const formResponderUri = String(
    eventData.registrationForm?.responderUri || "",
  ).trim();
  const eventWorkspaceLink = `${window.location.origin}/events/manage/?fileId=${encodeURIComponent(fileId)}`;
  const eventDriveLink = `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
  const formEditLink = formId
    ? `https://docs.google.com/forms/d/${encodeURIComponent(formId)}/edit`
    : "";
  const formResponsesLink = formId
    ? `https://docs.google.com/forms/d/${encodeURIComponent(formId)}/edit#responses`
    : "";

  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const owned = new Set<string>();

      for (const company of loadLocalCompanies()) {
        if (company.shareFileId) owned.add(company.shareFileId);
        if (company.shareLink) {
          const id = extractFileId(company.shareLink);
          if (id) owned.add(id);
        }
      }

      if (signedIn) {
        try {
          const refs = await listAppDataCompanyReferences();
          for (const ref of refs) {
            if (ref.fileId) owned.add(ref.fileId);
            const idFromLink = extractFileId(ref.shareLink || "");
            if (idFromLink) owned.add(idFromLink);
          }
        } catch (error) {
          console.warn(
            "Could not load appdata company ownership references:",
            error,
          );
        }
      }

      if (alive) setOwnedCompanyFileIds(owned);
    })();

    return () => {
      alive = false;
    };
  }, [signedIn, registeredCompanies.length, rounds.length]);

  useEffect(() => {
    setRoundForm(emptyRoundForm(rounds.length));
    if (rounds.length > 0) {
      setPairingRoundId((current) => current || rounds[0].id);
    }
  }, [rounds.length]);

  useEffect(() => {
    if (registeredCompanies.length > 0) {
      setPlayer1FileId((current) => current || registeredCompanies[0].fileId);
      setPlayer2FileId((current) => {
        if (current) return current;
        return registeredCompanies[1]?.fileId || registeredCompanies[0].fileId;
      });
    }
  }, [registeredCompanies.length]);

  useEffect(() => {
    const storedRegistrations = getRegisteredCompaniesFromEventData(eventData);
    setRegisteredCompanies(storedRegistrations);
    setRegistrationError(null);

    if (!signedIn) {
      return;
    }

    const form = eventData.registrationForm;
    if (!form) {
      setRegistrationError(null);
      return;
    }

    let alive = true;
    setLoadingRegistrations(true);
    setRegistrationError(null);

    listEventRegistrationFormResponses(form)
      .then((submissions) => {
        if (!alive) return;

        const filtered = submissions.filter((entry) => {
          const normalizedEventId =
            extractFileId(entry.eventFileId) || entry.eventFileId.trim();
          return normalizedEventId === fileId;
        });
        const deduped = new Map<string, RegisteredCompany>();
        for (const entry of filtered) {
          const parsedFileId = extractFileId(entry.companyShareLink);
          const key = parsedFileId || entry.companyShareLink;
          deduped.set(key, {
            fileId: key,
            shareLink: entry.companyShareLink,
            companyName: entry.companyName,
            addedAt: entry.submittedAt,
          });
        }

        for (const entry of storedRegistrations) {
          const key =
            entry.fileId || extractFileId(entry.shareLink) || entry.shareLink;
          if (!deduped.has(key)) deduped.set(key, entry);
        }

        const merged = sortRegisteredCompanies(Array.from(deduped.values()));
        setRegisteredCompanies(merged);

        const currentStored = JSON.stringify(
          sortRegisteredCompanies(storedRegistrations),
        );
        const nextStored = JSON.stringify(merged);
        if (currentStored !== nextStored) {
          void saveEvent({
            ...eventData,
            registeredCompanies: merged,
          }).catch((error) => {
            console.error(
              "Failed to persist merged registered companies to event file:",
              error,
            );
          });
        }
      })
      .catch((error) => {
        if (!alive) return;
        console.error("Failed to load registration form responses:", error);
        setRegistrationError(
          `Could not load registered companies from Google Form: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setRegisteredCompanies(storedRegistrations);
      })
      .finally(() => {
        if (alive) setLoadingRegistrations(false);
      });

    return () => {
      alive = false;
    };
  }, [
    signedIn,
    fileId,
    eventData,
    eventData.registrationForm,
    registrationRefreshNonce,
  ]);

  async function saveEvent(next: SharedEventPayload): Promise<void> {
    const payload = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    await updateSharedFile(fileId, payload);
    onEventDataChange(payload);

    const eventName = String(payload?.event?.name || "").trim();
    if (eventName) {
      await upsertAppDataEventReference({
        fileId,
        name: eventName,
        shareLink: `${window.location.origin}/events/manage/?fileId=${encodeURIComponent(fileId)}`,
        location: String(payload?.event?.location || "") || undefined,
        description: String(payload?.event?.description || "") || undefined,
        startDate: payload?.event?.startDate,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      });
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(eventWorkspaceLink);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setLinkCopied(false);
    }
  }

  async function handleSavePrefilledEntryIds() {
    const parsed = parseResponseEntryIdsFromPrefilledLink(prefilledLink);
    if (!parsed) {
      setPrefillConfigError(
        "Could not parse the prefilled link. Use placeholder values COMPANY_NAME, COMPANY_LINK, and EVENT_FILE_ID in the form before generating the link.",
      );
      setPrefillConfigSuccess(null);
      return;
    }

    try {
      setSavingPrefillConfig(true);
      setPrefillConfigError(null);
      setPrefillConfigSuccess(null);

      await saveEvent({
        ...eventData,
        registrationForm: {
          ...eventData.registrationForm,
          responseEntries: parsed,
        } as EventRegistrationForm,
      });

      setPrefilledLink("");
      setPrefillConfigSuccess("Saved responder entry IDs to this event file.");
    } catch (error) {
      console.error("Failed to save prefilled form mapping:", error);
      setPrefillConfigError(
        `Could not save responder entry IDs: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setPrefillConfigSuccess(null);
    } finally {
      setSavingPrefillConfig(false);
    }
  }

  async function handleCreateRound(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    if (!roundForm.name.trim()) return;

    try {
      setSavingRounds(true);
      setRoundError(null);
      const timestamp = new Date().toISOString();
      const nextRounds: SharedEventRound[] = [
        ...rounds,
        {
          id: makeId("drive-round"),
          name: roundForm.name.trim(),
          number: rounds.length + 1,
          mission: roundForm.mission.trim() || undefined,
          description: roundForm.description.trim() || undefined,
          startDate: roundForm.startDate
            ? new Date(roundForm.startDate).toISOString()
            : undefined,
          endDate: roundForm.endDate
            ? new Date(roundForm.endDate).toISOString()
            : undefined,
          pairings: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];

      await saveEvent({
        ...eventData,
        rounds: nextRounds,
      });
    } catch (error) {
      console.error("Failed to create round:", error);
      setRoundError(
        `Could not create round: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSavingRounds(false);
    }
  }

  async function handleCreatePairing(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    if (
      !pairingRoundId ||
      !player1FileId ||
      !player2FileId ||
      player1FileId === player2FileId
    )
      return;

    const player1 = registeredCompanies.find(
      (entry) => entry.fileId === player1FileId,
    );
    const player2 = registeredCompanies.find(
      (entry) => entry.fileId === player2FileId,
    );
    if (!player1 || !player2) return;

    try {
      setSavingRounds(true);
      setRoundError(null);
      const timestamp = new Date().toISOString();
      const nextRounds = rounds.map((round) => {
        if (round.id !== pairingRoundId) return round;
        const nextPairings = [
          ...(Array.isArray(round.pairings) ? round.pairings : []),
          {
            id: makeId("drive-pairing"),
            player1FileId,
            player1Name: player1.companyName,
            player2FileId,
            player2Name: player2.companyName,
            mission: pairingMission.trim() || undefined,
            createdAt: timestamp,
          },
        ];

        return {
          ...round,
          pairings: nextPairings,
          updatedAt: timestamp,
        };
      });

      await saveEvent({
        ...eventData,
        rounds: nextRounds,
      });
      setPairingMission("");
    } catch (error) {
      console.error("Failed to create pairing:", error);
      setRoundError(
        `Could not create pairing: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSavingRounds(false);
    }
  }

  return (
    <section
      className="company-manager event-manager"
      aria-label="Shared event manager"
    >
      <div className="event-detail-header">
        <a className="icon-button" href="/events/" aria-label="Back to events">
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Shared Event File</p>
          <h1>{eventData?.event?.name || "Unnamed Event"}</h1>
          <p>
            {eventData?.event?.description ||
              "Register companies, create rounds, and pair players for contract play."}
          </p>
        </div>
      </div>

      {!signedIn && (
        <p className="legacy-empty-note">
          Sign in with Google to register companies, create rounds, and save
          pairings for this event.
        </p>
      )}

      <div className="event-overview-grid">
        <div>
          <span className="panel-kicker">Location</span>
          <strong>{eventData?.event?.location || "TBD"}</strong>
        </div>
        <div>
          <span className="panel-kicker">Start</span>
          <strong>{formatDate(eventData?.event?.startDate)}</strong>
        </div>
        <div>
          <span className="panel-kicker">Registered Companies</span>
          <strong>{registeredCompanies.length}</strong>
        </div>
        <div>
          <span className="panel-kicker">Rounds</span>
          <strong>{rounds.length}</strong>
        </div>
      </div>

      <section className="company-section-card event-workspace-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Share</span>
            <h2>Event Share Link</h2>
          </div>
        </div>
        <p className="legacy-empty-note">
          Send this link to players so they can attach their company to this
          event.
        </p>
        <div className="event-register-grid">
          <label className="field">
            <span>Shareable Event Link</span>
            <input
              readOnly
              value={eventWorkspaceLink}
              onClick={(event) => (event.target as HTMLInputElement).select()}
            />
          </label>
          <button
            className="command-button command-button--primary"
            type="button"
            onClick={handleCopyShareLink}
          >
            {linkCopied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </section>

      <section className="company-section-card event-workspace-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Dev Tools</span>
            <h2>Integration Links (Temporary)</h2>
          </div>
        </div>
        <p className="legacy-empty-note">
          Quick links to inspect event and form wiring while we validate
          integration.
        </p>
        <div className="event-participant-list">
          <article className="event-participant-row">
            <div>
              <span className="panel-kicker">Event Workspace</span>
              <h3>Open this event route</h3>
            </div>
            <a
              className="command-button command-button--small"
              href={eventWorkspaceLink}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </article>
          <article className="event-participant-row">
            <div>
              <span className="panel-kicker">Drive Event File</span>
              <h3>Open event JSON in Drive</h3>
            </div>
            <a
              className="command-button command-button--small"
              href={eventDriveLink}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </article>
          <article className="event-participant-row">
            <div>
              <span className="panel-kicker">Registration Form</span>
              <h3>
                {formResponderUri
                  ? "Open responder form"
                  : "No responder link found"}
              </h3>
            </div>
            {formResponderUri ? (
              <a
                className="command-button command-button--small"
                href={formResponderUri}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            ) : (
              <span className="legacy-empty-note">Unavailable</span>
            )}
          </article>
          <article className="event-participant-row">
            <div>
              <span className="panel-kicker">Form Responses</span>
              <h3>
                {formResponsesLink ? "Open responses tab" : "No form ID found"}
              </h3>
            </div>
            {formResponsesLink ? (
              <a
                className="command-button command-button--small"
                href={formResponsesLink}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            ) : (
              <span className="legacy-empty-note">Unavailable</span>
            )}
          </article>
          <article className="event-participant-row">
            <div>
              <span className="panel-kicker">Form Editor</span>
              <h3>{formEditLink ? "Open form editor" : "No form ID found"}</h3>
            </div>
            {formEditLink ? (
              <a
                className="command-button command-button--small"
                href={formEditLink}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            ) : (
              <span className="legacy-empty-note">Unavailable</span>
            )}
          </article>
        </div>

        <div className="event-register-grid" style={{ marginTop: "1rem" }}>
          <label className="field">
            <span>Prefilled Link for Responder Entry IDs</span>
            <input
              value={prefilledLink}
              onChange={(event) => setPrefilledLink(event.target.value)}
              placeholder="Paste a prefilled form URL"
              disabled={savingPrefillConfig}
            />
          </label>
          <button
            className="command-button command-button--primary"
            type="button"
            onClick={handleSavePrefilledEntryIds}
            disabled={!prefilledLink.trim() || savingPrefillConfig}
          >
            {savingPrefillConfig ? "Saving..." : "Save Responder IDs"}
          </button>
        </div>
        <p className="legacy-empty-note">
          In the Google Form editor, create a prefilled link using these exact
          values: COMPANY_NAME, COMPANY_LINK, and EVENT_FILE_ID. Paste that URL
          here so the app can learn the real responder entry IDs.
        </p>
        {eventData.registrationForm?.responseEntries && (
          <p className="info-message">
            Responder entry IDs are configured for this event.
          </p>
        )}
        {prefillConfigError && (
          <p className="error-message">{prefillConfigError}</p>
        )}
        {prefillConfigSuccess && (
          <p className="info-message">{prefillConfigSuccess}</p>
        )}
      </section>

      <section className="company-section-card event-workspace-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Registration</span>
            <h2>Registered Companies</h2>
          </div>
          <span className="company-count">{registeredCompanies.length}</span>
        </div>

        <div className="event-list-toolbar">
          <button
            className="command-button"
            type="button"
            disabled={loadingRegistrations || !signedIn}
            onClick={() =>
              setRegistrationRefreshNonce((current) => current + 1)
            }
          >
            {loadingRegistrations ? "Refreshing..." : "Refresh Registrations"}
          </button>
        </div>

        <p className="legacy-empty-note">
          Registrations are read from this event file. Refresh also merges
          linked Google Form submissions when available.
        </p>
        {registrationError && (
          <p className="error-message">{registrationError}</p>
        )}

        <div className="event-participant-list">
          {registeredCompanies.map((company) => (
            <article className="event-participant-row" key={company.fileId}>
              <div>
                <span className="panel-kicker">Registered</span>
                <h3>{company.companyName}</h3>
              </div>
              <a
                className="command-button command-button--small"
                href={company.shareLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Company
              </a>
            </article>
          ))}
          {registeredCompanies.length === 0 && (
            <p className="empty-note">No companies registered yet.</p>
          )}
        </div>
      </section>

      <section className="company-section-card event-workspace-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Round Control</span>
            <h2>Rounds and Pairings</h2>
          </div>
          <span className="company-count">{rounds.length}</span>
        </div>

        <div className="event-tools-grid">
          <form className="event-tool-panel" onSubmit={handleCreateRound}>
            <span className="panel-kicker">Create Round</span>
            <label className="field">
              <span>Name</span>
              <input
                value={roundForm.name}
                onChange={(event) =>
                  setRoundForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Default Contract</span>
              <input
                value={roundForm.mission}
                onChange={(event) =>
                  setRoundForm((current) => ({
                    ...current,
                    mission: event.target.value,
                  }))
                }
                placeholder="Control Room, The Mole..."
              />
            </label>
            <div className="event-form-grid">
              <label className="field">
                <span>Start</span>
                <input
                  type="datetime-local"
                  value={roundForm.startDate}
                  onChange={(event) =>
                    setRoundForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>End</span>
                <input
                  type="datetime-local"
                  value={roundForm.endDate}
                  onChange={(event) =>
                    setRoundForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <textarea
                value={roundForm.description}
                onChange={(event) =>
                  setRoundForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Organizer notes for this round"
              />
            </label>
            <button
              className="command-button command-button--primary"
              type="submit"
              disabled={!signedIn || savingRounds}
            >
              Create Round
            </button>
          </form>

          <form className="event-tool-panel" onSubmit={handleCreatePairing}>
            <span className="panel-kicker">Create Pairing</span>
            <label className="field">
              <span>Round</span>
              <select
                value={pairingRoundId}
                onChange={(event) => setPairingRoundId(event.target.value)}
                disabled={rounds.length === 0 || !signedIn}
              >
                {rounds.map((round) => (
                  <option value={round.id} key={round.id}>
                    {round.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="event-form-grid">
              <label className="field">
                <span>Player A</span>
                <select
                  value={player1FileId}
                  onChange={(event) => setPlayer1FileId(event.target.value)}
                  disabled={registeredCompanies.length < 2 || !signedIn}
                >
                  {registeredCompanies.map((company) => (
                    <option value={company.fileId} key={company.fileId}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Player B</span>
                <select
                  value={player2FileId}
                  onChange={(event) => setPlayer2FileId(event.target.value)}
                  disabled={registeredCompanies.length < 2 || !signedIn}
                >
                  {registeredCompanies.map((company) => (
                    <option value={company.fileId} key={company.fileId}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Contract</span>
              <input
                value={pairingMission}
                onChange={(event) => setPairingMission(event.target.value)}
                placeholder="Optional contract override"
              />
            </label>
            <button
              className="command-button command-button--primary"
              type="submit"
              disabled={
                !signedIn ||
                !pairingRoundId ||
                !player1FileId ||
                !player2FileId ||
                player1FileId === player2FileId ||
                savingRounds
              }
            >
              Create Pairing
            </button>
          </form>
        </div>
        {roundError && <p className="error-message">{roundError}</p>}

        <div className="event-round-list">
          {rounds.map((round) => {
            const status = getRoundStatus({
              ...round,
              pairings: Array.isArray(round.pairings) ? round.pairings : [],
            } as EventRound);

            return (
              <article className="event-round-card" key={round.id}>
                <header>
                  <div>
                    <span className="panel-kicker">Round {round.number}</span>
                    <h3>{round.name}</h3>
                    <p>
                      {round.description ||
                        round.mission ||
                        "No round notes yet."}
                    </p>
                  </div>
                  <span className={`event-status event-status--${status.tone}`}>
                    {status.label}
                  </span>
                </header>
                <div className="event-mini-stats">
                  <span>Starts {formatDateTime(round.startDate)}</span>
                  <span>Ends {formatDateTime(round.endDate)}</span>
                  <span>
                    {Array.isArray(round.pairings) ? round.pairings.length : 0}{" "}
                    pairings
                  </span>
                </div>

                <div className="event-pairing-list">
                  {(Array.isArray(round.pairings) ? round.pairings : []).map(
                    (pairing) => (
                      <article className="event-pairing-row" key={pairing.id}>
                        <div>
                          <strong>{pairing.player1Name}</strong>
                          <span>vs</span>
                          <strong>{pairing.player2Name}</strong>
                        </div>
                        <small>
                          {pairing.mission || round.mission || "Contract TBD"}
                        </small>
                        {ownedCompanyFileIds.has(pairing.player1FileId) ||
                        ownedCompanyFileIds.has(pairing.player2FileId) ? (
                          <a
                            className="command-button command-button--small"
                            href={`/events/pairing/?fileId=${encodeURIComponent(fileId)}&roundId=${encodeURIComponent(round.id)}&pairingId=${encodeURIComponent(pairing.id)}`}
                          >
                            Play
                          </a>
                        ) : (
                          <button
                            className="command-button command-button--small"
                            type="button"
                            disabled
                          >
                            Locked
                          </button>
                        )}
                      </article>
                    ),
                  )}
                  {(Array.isArray(round.pairings) ? round.pairings : [])
                    .length === 0 && (
                    <p className="empty-note">
                      No pairings for this round yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
          {rounds.length === 0 && (
            <p className="empty-note">No rounds created yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function ParticipantPanel({
  event,
  onEventChange,
}: {
  event: LocalEvent;
  onEventChange: (event: LocalEvent) => void;
}) {
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const loadedCompanies = getAvailableEventCompanies();
    setCompanies(loadedCompanies);
    setSelectedCompanyId(loadedCompanies[0]?.id || "");
  }, []);

  const availableCompanies = companies.filter(
    (company) =>
      !event.participants.some(
        (participant) => participant.companyId === company.id,
      ),
  );
  const isAtCapacity = Boolean(
    event.maxParticipants && event.participants.length >= event.maxParticipants,
  );

  function handleAddParticipant() {
    const company = companies.find((entry) => entry.id === selectedCompanyId);
    if (!company) return;
    const updatedEvent = addEventParticipant(event.id, {
      userName: playerName || company.name,
      company,
    });
    if (updatedEvent) {
      onEventChange(updatedEvent);
      setPlayerName("");
      const nextAvailable = availableCompanies.find(
        (entry) => entry.id !== company.id,
      );
      setSelectedCompanyId(nextAvailable?.id || "");
    }
  }

  function handleRemove(participant: EventParticipant) {
    const updatedEvent = removeEventParticipant(event.id, participant.id);
    if (updatedEvent) onEventChange(updatedEvent);
  }

  return (
    <section className="company-section-card event-workspace-card">
      <div className="section-heading-row">
        <div>
          <span className="panel-kicker">Registration</span>
          <h2>Participants</h2>
        </div>
        <span className="company-count">{event.participants.length}</span>
      </div>

      <div className="event-register-grid">
        <label className="field">
          <span>Player Name</span>
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Optional display name"
          />
        </label>
        <label className="field">
          <span>Company</span>
          <select
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
            disabled={availableCompanies.length === 0 || isAtCapacity}
          >
            {availableCompanies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="command-button command-button--primary"
          type="button"
          onClick={handleAddParticipant}
          disabled={
            !selectedCompanyId ||
            availableCompanies.length === 0 ||
            isAtCapacity
          }
        >
          Add Participant
        </button>
      </div>

      {isAtCapacity && (
        <p className="legacy-empty-note">
          This event is at its participant cap.
        </p>
      )}
      {companies.length === 0 && (
        <p className="legacy-empty-note">
          Create a company before registering players.
        </p>
      )}

      <div className="event-participant-list">
        {event.participants.map((participant) => (
          <article className="event-participant-row" key={participant.id}>
            <div>
              <span className="panel-kicker">{participant.userName}</span>
              <h3>{participant.companyName}</h3>
            </div>
            <a
              className="command-button command-button--small"
              href={`/companies/manage/?id=${encodeURIComponent(participant.companyId)}`}
            >
              Open Company
            </a>
            <button
              className="command-button command-button--danger command-button--small"
              type="button"
              onClick={() => handleRemove(participant)}
            >
              <AppIcon name="trash" size={15} />
              Remove
            </button>
          </article>
        ))}
        {event.participants.length === 0 && (
          <p className="empty-note">No participants registered yet.</p>
        )}
      </div>
    </section>
  );
}

function RoundsPanel({
  event,
  onEventChange,
}: {
  event: LocalEvent;
  onEventChange: (event: LocalEvent) => void;
}) {
  const [roundForm, setRoundForm] = useState<RoundFormState>(
    emptyRoundForm(event.rounds.length),
  );
  const [pairingRoundId, setPairingRoundId] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [pairingMission, setPairingMission] = useState("");
  const [ownedCompanyIds, setOwnedCompanyIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!pairingRoundId && event.rounds[0])
      setPairingRoundId(event.rounds[0].id);
    if (!player1Id && event.participants[0])
      setPlayer1Id(event.participants[0].id);
    if (!player2Id && event.participants[1])
      setPlayer2Id(event.participants[1].id);
  }, [event, pairingRoundId, player1Id, player2Id]);

  useEffect(() => {
    const owned = new Set(loadLocalCompanies().map((company) => company.id));
    setOwnedCompanyIds(owned);
  }, [event.participants.length, event.rounds.length]);

  function updateRoundField(field: keyof RoundFormState, value: string) {
    setRoundForm((current) => ({ ...current, [field]: value }));
  }

  function handleCreateRound(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    const updatedEvent = createEventRound(event.id, {
      name: roundForm.name,
      mission: roundForm.mission,
      startDate: roundForm.startDate
        ? new Date(roundForm.startDate).toISOString()
        : undefined,
      endDate: roundForm.endDate
        ? new Date(roundForm.endDate).toISOString()
        : undefined,
      description: roundForm.description,
    });

    if (updatedEvent) {
      onEventChange(updatedEvent);
      setRoundForm(emptyRoundForm(updatedEvent.rounds.length));
      setPairingRoundId(updatedEvent.rounds.at(-1)?.id || "");
    }
  }

  function handleCreatePairing(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    const updatedEvent = createEventPairing(event.id, pairingRoundId, {
      player1Id,
      player2Id,
      mission: pairingMission,
    });

    if (updatedEvent) {
      onEventChange(updatedEvent);
      setPairingMission("");
    }
  }

  return (
    <section className="company-section-card event-workspace-card">
      <div className="section-heading-row">
        <div>
          <span className="panel-kicker">Round Control</span>
          <h2>Rounds and Pairings</h2>
        </div>
        <span className="company-count">{event.rounds.length}</span>
      </div>

      <div className="event-tools-grid">
        <form className="event-tool-panel" onSubmit={handleCreateRound}>
          <span className="panel-kicker">Create Round</span>
          <label className="field">
            <span>Name</span>
            <input
              value={roundForm.name}
              onChange={(event) => updateRoundField("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Default Contract</span>
            <input
              value={roundForm.mission}
              onChange={(event) =>
                updateRoundField("mission", event.target.value)
              }
              placeholder="Control Room, The Mole..."
            />
          </label>
          <div className="event-form-grid">
            <label className="field">
              <span>Start</span>
              <input
                type="datetime-local"
                value={roundForm.startDate}
                onChange={(event) =>
                  updateRoundField("startDate", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>End</span>
              <input
                type="datetime-local"
                value={roundForm.endDate}
                onChange={(event) =>
                  updateRoundField("endDate", event.target.value)
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              value={roundForm.description}
              onChange={(event) =>
                updateRoundField("description", event.target.value)
              }
              placeholder="Organizer notes for this round"
            />
          </label>
          <button
            className="command-button command-button--primary"
            type="submit"
          >
            Create Round
          </button>
        </form>

        <form className="event-tool-panel" onSubmit={handleCreatePairing}>
          <span className="panel-kicker">Create Pairing</span>
          <label className="field">
            <span>Round</span>
            <select
              value={pairingRoundId}
              onChange={(event) => setPairingRoundId(event.target.value)}
              disabled={event.rounds.length === 0}
            >
              {event.rounds.map((round) => (
                <option value={round.id} key={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </label>
          <div className="event-form-grid">
            <label className="field">
              <span>Player A</span>
              <select
                value={player1Id}
                onChange={(event) => setPlayer1Id(event.target.value)}
                disabled={event.participants.length < 2}
              >
                {event.participants.map((participant) => (
                  <option value={participant.id} key={participant.id}>
                    {participant.companyName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Player B</span>
              <select
                value={player2Id}
                onChange={(event) => setPlayer2Id(event.target.value)}
                disabled={event.participants.length < 2}
              >
                {event.participants.map((participant) => (
                  <option value={participant.id} key={participant.id}>
                    {participant.companyName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Contract</span>
            <input
              value={pairingMission}
              onChange={(event) => setPairingMission(event.target.value)}
              placeholder="Optional contract override"
            />
          </label>
          <button
            className="command-button command-button--primary"
            type="submit"
            disabled={
              !pairingRoundId ||
              !player1Id ||
              !player2Id ||
              player1Id === player2Id
            }
          >
            Create Pairing
          </button>
        </form>
      </div>

      <div className="event-round-list">
        {event.rounds.map((round) => {
          const status = getRoundStatus(round);

          return (
            <article className="event-round-card" key={round.id}>
              <header>
                <div>
                  <span className="panel-kicker">Round {round.number}</span>
                  <h3>{round.name}</h3>
                  <p>
                    {round.description ||
                      round.mission ||
                      "No round notes yet."}
                  </p>
                </div>
                <span className={`event-status event-status--${status.tone}`}>
                  {status.label}
                </span>
              </header>
              <div className="event-mini-stats">
                <span>Starts {formatDateTime(round.startDate)}</span>
                <span>Ends {formatDateTime(round.endDate)}</span>
                <span>{round.pairings.length} pairings</span>
              </div>

              <div className="event-pairing-list">
                {round.pairings.map((pairing) => (
                  <article className="event-pairing-row" key={pairing.id}>
                    <div>
                      <strong>
                        {getParticipantName(event, pairing.player1Id)}
                      </strong>
                      <span>vs</span>
                      <strong>
                        {getParticipantName(event, pairing.player2Id)}
                      </strong>
                    </div>
                    <small>
                      {pairing.mission || round.mission || "Contract TBD"}
                    </small>
                    {(() => {
                      const participant1 = event.participants.find(
                        (entry) => entry.id === pairing.player1Id,
                      );
                      const participant2 = event.participants.find(
                        (entry) => entry.id === pairing.player2Id,
                      );
                      const canOpen = Boolean(
                        (participant1?.companyId &&
                          ownedCompanyIds.has(participant1.companyId)) ||
                        (participant2?.companyId &&
                          ownedCompanyIds.has(participant2.companyId)),
                      );

                      return canOpen ? (
                        <a
                          className="command-button command-button--small"
                          href={`/events/pairing/?eventId=${event.id}&roundId=${round.id}&pairingId=${pairing.id}`}
                        >
                          Play
                        </a>
                      ) : (
                        <button
                          className="command-button command-button--small"
                          type="button"
                          disabled
                        >
                          Locked
                        </button>
                      );
                    })()}
                  </article>
                ))}
                {round.pairings.length === 0 && (
                  <p className="empty-note">No pairings for this round yet.</p>
                )}
              </div>
            </article>
          );
        })}
        {event.rounds.length === 0 && (
          <p className="empty-note">No rounds created yet.</p>
        )}
      </div>
    </section>
  );
}

function EventDetailView() {
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [sharedEvent, setSharedEvent] = useState<SharedEventPayload | null>(
    null,
  );
  const [loadingShared, setLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [sharedFileId, setSharedFileId] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const localEventId = getEventIdFromLocation();
    const driveFileId = getDriveEventFileIdFromLocation();
    setEvent(localEventId ? getLocalEvent(localEventId) : null);
    setSharedFileId(driveFileId);
  }, []);

  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    if (!sharedFileId || !signedIn) return;

    let alive = true;
    setLoadingShared(true);
    setSharedError(null);
    readSharedFile(sharedFileId)
      .then((payload) => {
        if (!alive) return;
        if (payload?.kind !== "infinity-mercenaries-event") {
          throw new Error("This file is not an event file.");
        }
        setSharedEvent(payload as SharedEventPayload);
      })
      .catch((error) => {
        if (!alive) return;
        console.error("Failed to load shared event:", error);
        setSharedError(
          error instanceof Error ? error.message : "Unknown error",
        );
      })
      .finally(() => {
        if (alive) setLoadingShared(false);
      });

    return () => {
      alive = false;
    };
  }, [sharedFileId, signedIn]);

  if (sharedFileId && !signedIn) {
    return (
      <section
        className="company-manager event-manager"
        aria-label="Sign in required"
      >
        <div className="company-empty-state">
          <span className="panel-kicker">Google Sign-In Required</span>
          <h1>Sign In to Open Event</h1>
          <p>Use the Google button in the nav bar, then reopen this event.</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  if (sharedFileId && loadingShared) {
    return (
      <section
        className="company-manager event-manager"
        aria-label="Loading event"
      >
        <div className="company-empty-state">
          <span className="panel-kicker">Shared Event</span>
          <h1>Loading Event File</h1>
          <p>Fetching the latest event data from Google Drive...</p>
        </div>
      </section>
    );
  }

  if (sharedFileId && sharedError) {
    return (
      <section
        className="company-manager event-manager"
        aria-label="Event load error"
      >
        <div className="company-empty-state">
          <span className="panel-kicker">Shared Event</span>
          <h1>Could Not Load Event</h1>
          <p>{sharedError}</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  if (sharedFileId && sharedEvent) {
    return (
      <SharedEventWorkspace
        fileId={sharedFileId}
        eventData={sharedEvent}
        onEventDataChange={setSharedEvent}
      />
    );
  }

  if (!event) {
    return (
      <section
        className="company-manager event-manager"
        aria-label="Event not found"
      >
        <div className="company-empty-state">
          <span className="panel-kicker">Missing Event</span>
          <h1>Event Not Found</h1>
          <p>This local event file could not be found.</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  function handleEventChange(updatedEvent: LocalEvent) {
    setEvent(updatedEvent);
  }

  return (
    <section
      className="company-manager event-manager"
      aria-label="Event manager"
    >
      <div className="event-detail-header">
        <a className="icon-button" href="/events/" aria-label="Back to events">
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Event File</p>
          <h1>{event.name}</h1>
          <p>
            {event.description ||
              "Register companies, create rounds, and build pairings for contract play."}
          </p>
        </div>
      </div>

      <div className="event-overview-grid">
        <div>
          <span className="panel-kicker">Location</span>
          <strong>{event.location || "TBD"}</strong>
        </div>
        <div>
          <span className="panel-kicker">Start</span>
          <strong>{formatDate(event.startDate)}</strong>
        </div>
        <div>
          <span className="panel-kicker">Players</span>
          <strong>
            {event.participants.length}
            {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
          </strong>
        </div>
        <div>
          <span className="panel-kicker">Rounds</span>
          <strong>{event.rounds.length}</strong>
        </div>
      </div>

      <ParticipantPanel event={event} onEventChange={handleEventChange} />
      <RoundsPanel event={event} onEventChange={handleEventChange} />
    </section>
  );
}

export default function EventManager({ mode }: EventManagerProps) {
  return mode === "detail" ? <EventDetailView /> : <EventListView />;
}
