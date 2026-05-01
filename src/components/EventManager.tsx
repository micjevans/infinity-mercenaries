import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  addEventParticipant,
  createEventPairing,
  createEventRound,
  createLocalEvent,
  deleteLocalEvent,
  getAvailableEventCompanies,
  getLocalEvent,
  loadLocalEvents,
  removeEventParticipant,
  upsertLocalEvent,
  type EventParticipant,
  type EventRound,
  type LocalEvent
} from "../lib/mercs/eventStore";
import type { LocalCompany } from "../lib/mercs/companyStore";
import { AppIcon } from "./AppIcon";

type EventManagerProps = {
  mode: "list" | "detail";
};

type EventFormState = {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: string;
};

type RoundFormState = {
  name: string;
  mission: string;
  startDate: string;
  endDate: string;
  description: string;
};

function emptyEventForm(): EventFormState {
  return {
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxParticipants: ""
  };
}

function emptyRoundForm(roundCount: number): RoundFormState {
  return {
    name: `Round ${roundCount + 1}`,
    mission: "",
    startDate: "",
    endDate: "",
    description: ""
  };
}

function formatDate(value?: string): string {
  if (!value) return "TBD";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value?: string): string {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function eventHref(eventId: string): string {
  return `/events/manage/?id=${encodeURIComponent(eventId)}`;
}

function getEventIdFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("id") || "";
}

function getParticipantName(event: LocalEvent, participantId: string): string {
  const participant = event.participants.find((entry) => entry.id === participantId);
  return participant ? `${participant.companyName} (${participant.userName})` : "Unknown participant";
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

function EventCreatePanel({ onCreate }: { onCreate: (event: LocalEvent) => void }) {
  const [form, setForm] = useState<EventFormState>(emptyEventForm());

  function updateField(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    const created = createLocalEvent({
      name: form.name,
      description: form.description,
      location: form.location,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      maxParticipants: Number(form.maxParticipants) || undefined
    });

    upsertLocalEvent(created);
    setForm(emptyEventForm());
    onCreate(created);
  }

  return (
    <section className="company-section-card event-create-card">
      <span className="panel-kicker">Organizer Tools</span>
      <h2>Create Event</h2>
      <form className="event-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Event Name</span>
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Campaign night, league season, local event..." />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What is this event about?" />
        </label>

        <div className="event-form-grid">
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Store, Discord, TTS..." />
          </label>
          <label className="field">
            <span>Max Players</span>
            <input type="number" min="0" value={form.maxParticipants} onChange={(event) => updateField("maxParticipants", event.target.value)} placeholder="Unlimited" />
          </label>
          <label className="field">
            <span>Start</span>
            <input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} />
          </label>
          <label className="field">
            <span>End</span>
            <input type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} />
          </label>
        </div>

        <button className="command-button command-button--primary" type="submit" disabled={!form.name.trim()}>
          Create Event
        </button>
      </form>
    </section>
  );
}

function EventListView() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setEvents(loadLocalEvents());
  }, []);

  const filteredEvents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return events;

    return events.filter((event) => {
      return [event.name, event.description, event.location].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [events, searchTerm]);

  function handleCreate(event: LocalEvent) {
    setEvents(loadLocalEvents());
    window.location.href = eventHref(event.id);
  }

  function handleDelete(eventId: string) {
    setEvents(deleteLocalEvent(eventId));
  }

  return (
    <section className="company-manager event-manager" aria-label="Events">
      <div className="company-manager__masthead">
        <p className="eyebrow">Event Control</p>
        <h1>Events</h1>
        <p>Create local seasons and one-day events, register companies, build rounds, and prepare pairings for contract play.</p>
      </div>

      <div className="event-list-layout">
        <EventCreatePanel onCreate={handleCreate} />

        <section className="company-section-card event-index-card">
          <div className="section-heading-row">
            <div>
              <span className="panel-kicker">Local Events</span>
              <h2>Event Files</h2>
            </div>
            <span className="company-count">{events.length}</span>
          </div>

          <label className="field">
            <span>Search</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find an event" />
          </label>

          <div className="event-card-list">
            {filteredEvents.map((event) => (
              <article className="event-index-item" key={event.id}>
                <a href={eventHref(event.id)}>
                  <span className="panel-kicker">{event.location || "Location TBD"}</span>
                  <h3>{event.name}</h3>
                  <p>{event.description || "No description yet."}</p>
                  <div className="event-mini-stats">
                    <span>{formatDate(event.startDate)}</span>
                    <span>{event.participants.length} players</span>
                    <span>{event.rounds.length} rounds</span>
                  </div>
                </a>
                <button className="command-button command-button--danger" type="button" onClick={() => handleDelete(event.id)}>
                  <AppIcon name="trash" size={16} />
                  Delete
                </button>
              </article>
            ))}
            {filteredEvents.length === 0 && <p className="empty-note">No events found.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function ParticipantPanel({ event, onEventChange }: { event: LocalEvent; onEventChange: (event: LocalEvent) => void }) {
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const loadedCompanies = getAvailableEventCompanies();
    setCompanies(loadedCompanies);
    setSelectedCompanyId(loadedCompanies[0]?.id || "");
  }, []);

  const availableCompanies = companies.filter((company) => !event.participants.some((participant) => participant.companyId === company.id));
  const isAtCapacity = Boolean(event.maxParticipants && event.participants.length >= event.maxParticipants);

  function handleAddParticipant() {
    const company = companies.find((entry) => entry.id === selectedCompanyId);
    if (!company) return;
    const updatedEvent = addEventParticipant(event.id, { userName: playerName || company.name, company });
    if (updatedEvent) {
      onEventChange(updatedEvent);
      setPlayerName("");
      const nextAvailable = availableCompanies.find((entry) => entry.id !== company.id);
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
          <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Optional display name" />
        </label>
        <label className="field">
          <span>Company</span>
          <select value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)} disabled={availableCompanies.length === 0 || isAtCapacity}>
            {availableCompanies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <button className="command-button command-button--primary" type="button" onClick={handleAddParticipant} disabled={!selectedCompanyId || availableCompanies.length === 0 || isAtCapacity}>
          Add Participant
        </button>
      </div>

      {isAtCapacity && <p className="legacy-empty-note">This event is at its participant cap.</p>}
      {companies.length === 0 && <p className="legacy-empty-note">Create a company before registering players.</p>}

      <div className="event-participant-list">
        {event.participants.map((participant) => (
          <article className="event-participant-row" key={participant.id}>
            <div>
              <span className="panel-kicker">{participant.userName}</span>
              <h3>{participant.companyName}</h3>
            </div>
            <a className="command-button command-button--small" href={`/companies/manage/?id=${encodeURIComponent(participant.companyId)}`}>
              Open Company
            </a>
            <button className="command-button command-button--danger command-button--small" type="button" onClick={() => handleRemove(participant)}>
              <AppIcon name="trash" size={15} />
              Remove
            </button>
          </article>
        ))}
        {event.participants.length === 0 && <p className="empty-note">No participants registered yet.</p>}
      </div>
    </section>
  );
}

function RoundsPanel({ event, onEventChange }: { event: LocalEvent; onEventChange: (event: LocalEvent) => void }) {
  const [roundForm, setRoundForm] = useState<RoundFormState>(emptyRoundForm(event.rounds.length));
  const [pairingRoundId, setPairingRoundId] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [pairingMission, setPairingMission] = useState("");

  useEffect(() => {
    if (!pairingRoundId && event.rounds[0]) setPairingRoundId(event.rounds[0].id);
    if (!player1Id && event.participants[0]) setPlayer1Id(event.participants[0].id);
    if (!player2Id && event.participants[1]) setPlayer2Id(event.participants[1].id);
  }, [event, pairingRoundId, player1Id, player2Id]);

  function updateRoundField(field: keyof RoundFormState, value: string) {
    setRoundForm((current) => ({ ...current, [field]: value }));
  }

  function handleCreateRound(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    const updatedEvent = createEventRound(event.id, {
      name: roundForm.name,
      mission: roundForm.mission,
      startDate: roundForm.startDate ? new Date(roundForm.startDate).toISOString() : undefined,
      endDate: roundForm.endDate ? new Date(roundForm.endDate).toISOString() : undefined,
      description: roundForm.description
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
      mission: pairingMission
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
            <input value={roundForm.name} onChange={(event) => updateRoundField("name", event.target.value)} />
          </label>
          <label className="field">
            <span>Default Contract</span>
            <input value={roundForm.mission} onChange={(event) => updateRoundField("mission", event.target.value)} placeholder="Control Room, The Mole..." />
          </label>
          <div className="event-form-grid">
            <label className="field">
              <span>Start</span>
              <input type="datetime-local" value={roundForm.startDate} onChange={(event) => updateRoundField("startDate", event.target.value)} />
            </label>
            <label className="field">
              <span>End</span>
              <input type="datetime-local" value={roundForm.endDate} onChange={(event) => updateRoundField("endDate", event.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea value={roundForm.description} onChange={(event) => updateRoundField("description", event.target.value)} placeholder="Organizer notes for this round" />
          </label>
          <button className="command-button command-button--primary" type="submit">
            Create Round
          </button>
        </form>

        <form className="event-tool-panel" onSubmit={handleCreatePairing}>
          <span className="panel-kicker">Create Pairing</span>
          <label className="field">
            <span>Round</span>
            <select value={pairingRoundId} onChange={(event) => setPairingRoundId(event.target.value)} disabled={event.rounds.length === 0}>
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
              <select value={player1Id} onChange={(event) => setPlayer1Id(event.target.value)} disabled={event.participants.length < 2}>
                {event.participants.map((participant) => (
                  <option value={participant.id} key={participant.id}>
                    {participant.companyName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Player B</span>
              <select value={player2Id} onChange={(event) => setPlayer2Id(event.target.value)} disabled={event.participants.length < 2}>
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
            <input value={pairingMission} onChange={(event) => setPairingMission(event.target.value)} placeholder="Optional contract override" />
          </label>
          <button className="command-button command-button--primary" type="submit" disabled={!pairingRoundId || !player1Id || !player2Id || player1Id === player2Id}>
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
                  <p>{round.description || round.mission || "No round notes yet."}</p>
                </div>
                <span className={`event-status event-status--${status.tone}`}>{status.label}</span>
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
                      <strong>{getParticipantName(event, pairing.player1Id)}</strong>
                      <span>vs</span>
                      <strong>{getParticipantName(event, pairing.player2Id)}</strong>
                    </div>
                    <small>{pairing.mission || round.mission || "Contract TBD"}</small>
                    <a className="command-button command-button--small" href={`/events/pairing/?eventId=${event.id}&roundId=${round.id}&pairingId=${pairing.id}`}>
                      Open Pairing
                    </a>
                  </article>
                ))}
                {round.pairings.length === 0 && <p className="empty-note">No pairings for this round yet.</p>}
              </div>
            </article>
          );
        })}
        {event.rounds.length === 0 && <p className="empty-note">No rounds created yet.</p>}
      </div>
    </section>
  );
}

function EventDetailView() {
  const [event, setEvent] = useState<LocalEvent | null>(null);

  useEffect(() => {
    setEvent(getLocalEvent(getEventIdFromLocation()));
  }, []);

  if (!event) {
    return (
      <section className="company-manager event-manager" aria-label="Event not found">
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
    <section className="company-manager event-manager" aria-label="Event manager">
      <div className="event-detail-header">
        <a className="icon-button" href="/events/" aria-label="Back to events">
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Event File</p>
          <h1>{event.name}</h1>
          <p>{event.description || "Register companies, create rounds, and build pairings for contract play."}</p>
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
