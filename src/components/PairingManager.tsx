import { useEffect, useState } from "react";
import {
  getEventRoundPairing,
  upsertPairingResult,
  type EventPairing,
  type EventParticipant,
  type EventRound,
  type LocalEvent,
  type PairingResult,
  type TrooperMissionResult
} from "../lib/mercs/eventStore";
import { loadLocalCompanies, type LocalCompany } from "../lib/mercs/companyStore";
import { AppIcon } from "./AppIcon";

const INJURY_OPTIONS = [
  "",
  "Battle Fury",
  "Punctured Lung",
  "Arms Injury",
  "Brain Injury",
  "Legs Injury",
  "Body Injury",
  "Eyes Injury",
  "Shell Shocked"
];

const DOWNTIME_EVENTS = ["", "Training", "Recovery", "Supply Run", "Intel Gathering", "Recruitment"];
const DOWNTIME_RESULTS = ["", "Critical Success", "Success", "Failure"];

type PairingContext = {
  event: LocalEvent;
  round: EventRound;
  pairing: EventPairing;
};

function getQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function getParticipant(event: LocalEvent, participantId: string): EventParticipant | null {
  return event.participants.find((participant) => participant.id === participantId) || null;
}

function getCompany(companies: LocalCompany[], participant?: EventParticipant | null): LocalCompany | null {
  if (!participant) return null;
  return companies.find((company) => company.id === participant.companyId) || null;
}

function getTrooperName(trooper: any): string {
  return String(trooper?.name || trooper?.isc || trooper?.optionName || "Unknown Trooper");
}

function getTrooperSubtitle(trooper: any): string {
  return String(trooper?.isc || trooper?.profileName || trooper?.optionName || "Mercenary");
}

function getTrooperLogo(trooper: any): string {
  return String(trooper?.resume?.logo || "");
}

function getTrooperPoints(trooper: any): number {
  return Number(trooper?.profileGroups?.[0]?.options?.[0]?.points || trooper?.points || trooper?.renown || 0);
}

function findTrooper(company: LocalCompany | null, trooperId: string): any {
  return ((company?.troopers || []) as any[]).find((trooper) => trooper.id === trooperId) || null;
}

function findCaptain(company: LocalCompany | null): any {
  return ((company?.troopers || []) as any[]).find((trooper) => trooper.captain || trooper.isCaptain) || null;
}

function isEliteDeployed(result: PairingResult): boolean {
  return result.troopers.length > 0 && result.troopers.length <= 4;
}

function defaultResult(participantId: string): PairingResult {
  return {
    participantId,
    op: 0,
    won: false,
    downtime: {
      event: "",
      result: ""
    },
    troopers: [],
    submitted: false,
    updatedAt: new Date().toISOString()
  };
}

function getResult(pairing: EventPairing, participantId: string): PairingResult {
  return pairing.results?.[participantId] || defaultResult(participantId);
}

function calculateTrooperXp(result: TrooperMissionResult, roundNumber: number, eliteDeployed: boolean): number {
  let total = roundNumber;
  if (eliteDeployed) total += 3;
  total += Math.min(Number(result.aidCount ?? (result.aid ? 1 : 0)), 2);
  total += Math.min(Number(result.stateCount ?? (result.state ? 1 : 0)), 3);
  if (result.objective === "attempt") total += 1;
  if (result.objective === "success") total += 2;
  if (result.tag === "scan") total += 1;
  if (result.tag === "fo-scan") total += 2;
  if (result.tag === "tag") total += 2;
  if (result.alive) total += 2;
  if (result.injury) total += 2;
  if (result.mvp) total += 2;
  return total;
}

function calculateTotalXp(result: PairingResult, roundNumber: number): number {
  const eliteDeployed = isEliteDeployed(result);
  return result.troopers.reduce((total, trooper) => total + calculateTrooperXp(trooper, roundNumber, eliteDeployed), 0);
}

function calculateDeployedRenown(company: LocalCompany | null, result: PairingResult): number {
  return result.troopers.reduce((total, entry) => total + getTrooperPoints(findTrooper(company, entry.trooper)), 0);
}

function calculateInducements(activeRenown: number, opposingRenown: number): number {
  const difference = opposingRenown - activeRenown;
  if (difference <= 0) return 0;
  return Math.floor(difference / 2 / 5) * 5;
}

function DeploymentStep({
  company,
  result,
  onChange,
  onNext
}: {
  company: LocalCompany | null;
  result: PairingResult;
  onChange: (result: PairingResult) => void;
  onNext: () => void;
}) {
  const troopers = ((company?.troopers || []) as any[]);
  const deployedIds = new Set(result.troopers.map((trooper) => trooper.trooper));
  const availableTroopers = troopers.filter((trooper) => !deployedIds.has(trooper.id));
  const isElite = isEliteDeployed(result);
  const captain = findCaptain(company);
  const hasCaptain = captain ? deployedIds.has(captain.id) : true;

  function addTrooper(trooper: any) {
    if (result.troopers.length >= 6 || deployedIds.has(trooper.id)) return;
    onChange({
      ...result,
      troopers: [
        ...result.troopers,
        {
          trooper: trooper.id,
          aidCount: 0,
          stateCount: 0,
          objective: "",
          tag: "",
          alive: false,
          injury: ""
        }
      ],
      submitted: false
    });
  }

  function removeTrooper(trooperId: string) {
    onChange({
      ...result,
      troopers: result.troopers.filter((trooper) => trooper.trooper !== trooperId),
      submitted: false
    });
  }

  return (
    <section className="pairing-step-grid">
      <article className="pairing-panel">
        <span className="panel-kicker">Roster</span>
        <h2>Available Troopers</h2>
        <div className="pairing-trooper-list">
          {availableTroopers.map((trooper) => (
            <button className="pairing-trooper-row" type="button" key={trooper.id} onClick={() => addTrooper(trooper)} disabled={result.troopers.length >= 6}>
              {getTrooperLogo(trooper) && <img src={getTrooperLogo(trooper)} alt="" aria-hidden="true" />}
              <span>
                <strong>{getTrooperName(trooper)}</strong>
                <small>{getTrooperSubtitle(trooper)}</small>
              </span>
              <AppIcon name="add" size={17} />
            </button>
          ))}
          {availableTroopers.length === 0 && <p className="empty-note">No available troopers remain.</p>}
        </div>
      </article>

      <article className="pairing-panel">
        <span className="panel-kicker">Deployment</span>
        <h2>
          Deployed Troopers <small>{isElite ? "Elite Deployed" : result.troopers.length === 6 ? "Max Deployment" : ""}</small>
        </h2>
        {!hasCaptain && (
          <p className="legacy-specops-note">
            The Captain must be included in the deployed company for this Contract.
          </p>
        )}
        <div className="pairing-trooper-list">
          {result.troopers.map((entry) => {
            const trooper = findTrooper(company, entry.trooper);
            return (
              <div className="pairing-trooper-row" key={entry.trooper}>
                {getTrooperLogo(trooper) && <img src={getTrooperLogo(trooper)} alt="" aria-hidden="true" />}
                <span>
                  <strong>{getTrooperName(trooper)}</strong>
                  <small>{getTrooperSubtitle(trooper)}</small>
                </span>
                <button className="icon-button" type="button" onClick={() => removeTrooper(entry.trooper)} aria-label={`Remove ${getTrooperName(trooper)}`}>
                  <AppIcon name="remove" size={17} />
                </button>
              </div>
            );
          })}
          {result.troopers.length === 0 && <p className="empty-note">No troopers deployed yet.</p>}
        </div>
        <div className="pairing-step-actions">
          <button className="command-button command-button--primary" type="button" onClick={onNext} disabled={result.troopers.length === 0 || !hasCaptain}>
            Continue to Mission
          </button>
        </div>
      </article>
    </section>
  );
}

function MissionStep({
  company,
  opposingCompany,
  result,
  opposingResult,
  roundNumber,
  onChange,
  onBack,
  onNext
}: {
  company: LocalCompany | null;
  opposingCompany: LocalCompany | null;
  result: PairingResult;
  opposingResult: PairingResult;
  roundNumber: number;
  onChange: (result: PairingResult) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const eliteDeployed = isEliteDeployed(result);
  const deployedRenown = calculateDeployedRenown(company, result);
  const opposingRenown = calculateDeployedRenown(opposingCompany, opposingResult);
  const inducements = calculateInducements(deployedRenown, opposingRenown);

  function updateTrooper(index: number, patch: Partial<TrooperMissionResult>) {
    onChange({
      ...result,
      troopers: result.troopers.map((trooper, currentIndex) => (currentIndex === index ? { ...trooper, ...patch } : trooper)),
      submitted: false
    });
  }

  function setMvp(trooperId: string) {
    onChange({
      ...result,
      troopers: result.troopers.map((trooper) => ({ ...trooper, mvp: trooper.trooper === trooperId })),
      submitted: false
    });
  }

  return (
    <section className="pairing-panel">
      <div className="pairing-mission-header">
        <div>
          <span className="panel-kicker">Mission Report</span>
          <h2>Track Contract Results</h2>
        </div>
        <div className="pairing-score-controls">
          <label className="field">
            <span>Objective Points</span>
            <input type="number" min="0" value={result.op} onChange={(event) => onChange({ ...result, op: Number(event.target.value) || 0, submitted: false })} />
          </label>
          <label className="pairing-check">
            <input type="checkbox" checked={result.won} onChange={(event) => onChange({ ...result, won: event.target.checked, submitted: false })} />
            <span>Victory</span>
          </label>
        </div>
      </div>

      <div className="pairing-rule-grid">
        <article>
          <span>Deployment XP</span>
          <strong>+{roundNumber}</strong>
          <p>Every deployed trooper gains XP equal to the current round number.</p>
        </article>
        <article>
          <span>Elite Deployment</span>
          <strong>{eliteDeployed ? "+3 XP" : "Inactive"}</strong>
          <p>Deploying the Captain and no more than 3 additional troopers grants Elite Deployment XP.</p>
        </article>
        <article>
          <span>Inducements</span>
          <strong>{inducements}</strong>
          <p>{deployedRenown} vs {opposingRenown} deployed Renown, using half the difference rounded down to 5.</p>
        </article>
      </div>

      <div className="pairing-table-wrap">
        <table className="pairing-performance-table">
          <thead>
            <tr>
              <th>Trooper</th>
              <th>XP</th>
              <th>Aid</th>
              <th>States</th>
              <th>Objective</th>
              <th>Scan / Tag</th>
              <th>Alive</th>
              <th>Injury</th>
              <th>MVP</th>
            </tr>
          </thead>
          <tbody>
            {result.troopers.map((entry, index) => {
              const trooper = findTrooper(company, entry.trooper);
              return (
                <tr key={entry.trooper}>
                  <td>
                    <div className="pairing-table-trooper">
                      {getTrooperLogo(trooper) && <img src={getTrooperLogo(trooper)} alt="" aria-hidden="true" />}
                      <span>{getTrooperName(trooper)}</span>
                    </div>
                  </td>
                  <td className="numeric">{calculateTrooperXp(entry, roundNumber, eliteDeployed)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={entry.aidCount ?? (entry.aid ? 1 : 0)}
                      onChange={(event) => updateTrooper(index, { aidCount: Math.min(Number(event.target.value) || 0, 2), aid: Number(event.target.value) > 0 })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={entry.stateCount ?? (entry.state ? 1 : 0)}
                      onChange={(event) => updateTrooper(index, { stateCount: Math.min(Number(event.target.value) || 0, 3), state: Number(event.target.value) > 0 })}
                    />
                  </td>
                  <td>
                    <select value={entry.objective || ""} onChange={(event) => updateTrooper(index, { objective: event.target.value as TrooperMissionResult["objective"] })}>
                      <option value="">None</option>
                      <option value="attempt">Attempt</option>
                      <option value="success">Success</option>
                    </select>
                  </td>
                  <td>
                    <select value={entry.tag || ""} onChange={(event) => updateTrooper(index, { tag: event.target.value as TrooperMissionResult["tag"] })}>
                      <option value="">None</option>
                      <option value="scan">Scan</option>
                      <option value="fo-scan">FO Scan</option>
                      <option value="tag">Tag and Bag</option>
                    </select>
                  </td>
                  <td><input type="checkbox" checked={Boolean(entry.alive)} onChange={(event) => updateTrooper(index, { alive: event.target.checked })} /></td>
                  <td>
                    <select value={entry.injury || ""} onChange={(event) => updateTrooper(index, { injury: event.target.value })}>
                      {INJURY_OPTIONS.map((option) => <option value={option} key={option}>{option || "None"}</option>)}
                    </select>
                  </td>
                  <td><input type="radio" name="pairing-mvp" checked={Boolean(entry.mvp)} onChange={() => setMvp(entry.trooper)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pairing-force-grid">
        <article className="pairing-force-card">
          <span className="panel-kicker">Your Deployed Forces</span>
          <h3>{company?.name || "Unknown Company"}</h3>
          <ul>
            {result.troopers.map((entry) => {
              const trooper = findTrooper(company, entry.trooper);
              return <li key={entry.trooper}>{getTrooperName(trooper)} <span>{getTrooperPoints(trooper)} RN</span></li>;
            })}
          </ul>
        </article>
        <article className="pairing-force-card">
          <span className="panel-kicker">Opponent Deployed Forces</span>
          <h3>{opposingCompany?.name || "Waiting on opponent"}</h3>
          <ul>
            {opposingResult.troopers.map((entry) => {
              const trooper = findTrooper(opposingCompany, entry.trooper);
              return <li key={entry.trooper}>{getTrooperName(trooper)} <span>{getTrooperPoints(trooper)} RN</span></li>;
            })}
            {opposingResult.troopers.length === 0 && <li>No opposing deployment saved yet.</li>}
          </ul>
        </article>
      </div>

      <div className="pairing-downtime-grid">
        <label className="field">
          <span>Downtime Event</span>
          <select value={result.downtime.event} onChange={(event) => onChange({ ...result, downtime: { ...result.downtime, event: event.target.value }, submitted: false })}>
            {DOWNTIME_EVENTS.map((option) => <option value={option} key={option}>{option || "None"}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Downtime Result</span>
          <select value={result.downtime.result} onChange={(event) => onChange({ ...result, downtime: { ...result.downtime, result: event.target.value }, submitted: false })}>
            {DOWNTIME_RESULTS.map((option) => <option value={option} key={option}>{option || "Not rolled"}</option>)}
          </select>
        </label>
      </div>

      <div className="pairing-step-actions">
        <button className="command-button" type="button" onClick={onBack}>Back</button>
        <button className="command-button command-button--primary" type="button" onClick={onNext}>Review Results</button>
      </div>
    </section>
  );
}

function SummaryCard({ title, company, result, roundNumber }: { title: string; company: LocalCompany | null; result: PairingResult; roundNumber: number }) {
  const eliteDeployed = isEliteDeployed(result);

  return (
    <article className="pairing-summary-card">
      <span className="panel-kicker">{title}</span>
      <h3>{company?.name || "Unknown Company"}</h3>
      <div className="event-mini-stats">
        <span>{result.won ? "Victory" : "Defeat"}</span>
        <span>{result.op} OP</span>
        <span>{calculateTotalXp(result, roundNumber)} XP tracked</span>
        <span>{result.submitted ? "Submitted" : "Draft"}</span>
      </div>
      <div className="pairing-summary-list">
        {result.troopers.map((entry) => {
          const trooper = findTrooper(company, entry.trooper);
          return (
            <div key={entry.trooper}>
              <strong>{getTrooperName(trooper)}</strong>
              <span>{calculateTrooperXp(entry, roundNumber, eliteDeployed)} XP</span>
            </div>
          );
        })}
      </div>
      <p>Downtime: {result.downtime.event || "None"} {result.downtime.result ? `(${result.downtime.result})` : ""}</p>
    </article>
  );
}

function PairingWorkspace({ context, companies }: { context: PairingContext; companies: LocalCompany[] }) {
  const [activeParticipantId, setActiveParticipantId] = useState(context.pairing.player1Id);
  const [step, setStep] = useState(0);
  const [contextState, setContextState] = useState(context);
  const participantA = getParticipant(contextState.event, contextState.pairing.player1Id);
  const participantB = getParticipant(contextState.event, contextState.pairing.player2Id);
  const activeParticipant = getParticipant(contextState.event, activeParticipantId);
  const activeCompany = getCompany(companies, activeParticipant);
  const companyA = getCompany(companies, participantA);
  const companyB = getCompany(companies, participantB);
  const activeResult = getResult(contextState.pairing, activeParticipantId);
  const resultA = getResult(contextState.pairing, contextState.pairing.player1Id);
  const resultB = getResult(contextState.pairing, contextState.pairing.player2Id);
  const contractName = contextState.pairing.mission || contextState.round.mission || "Contract TBD";

  function refreshFromEvent(updatedEvent: LocalEvent) {
    const round = updatedEvent.rounds.find((entry) => entry.id === contextState.round.id);
    const pairing = round?.pairings.find((entry) => entry.id === contextState.pairing.id);
    if (round && pairing) setContextState({ event: updatedEvent, round, pairing });
  }

  function saveResult(nextResult: PairingResult) {
    const updatedEvent = upsertPairingResult(contextState.event.id, contextState.round.id, contextState.pairing.id, nextResult);
    if (updatedEvent) refreshFromEvent(updatedEvent);
  }

  function updateDraft(nextResult: PairingResult) {
    saveResult({ ...nextResult, submitted: false, updatedAt: new Date().toISOString() });
  }

  useEffect(() => {
    const captain = findCaptain(activeCompany);
    if (!captain || activeResult.troopers.length > 0) return;

    saveResult({
      ...activeResult,
      troopers: [
        {
          trooper: captain.id,
          aidCount: 0,
          stateCount: 0,
          objective: "",
          tag: "",
          alive: false,
          injury: ""
        }
      ],
      submitted: false,
      updatedAt: new Date().toISOString()
    });
  }, [activeCompany?.id, activeParticipantId]);

  function submitResult() {
    saveResult({ ...activeResult, submitted: true, updatedAt: new Date().toISOString() });
  }

  return (
    <section className="company-manager pairing-manager">
      <div className="event-detail-header">
        <a className="icon-button" href={`/events/manage/?id=${encodeURIComponent(contextState.event.id)}`} aria-label="Back to event">
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Pairing</p>
          <h1>{contractName}</h1>
          <p>{contextState.round.name}: {participantA?.companyName || "Player A"} vs {participantB?.companyName || "Player B"}</p>
        </div>
      </div>

      <div className="pairing-player-switch">
        {[participantA, participantB].filter(Boolean).map((participant) => (
          <button
            className={participant?.id === activeParticipantId ? "is-active" : ""}
            type="button"
            key={participant?.id}
            onClick={() => {
              setActiveParticipantId(participant?.id || "");
              setStep(0);
            }}
          >
            <span>{participant?.userName}</span>
            <strong>{participant?.companyName}</strong>
          </button>
        ))}
      </div>

      <div className="pairing-stepper" aria-label="Pairing steps">
        {["Deploy Troopers", "Mission", "Post Mission"].map((label, index) => (
          <button className={step === index ? "is-active" : ""} type="button" key={label} onClick={() => setStep(index)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && <DeploymentStep company={activeCompany} result={activeResult} onChange={updateDraft} onNext={() => setStep(1)} />}
      {step === 1 && (
        <MissionStep
          company={activeCompany}
          opposingCompany={activeParticipantId === contextState.pairing.player1Id ? companyB : companyA}
          result={activeResult}
          opposingResult={activeParticipantId === contextState.pairing.player1Id ? resultB : resultA}
          roundNumber={contextState.round.number}
          onChange={updateDraft}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <section className="pairing-panel">
          <div className="section-heading-row">
            <div>
              <span className="panel-kicker">Post Mission</span>
              <h2>Review Results</h2>
            </div>
            <button className="command-button command-button--primary" type="button" onClick={submitResult}>
              Submit {activeParticipant?.companyName || "Result"}
            </button>
          </div>
          <div className="pairing-summary-grid">
            <SummaryCard title="Player A" company={companyA} result={resultA} roundNumber={contextState.round.number} />
            <SummaryCard title="Player B" company={companyB} result={resultB} roundNumber={contextState.round.number} />
          </div>
          <p className="legacy-specops-note">
            This saves pairing results locally. Applying XP, CR, injuries, and downtime effects to company files will be the next pass.
          </p>
        </section>
      )}
    </section>
  );
}

export default function PairingManager() {
  const [context, setContext] = useState<PairingContext | null>(null);
  const [companies, setCompanies] = useState<LocalCompany[]>([]);

  useEffect(() => {
    const eventId = getQueryParam("eventId");
    const roundId = getQueryParam("roundId");
    const pairingId = getQueryParam("pairingId");
    const loaded = getEventRoundPairing(eventId, roundId, pairingId);
    setCompanies(loadLocalCompanies());
    if (loaded.event && loaded.round && loaded.pairing) {
      setContext({ event: loaded.event, round: loaded.round, pairing: loaded.pairing });
    }
  }, []);

  if (!context) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Missing Pairing</span>
          <h1>Pairing Not Found</h1>
          <p>This local event pairing could not be loaded.</p>
          <a className="command-button command-button--primary" href="/events/">Back to Events</a>
        </div>
      </section>
    );
  }

  return <PairingWorkspace context={context} companies={companies} />;
}
