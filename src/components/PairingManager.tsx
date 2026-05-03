import { useCallback, useEffect, useState } from "react";
import {
  createSharedFile,
  getOrCreateOrganizerFolders,
  isSignedIn as getGoogleSignedIn,
  listAppDataCompanyReferences,
  makeFilePublic,
  readSharedFile,
  subscribeAuthState,
  updateSharedFile,
} from "../lib/google-drive-adapter";
import {
  getEventRoundPairing,
  upsertPairingResult,
  type EventPairing,
  type EventParticipant,
  type EventRound,
  type LocalEvent,
  type PairingResult,
  type TrooperMissionResult,
} from "../lib/mercs/eventStore";
import {
  loadLocalCompanies,
  type LocalCompany,
} from "../lib/mercs/companyStore";
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
  "Shell Shocked",
];

const DOWNTIME_EVENTS = [
  "",
  "Training",
  "Recovery",
  "Supply Run",
  "Intel Gathering",
  "Recruitment",
];
const DOWNTIME_RESULTS = ["", "Critical Success", "Success", "Failure"];

type PairingInducementSelection = {
  id: string;
  optionId: string;
  trooperId: string;
};

type PairingInducements = {
  selections: PairingInducementSelection[];
  updatedAt: string;
};

type InducementOption = {
  id: string;
  label: string;
  category: "troops" | "command" | "primary" | "secondary" | "equipment";
  cost: number;
  maxCount?: number;
};

const INDUCEMENT_OPTIONS: InducementOption[] = [
  {
    id: "troop-abh-smg-bsg",
    label: "Authorized Bounty Hunter (SMG or BSG)",
    category: "troops",
    cost: 10,
  },
  {
    id: "troop-monstruckers",
    label: "Monstruckers (Any)",
    category: "troops",
    cost: 15,
  },
  {
    id: "troop-motorized-bh",
    label: "Motorized Bounty Hunters (Any)",
    category: "troops",
    cost: 15,
  },
  {
    id: "troop-wardriver",
    label: "Wardriver (Any)",
    category: "troops",
    cost: 15,
  },
  {
    id: "troop-bashi",
    label: "Bashi Bazouks (Any)",
    category: "troops",
    cost: 15,
  },
  {
    id: "troop-abh-sniper-spitfire",
    label: "Authorized Bounty Hunter (Sniper or Spitfire)",
    category: "troops",
    cost: 20,
  },
  { id: "troop-digger", label: "Digger (Any)", category: "troops", cost: 20 },
  {
    id: "troop-brawler-sniper",
    label: "Brawler (Sniper)",
    category: "troops",
    cost: 25,
  },
  {
    id: "troop-samsa",
    label: "Freelance Operator Samsa (Any)",
    category: "troops",
    cost: 30,
  },
  {
    id: "troop-anaconda",
    label: "Anaconda, Mercenary TAG Squad (Any + Immunity POS)",
    category: "troops",
    cost: 50,
  },
  {
    id: "cmd-token",
    label: "Command Token",
    category: "command",
    cost: 10,
    maxCount: 2,
  },
  {
    id: "primary-ap-marksman",
    label: "AP Marksman Rifle",
    category: "primary",
    cost: 5,
  },
  {
    id: "primary-breaker-combi",
    label: "Breaker Combi Rifle",
    category: "primary",
    cost: 5,
  },
  {
    id: "primary-spitfire",
    label: "Spitfire",
    category: "primary",
    cost: 10,
    maxCount: 2,
  },
  {
    id: "primary-multi-sniper",
    label: "MULTI Sniper",
    category: "primary",
    cost: 15,
    maxCount: 1,
  },
  {
    id: "primary-hmg",
    label: "HMG",
    category: "primary",
    cost: 15,
    maxCount: 1,
  },
  {
    id: "secondary-panzerfaust",
    label: "Panzerfaust",
    category: "secondary",
    cost: 5,
  },
  {
    id: "secondary-flammenspeer",
    label: "Flammenspeer",
    category: "secondary",
    cost: 5,
  },
  { id: "secondary-blitzen", label: "Blitzen", category: "secondary", cost: 5 },
  {
    id: "secondary-symbiobomb",
    label: "Symbiobomb",
    category: "secondary",
    cost: 10,
    maxCount: 1,
  },
  {
    id: "secondary-symbiomate",
    label: "Symbiomate",
    category: "secondary",
    cost: 10,
    maxCount: 1,
  },
  {
    id: "equipment-tinbot-3",
    label: "Tinbot: Firewall (-3)",
    category: "equipment",
    cost: 5,
    maxCount: 2,
  },
  {
    id: "equipment-msv1",
    label: "MSV1",
    category: "equipment",
    cost: 5,
    maxCount: 2,
  },
  {
    id: "equipment-albedo-3",
    label: "Albedo (-3)",
    category: "equipment",
    cost: 5,
    maxCount: 2,
  },
  {
    id: "equipment-tinbot-6",
    label: "Tinbot: Firewall (-6)",
    category: "equipment",
    cost: 10,
    maxCount: 1,
  },
  {
    id: "equipment-msv2",
    label: "MSV2",
    category: "equipment",
    cost: 10,
    maxCount: 1,
  },
  {
    id: "equipment-albedo-6",
    label: "Albedo (-6)",
    category: "equipment",
    cost: 10,
    maxCount: 1,
  },
];

const INDUCEMENT_OPTION_BY_ID = new Map(
  INDUCEMENT_OPTIONS.map((option) => [option.id, option]),
);

type PairingContext = {
  event: LocalEvent;
  round: EventRound;
  pairing: EventPairing;
};

type SharedCompanyFilePayload = {
  companyEventFileId?: string;
  companyEventShareLink?: string;
  company?: any;
  event?: {
    fileId?: string;
    link?: string;
    companyEventFileId?: string;
    companyEventShareLink?: string;
    companyEventFile?: {
      fileId?: string;
      shareLink?: string;
      link?: string;
    };
  };
  companyEventFile?: {
    fileId?: string;
    shareLink?: string;
    link?: string;
  };
};

type RegisteredCompanyRef = {
  companyEventFileId?: string;
  companyEventShareLink?: string;
};

function getCompanyEventFileRef(payload: SharedCompanyFilePayload): {
  fileId?: string;
  shareLink?: string;
} {
  const companyAny = payload?.company as any;
  const eventAny = payload?.event as any;
  const companyEventAny = companyAny?.event as any;

  const fileId =
    payload.companyEventFile?.fileId ||
    payload.companyEventFileId ||
    payload.event?.companyEventFileId ||
    payload.event?.companyEventFile?.fileId ||
    companyAny?.companyEventFileId ||
    companyAny?.companyEventFile?.fileId ||
    companyEventAny?.companyEventFileId ||
    companyEventAny?.companyEventFile?.fileId;
  const shareLink =
    payload.companyEventFile?.shareLink ||
    payload.companyEventFile?.link ||
    payload.companyEventShareLink ||
    payload.event?.companyEventShareLink ||
    payload.event?.companyEventFile?.shareLink ||
    payload.event?.companyEventFile?.link ||
    companyAny?.companyEventShareLink ||
    companyAny?.companyEventFile?.shareLink ||
    companyAny?.companyEventFile?.link ||
    companyEventAny?.companyEventShareLink ||
    companyEventAny?.companyEventFile?.shareLink ||
    companyEventAny?.companyEventFile?.link;
  return {
    fileId: fileId ? String(fileId) : undefined,
    shareLink: shareLink ? String(shareLink) : undefined,
  };
}

async function ensureCompanyEventFileForOwnedCompany(input: {
  companyFileId: string;
  companyPayload: SharedCompanyFilePayload;
  companyName: string;
  eventFileId: string;
  eventName: string;
}): Promise<{ fileId?: string; shareLink?: string }> {
  const existingRef = getCompanyEventFileRef(input.companyPayload);
  if (existingRef.fileId) return existingRef;

  const timestamp = new Date().toISOString();
  const folders = await getOrCreateOrganizerFolders();
  const eventPayload = {
    schemaVersion: 1,
    kind: "infinity-mercenaries-company-event",
    createdAt: timestamp,
    updatedAt: timestamp,
    event: {
      fileId: input.eventFileId,
      name: input.eventName,
    },
    company: {
      id: input.companyPayload?.company?.id,
      name: input.companyName,
      companyFileId: input.companyFileId,
      companyShareLink: `${window.location.origin}/view?id=${encodeURIComponent(input.companyFileId)}`,
    },
    pairings: {},
  };

  const fileName = `mercs-company-event-${input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.json`;
  const companyEventFileId = await createSharedFile(
    fileName,
    eventPayload,
    folders.eventsFolderId,
  );
  await makeFilePublic(companyEventFileId);
  const companyEventShareLink = `${window.location.origin}/view?id=${encodeURIComponent(companyEventFileId)}`;

  await updateSharedFile(input.companyFileId, {
    ...(input.companyPayload as any),
    updatedAt: new Date().toISOString(),
    company: {
      ...(input.companyPayload?.company || {}),
      companyEventFileId,
      companyEventShareLink,
    },
    event: {
      ...(input.companyPayload?.event || {}),
      companyEventFileId,
      companyEventShareLink,
    },
    companyEventFile: {
      fileId: companyEventFileId,
      shareLink: companyEventShareLink,
    },
  });

  return {
    fileId: companyEventFileId,
    shareLink: companyEventShareLink,
  };
}

function getQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
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

function getParticipant(
  event: LocalEvent,
  participantId: string,
): EventParticipant | null {
  return (
    event.participants.find(
      (participant) => participant.id === participantId,
    ) || null
  );
}

function getCompany(
  companies: LocalCompany[],
  participant?: EventParticipant | null,
): LocalCompany | null {
  if (!participant) return null;
  return (
    companies.find((company) => company.id === participant.companyId) || null
  );
}

function getTrooperName(trooper: any): string {
  return String(
    trooper?.name || trooper?.isc || trooper?.optionName || "Unknown Trooper",
  );
}

function getTrooperSubtitle(trooper: any): string {
  return String(
    trooper?.isc || trooper?.profileName || trooper?.optionName || "Mercenary",
  );
}

function getTrooperLogo(trooper: any): string {
  return String(trooper?.resume?.logo || "");
}

function getTrooperPoints(trooper: any): number {
  return Number(
    trooper?.profileGroups?.[0]?.options?.[0]?.points ||
      trooper?.points ||
      trooper?.renown ||
      0,
  );
}

function findTrooper(company: LocalCompany | null, trooperId: string): any {
  return (
    ((company?.troopers || []) as any[]).find(
      (trooper) => trooper.id === trooperId,
    ) || null
  );
}

function findCaptain(company: LocalCompany | null): any {
  return (
    ((company?.troopers || []) as any[]).find(
      (trooper) => trooper.captain || trooper.isCaptain,
    ) || null
  );
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
      result: "",
    },
    troopers: [],
    submitted: false,
    updatedAt: new Date().toISOString(),
  };
}

function defaultInducements(): PairingInducements {
  return {
    selections: [],
    updatedAt: "",
  };
}

function getResult(
  pairing: EventPairing,
  participantId: string,
): PairingResult {
  return pairing.results?.[participantId] || defaultResult(participantId);
}

function calculateTrooperXp(
  result: TrooperMissionResult,
  roundNumber: number,
  eliteDeployed: boolean,
): number {
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
  return result.troopers.reduce(
    (total, trooper) =>
      total + calculateTrooperXp(trooper, roundNumber, eliteDeployed),
    0,
  );
}

function calculateDeployedRenown(
  company: LocalCompany | null,
  result: PairingResult,
): number {
  return result.troopers.reduce((total, entry) => {
    const trooper = findTrooper(company, entry.trooper);
    if (trooper) return total + getTrooperPoints(trooper);

    const snapshot = Number(
      (entry as any)?.renownSnapshot ?? (entry as any)?.points ?? 0,
    );
    return total + (Number.isFinite(snapshot) ? snapshot : 0);
  }, 0);
}

function calculateInducements(
  activeRenown: number,
  opposingRenown: number,
): number {
  const difference = opposingRenown - activeRenown;
  if (difference <= 0) return 0;
  return Math.floor(difference / 2 / 5) * 5;
}

function DeploymentStep({
  company,
  result,
  onChange,
  onNext,
  nextLabel,
}: {
  company: LocalCompany | null;
  result: PairingResult;
  onChange: (result: PairingResult) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const troopers = (company?.troopers || []) as any[];
  const deployedIds = new Set(
    result.troopers.map((trooper) => trooper.trooper),
  );
  const availableTroopers = troopers.filter(
    (trooper) => !deployedIds.has(trooper.id),
  );
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
          injury: "",
        },
      ],
      submitted: false,
    });
  }

  function removeTrooper(trooperId: string) {
    onChange({
      ...result,
      troopers: result.troopers.filter(
        (trooper) => trooper.trooper !== trooperId,
      ),
      submitted: false,
    });
  }

  return (
    <section className="pairing-step-grid">
      <article className="pairing-panel">
        <span className="panel-kicker">Roster</span>
        <h2>Available Troopers</h2>
        <div className="pairing-trooper-list">
          {availableTroopers.map((trooper) => (
            <button
              className="pairing-trooper-row"
              type="button"
              key={trooper.id}
              onClick={() => addTrooper(trooper)}
              disabled={result.troopers.length >= 6}
            >
              {getTrooperLogo(trooper) && (
                <img src={getTrooperLogo(trooper)} alt="" aria-hidden="true" />
              )}
              <span>
                <strong>{getTrooperName(trooper)}</strong>
                <small>{getTrooperSubtitle(trooper)}</small>
              </span>
              <AppIcon name="add" size={17} />
            </button>
          ))}
          {availableTroopers.length === 0 && (
            <p className="empty-note">No available troopers remain.</p>
          )}
        </div>
      </article>

      <article className="pairing-panel">
        <span className="panel-kicker">Deployment</span>
        <h2>
          Deployed Troopers{" "}
          <small>
            {isElite
              ? "Elite Deployed"
              : result.troopers.length === 6
                ? "Max Deployment"
                : ""}
          </small>
        </h2>
        {!hasCaptain && (
          <p className="legacy-specops-note">
            The Captain must be included in the deployed company for this
            Contract.
          </p>
        )}
        <div className="pairing-trooper-list">
          {result.troopers.map((entry) => {
            const trooper = findTrooper(company, entry.trooper);
            return (
              <div className="pairing-trooper-row" key={entry.trooper}>
                {getTrooperLogo(trooper) && (
                  <img
                    src={getTrooperLogo(trooper)}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <span>
                  <strong>{getTrooperName(trooper)}</strong>
                  <small>{getTrooperSubtitle(trooper)}</small>
                </span>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => removeTrooper(entry.trooper)}
                  aria-label={`Remove ${getTrooperName(trooper)}`}
                >
                  <AppIcon name="remove" size={17} />
                </button>
              </div>
            );
          })}
          {result.troopers.length === 0 && (
            <p className="empty-note">No troopers deployed yet.</p>
          )}
        </div>
        <div className="pairing-step-actions">
          <button
            className="command-button command-button--primary"
            type="button"
            onClick={onNext}
            disabled={result.troopers.length === 0 || !hasCaptain}
          >
            {nextLabel || "Continue to Mission"}
          </button>
        </div>
      </article>
    </section>
  );
}

function InducementsStep({
  company,
  opposingCompany,
  result,
  opposingResult,
  selections,
  onChangeSelections,
  onRefresh,
  refreshing,
  saving,
  onBack,
  onNext,
}: {
  company: LocalCompany | null;
  opposingCompany: LocalCompany | null;
  result: PairingResult;
  opposingResult: PairingResult;
  selections: PairingInducementSelection[];
  onChangeSelections: (nextSelections: PairingInducementSelection[]) => void;
  onRefresh: () => void;
  refreshing: boolean;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const activeRenown = calculateDeployedRenown(company, result);
  const opposingRenown = calculateDeployedRenown(
    opposingCompany,
    opposingResult,
  );
  const inducementBudget = calculateInducements(activeRenown, opposingRenown);
  const deployedTroopers = result.troopers
    .map((entry) => findTrooper(company, entry.trooper))
    .filter(Boolean);
  const opposingDeployed = opposingResult.troopers
    .map((entry) => findTrooper(opposingCompany, entry.trooper))
    .filter(Boolean);
  const bothDeployed =
    result.troopers.length > 0 && opposingResult.troopers.length > 0;
  const spent = selections.reduce(
    (total, selection) =>
      total +
      Number(INDUCEMENT_OPTION_BY_ID.get(selection.optionId)?.cost || 0),
    0,
  );
  const remaining = inducementBudget - spent;
  const countByOption = selections.reduce<Record<string, number>>(
    (acc, selection) => {
      acc[selection.optionId] = (acc[selection.optionId] || 0) + 1;
      return acc;
    },
    {},
  );

  function canChooseOption(optionId: string, selectionId: string): boolean {
    const option = INDUCEMENT_OPTION_BY_ID.get(optionId);
    if (!option?.maxCount) return true;
    const currentCount = countByOption[optionId] || 0;
    const currentSelection = selections.find(
      (entry) => entry.id === selectionId,
    );
    if (currentSelection?.optionId === optionId) return true;
    return currentCount < option.maxCount;
  }

  function addSelection() {
    if (deployedTroopers.length === 0) return;
    const defaultOption = INDUCEMENT_OPTIONS.find((option) =>
      canChooseOption(option.id, ""),
    );
    if (!defaultOption) return;

    onChangeSelections([
      ...selections,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        optionId: defaultOption.id,
        trooperId: String(deployedTroopers[0]?.id || ""),
      },
    ]);
  }

  function updateSelection(
    selectionId: string,
    patch: Partial<PairingInducementSelection>,
  ) {
    onChangeSelections(
      selections.map((selection) =>
        selection.id === selectionId ? { ...selection, ...patch } : selection,
      ),
    );
  }

  function removeSelection(selectionId: string) {
    onChangeSelections(
      selections.filter((selection) => selection.id !== selectionId),
    );
  }

  return (
    <section className="pairing-panel">
      <div className="section-heading-row">
        <div>
          <span className="panel-kicker">Inducements</span>
          <h2>Contract Benefits Shop</h2>
        </div>
        <div className="pairing-step-actions pairing-step-actions--flush">
          <button
            className="command-button"
            type="button"
            onClick={onRefresh}
            disabled={refreshing || saving}
          >
            {refreshing ? "Refreshing..." : "Refresh Opponent Deployment"}
          </button>
        </div>
      </div>

      <div className="pairing-rule-grid">
        <article>
          <span>Your Deployed Renown</span>
          <strong>{activeRenown}</strong>
          <p>Calculated from your currently deployed troopers.</p>
        </article>
        <article>
          <span>Opponent Deployed Renown</span>
          <strong>{opposingRenown}</strong>
          <p>
            Refresh until your opponent deployment appears from their event
            file.
          </p>
        </article>
        <article>
          <span>Inducements Available</span>
          <strong>{bothDeployed ? inducementBudget : "--"}</strong>
          <p>Half the Renown difference, rounded down to the nearest 5.</p>
        </article>
      </div>

      {!bothDeployed && (
        <div className="legacy-specops-note">
          Waiting for both players to save deployment to their company event
          files. Once both deployments are present, inducement options will
          appear.
        </div>
      )}

      {bothDeployed && (
        <>
          <div className="pairing-inducement-toolbar">
            <div className="event-mini-stats">
              <span>Budget: {inducementBudget}</span>
              <span>Spent: {spent}</span>
              <span className={remaining < 0 ? "is-over-budget" : ""}>
                Remaining: {remaining}
              </span>
            </div>
            <button
              className="command-button command-button--small"
              type="button"
              onClick={addSelection}
              disabled={deployedTroopers.length === 0}
            >
              Add Inducement
            </button>
          </div>

          <div className="pairing-inducement-list">
            {selections.map((selection) => (
              <div className="pairing-inducement-row" key={selection.id}>
                <label className="field">
                  <span>Benefit</span>
                  <select
                    value={selection.optionId}
                    onChange={(event) => {
                      const nextOptionId = event.target.value;
                      if (!canChooseOption(nextOptionId, selection.id)) return;
                      updateSelection(selection.id, { optionId: nextOptionId });
                    }}
                  >
                    {INDUCEMENT_OPTIONS.map((option) => (
                      <option
                        value={option.id}
                        key={option.id}
                        disabled={!canChooseOption(option.id, selection.id)}
                      >
                        {option.label} ({option.cost} Ind)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Assigned Trooper</span>
                  <select
                    value={selection.trooperId}
                    onChange={(event) =>
                      updateSelection(selection.id, {
                        trooperId: event.target.value,
                      })
                    }
                  >
                    {deployedTroopers.map((trooper) => (
                      <option
                        value={String(trooper?.id || "")}
                        key={String(trooper?.id || "")}
                      >
                        {getTrooperName(trooper)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => removeSelection(selection.id)}
                  aria-label="Remove inducement"
                >
                  <AppIcon name="remove" size={17} />
                </button>
              </div>
            ))}
            {selections.length === 0 && (
              <p className="empty-note">No inducements selected.</p>
            )}
          </div>

          <div className="pairing-force-grid">
            <article className="pairing-force-card">
              <span className="panel-kicker">Your Deployed Troopers</span>
              <h3>{company?.name || "Unknown Company"}</h3>
              <ul>
                {result.troopers.map((entry) => {
                  const trooper = findTrooper(company, entry.trooper);
                  const assigned = selections
                    .filter(
                      (selection) => selection.trooperId === entry.trooper,
                    )
                    .map(
                      (selection) =>
                        INDUCEMENT_OPTION_BY_ID.get(selection.optionId)
                          ?.label || "Unknown",
                    );
                  return (
                    <li
                      key={entry.trooper}
                      className="pairing-force-item-with-note"
                    >
                      <div>
                        <strong>{getTrooperName(trooper)}</strong>
                        {assigned.length > 0 && (
                          <small>{assigned.join(" | ")}</small>
                        )}
                      </div>
                      <span>{getTrooperPoints(trooper)} RN</span>
                    </li>
                  );
                })}
              </ul>
            </article>
            <article className="pairing-force-card">
              <span className="panel-kicker">Opponent Deployment</span>
              <h3>{opposingCompany?.name || "Opponent"}</h3>
              <ul>
                {opposingResult.troopers.map((entry) => {
                  const trooper = findTrooper(opposingCompany, entry.trooper);
                  return (
                    <li key={entry.trooper}>
                      {getTrooperName(trooper)}{" "}
                      <span>{getTrooperPoints(trooper)} RN</span>
                    </li>
                  );
                })}
                {opposingDeployed.length === 0 && (
                  <li>No opposing deployment saved yet.</li>
                )}
              </ul>
            </article>
          </div>
        </>
      )}

      <div className="pairing-step-actions">
        <button className="command-button" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="command-button command-button--primary"
          type="button"
          onClick={onNext}
          disabled={!bothDeployed || remaining < 0}
        >
          Continue to Mission
        </button>
      </div>
    </section>
  );
}

function MissionStep({
  company,
  opposingCompany,
  result,
  opposingResult,
  inducementSelections,
  roundNumber,
  onChange,
  onBack,
  onNext,
}: {
  company: LocalCompany | null;
  opposingCompany: LocalCompany | null;
  result: PairingResult;
  opposingResult: PairingResult;
  inducementSelections?: PairingInducementSelection[];
  roundNumber: number;
  onChange: (result: PairingResult) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const eliteDeployed = isEliteDeployed(result);
  const deployedRenown = calculateDeployedRenown(company, result);
  const opposingRenown = calculateDeployedRenown(
    opposingCompany,
    opposingResult,
  );
  const inducements = calculateInducements(deployedRenown, opposingRenown);
  const selections = Array.isArray(inducementSelections)
    ? inducementSelections
    : [];

  function updateTrooper(index: number, patch: Partial<TrooperMissionResult>) {
    onChange({
      ...result,
      troopers: result.troopers.map((trooper, currentIndex) =>
        currentIndex === index ? { ...trooper, ...patch } : trooper,
      ),
      submitted: false,
    });
  }

  function setMvp(trooperId: string) {
    onChange({
      ...result,
      troopers: result.troopers.map((trooper) => ({
        ...trooper,
        mvp: trooper.trooper === trooperId,
      })),
      submitted: false,
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
            <input
              type="number"
              min="0"
              value={result.op}
              onChange={(event) =>
                onChange({
                  ...result,
                  op: Number(event.target.value) || 0,
                  submitted: false,
                })
              }
            />
          </label>
          <label className="pairing-check">
            <input
              type="checkbox"
              checked={result.won}
              onChange={(event) =>
                onChange({
                  ...result,
                  won: event.target.checked,
                  submitted: false,
                })
              }
            />
            <span>Victory</span>
          </label>
        </div>
      </div>

      <div className="pairing-rule-grid">
        <article>
          <span>Deployment XP</span>
          <strong>+{roundNumber}</strong>
          <p>
            Every deployed trooper gains XP equal to the current round number.
          </p>
        </article>
        <article>
          <span>Elite Deployment</span>
          <strong>{eliteDeployed ? "+3 XP" : "Inactive"}</strong>
          <p>
            Deploying the Captain and no more than 3 additional troopers grants
            Elite Deployment XP.
          </p>
        </article>
        <article>
          <span>Inducements</span>
          <strong>{inducements}</strong>
          <p>
            {deployedRenown} vs {opposingRenown} deployed Renown, using half the
            difference rounded down to 5.
          </p>
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
              const assignedInducements = selections
                .filter((selection) => selection.trooperId === entry.trooper)
                .map(
                  (selection) =>
                    INDUCEMENT_OPTION_BY_ID.get(selection.optionId)?.label ||
                    "Unknown Benefit",
                );
              return (
                <tr key={entry.trooper}>
                  <td>
                    <div className="pairing-table-trooper">
                      {getTrooperLogo(trooper) && (
                        <img
                          src={getTrooperLogo(trooper)}
                          alt=""
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {getTrooperName(trooper)}
                        {assignedInducements.length > 0 && (
                          <small className="pairing-inducement-inline">
                            + {assignedInducements.join(" | ")}
                          </small>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="numeric">
                    {calculateTrooperXp(entry, roundNumber, eliteDeployed)}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={entry.aidCount ?? (entry.aid ? 1 : 0)}
                      onChange={(event) =>
                        updateTrooper(index, {
                          aidCount: Math.min(
                            Number(event.target.value) || 0,
                            2,
                          ),
                          aid: Number(event.target.value) > 0,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={entry.stateCount ?? (entry.state ? 1 : 0)}
                      onChange={(event) =>
                        updateTrooper(index, {
                          stateCount: Math.min(
                            Number(event.target.value) || 0,
                            3,
                          ),
                          state: Number(event.target.value) > 0,
                        })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={entry.objective || ""}
                      onChange={(event) =>
                        updateTrooper(index, {
                          objective: event.target
                            .value as TrooperMissionResult["objective"],
                        })
                      }
                    >
                      <option value="">None</option>
                      <option value="attempt">Attempt</option>
                      <option value="success">Success</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={entry.tag || ""}
                      onChange={(event) =>
                        updateTrooper(index, {
                          tag: event.target
                            .value as TrooperMissionResult["tag"],
                        })
                      }
                    >
                      <option value="">None</option>
                      <option value="scan">Scan</option>
                      <option value="fo-scan">FO Scan</option>
                      <option value="tag">Tag and Bag</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(entry.alive)}
                      onChange={(event) =>
                        updateTrooper(index, { alive: event.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={entry.injury || ""}
                      onChange={(event) =>
                        updateTrooper(index, { injury: event.target.value })
                      }
                    >
                      {INJURY_OPTIONS.map((option) => (
                        <option value={option} key={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="radio"
                      name="pairing-mvp"
                      checked={Boolean(entry.mvp)}
                      onChange={() => setMvp(entry.trooper)}
                    />
                  </td>
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
              const assignedInducements = selections
                .filter((selection) => selection.trooperId === entry.trooper)
                .map(
                  (selection) =>
                    INDUCEMENT_OPTION_BY_ID.get(selection.optionId)?.label ||
                    "Unknown Benefit",
                );
              return (
                <li
                  key={entry.trooper}
                  className="pairing-force-item-with-note"
                >
                  <div>
                    <strong>{getTrooperName(trooper)}</strong>
                    {assignedInducements.length > 0 && (
                      <small>{assignedInducements.join(" | ")}</small>
                    )}
                  </div>
                  <span>{getTrooperPoints(trooper)} RN</span>
                </li>
              );
            })}
          </ul>
        </article>
        <article className="pairing-force-card">
          <span className="panel-kicker">Opponent Deployed Forces</span>
          <h3>{opposingCompany?.name || "Waiting on opponent"}</h3>
          <ul>
            {opposingResult.troopers.map((entry) => {
              const trooper = findTrooper(opposingCompany, entry.trooper);
              return (
                <li key={entry.trooper}>
                  {getTrooperName(trooper)}{" "}
                  <span>{getTrooperPoints(trooper)} RN</span>
                </li>
              );
            })}
            {opposingResult.troopers.length === 0 && (
              <li>No opposing deployment saved yet.</li>
            )}
          </ul>
        </article>
      </div>

      <div className="pairing-downtime-grid">
        <label className="field">
          <span>Downtime Event</span>
          <select
            value={result.downtime.event}
            onChange={(event) =>
              onChange({
                ...result,
                downtime: { ...result.downtime, event: event.target.value },
                submitted: false,
              })
            }
          >
            {DOWNTIME_EVENTS.map((option) => (
              <option value={option} key={option}>
                {option || "None"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Downtime Result</span>
          <select
            value={result.downtime.result}
            onChange={(event) =>
              onChange({
                ...result,
                downtime: { ...result.downtime, result: event.target.value },
                submitted: false,
              })
            }
          >
            {DOWNTIME_RESULTS.map((option) => (
              <option value={option} key={option}>
                {option || "Not rolled"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pairing-step-actions">
        <button className="command-button" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="command-button command-button--primary"
          type="button"
          onClick={onNext}
        >
          Review Results
        </button>
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  company,
  result,
  roundNumber,
}: {
  title: string;
  company: LocalCompany | null;
  result: PairingResult;
  roundNumber: number;
}) {
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
              <span>
                {calculateTrooperXp(entry, roundNumber, eliteDeployed)} XP
              </span>
            </div>
          );
        })}
      </div>
      <p>
        Downtime: {result.downtime.event || "None"}{" "}
        {result.downtime.result ? `(${result.downtime.result})` : ""}
      </p>
    </article>
  );
}

function SharedPairingWorkspace({
  fileId,
  roundId,
  pairingId,
  eventName,
  roundName,
  roundNumber,
  pairing,
  registeredCompanies,
  ownedSharedCompanyFileIds,
}: {
  fileId: string;
  roundId: string;
  pairingId: string;
  eventName: string;
  roundName: string;
  roundNumber: number;
  pairing: {
    player1FileId: string;
    player2FileId: string;
    player1Name: string;
    player2Name: string;
    mission?: string;
  };
  registeredCompanies?: Record<string, RegisteredCompanyRef>;
  ownedSharedCompanyFileIds: Set<string>;
}) {
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [step, setStep] = useState(0);
  const pairingKey = `${fileId}:${roundId}:${pairingId}`;
  const [players, setPlayers] = useState<
    Array<{
      side: "A" | "B";
      companyFileId: string;
      companyName: string;
      companyShareLink: string;
      companyEventFileId?: string;
      companyEventShareLink?: string;
      companyEventData?: any;
      ownsThisCompany: boolean;
      companyPayload?: SharedCompanyFilePayload;
    }>
  >([]);
  const [resultsBySide, setResultsBySide] = useState<
    Record<"A" | "B", PairingResult>
  >({
    A: defaultResult(pairing.player1FileId),
    B: defaultResult(pairing.player2FileId),
  });
  const [inducementsBySide, setInducementsBySide] = useState<
    Record<"A" | "B", PairingInducements>
  >({
    A: defaultInducements(),
    B: defaultInducements(),
  });

  function payloadToLocalCompany(
    payload: SharedCompanyFilePayload,
    fallbackName: string,
    fallbackId: string,
  ): LocalCompany {
    const company = payload?.company || {};
    return {
      id: String(company?.id || fallbackId),
      name: String(company?.name || fallbackName),
      companyTypeId: String(company?.companyTypeId || ""),
      sectorial1: company?.sectorial1 || null,
      sectorial2: company?.sectorial2 || null,
      credits: Number(company?.credits || 0),
      swc: Number(company?.swc || 0),
      notoriety: Number(company?.notoriety || 0),
      sponsor: String(company?.sponsor || ""),
      troopers: Array.isArray(company?.troopers) ? company.troopers : [],
      inventory: Array.isArray(company?.inventory) ? company.inventory : [],
      createdAt: String(company?.createdAt || new Date().toISOString()),
      updatedAt: String(company?.updatedAt || new Date().toISOString()),
      description: company?.description
        ? String(company.description)
        : undefined,
      shareFileId: fallbackId,
      shareLink: `${window.location.origin}/view?id=${encodeURIComponent(fallbackId)}`,
    };
  }

  function readSideResult(player: {
    side: "A" | "B";
    companyFileId: string;
    companyEventData?: any;
  }): PairingResult {
    const stored = player.companyEventData?.pairings?.[pairingKey];
    if (!stored || typeof stored !== "object") {
      return defaultResult(player.companyFileId);
    }

    return {
      participantId: String(stored.participantId || player.companyFileId),
      op: Number(stored.op || 0),
      won: Boolean(stored.won),
      downtime: {
        event: String(stored?.downtime?.event || ""),
        result: String(stored?.downtime?.result || ""),
      },
      troopers: Array.isArray(stored.troopers) ? stored.troopers : [],
      submitted: Boolean(stored.submitted || stored.status === "submitted"),
      updatedAt: String(stored.updatedAt || new Date().toISOString()),
    };
  }

  function readSideInducements(player: {
    side: "A" | "B";
    companyEventData?: any;
  }): PairingInducements {
    const stored = player.companyEventData?.pairings?.[pairingKey]?.inducements;
    if (!stored || typeof stored !== "object") {
      return defaultInducements();
    }

    const rawSelections = Array.isArray(stored.selections)
      ? stored.selections
      : [];
    return {
      selections: rawSelections
        .map((entry: any, index: number) => ({
          id: String(entry?.id || `${player.side}-${index}`),
          optionId: String(entry?.optionId || ""),
          trooperId: String(entry?.trooperId || ""),
        }))
        .filter((entry) => entry.optionId && entry.trooperId),
      updatedAt: String(stored.updatedAt || ""),
    };
  }

  const refreshSharedData = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) {
        setLoadingData(true);
      } else {
        setRefreshing(true);
      }
      setLoadError(null);

      try {
        const [companyA, companyB] = await Promise.all([
          readSharedFile(pairing.player1FileId),
          readSharedFile(pairing.player2FileId),
        ]);

        const normalized = [
          {
            side: "A" as const,
            companyFileId: pairing.player1FileId,
            companyName: String(
              (companyA as SharedCompanyFilePayload)?.company?.name ||
                pairing.player1Name,
            ),
            companyShareLink: `${window.location.origin}/view?id=${encodeURIComponent(pairing.player1FileId)}`,
            ...((ref) => ({
              companyEventFileId: ref.fileId,
              companyEventShareLink: ref.shareLink,
            }))(getCompanyEventFileRef(companyA as SharedCompanyFilePayload)),
            ownsThisCompany: ownedSharedCompanyFileIds.has(
              pairing.player1FileId,
            ),
            companyPayload: companyA as SharedCompanyFilePayload,
          },
          {
            side: "B" as const,
            companyFileId: pairing.player2FileId,
            companyName: String(
              (companyB as SharedCompanyFilePayload)?.company?.name ||
                pairing.player2Name,
            ),
            companyShareLink: `${window.location.origin}/view?id=${encodeURIComponent(pairing.player2FileId)}`,
            ...((ref) => ({
              companyEventFileId: ref.fileId,
              companyEventShareLink: ref.shareLink,
            }))(getCompanyEventFileRef(companyB as SharedCompanyFilePayload)),
            ownsThisCompany: ownedSharedCompanyFileIds.has(
              pairing.player2FileId,
            ),
            companyPayload: companyB as SharedCompanyFilePayload,
          },
        ].map((player) => {
          if (player.companyEventFileId) return player;
          const fallback = registeredCompanies?.[player.companyFileId];
          if (!fallback?.companyEventFileId) return player;
          return {
            ...player,
            companyEventFileId: fallback.companyEventFileId,
            companyEventShareLink:
              fallback.companyEventShareLink ||
              `${window.location.origin}/view?id=${encodeURIComponent(fallback.companyEventFileId)}`,
          };
        });

        const healed = await Promise.all(
          normalized.map(async (player) => {
            if (!player.ownsThisCompany || player.companyEventFileId)
              return player;

            try {
              const created = await ensureCompanyEventFileForOwnedCompany({
                companyFileId: player.companyFileId,
                companyPayload: player.companyPayload,
                companyName: player.companyName,
                eventFileId: fileId,
                eventName,
              });
              return {
                ...player,
                companyEventFileId: created.fileId,
                companyEventShareLink: created.shareLink,
              };
            } catch {
              return player;
            }
          }),
        );

        const withEventData = await Promise.all(
          healed.map(async (player) => {
            if (!player.companyEventFileId) return player;
            try {
              const companyEventData = await readSharedFile(
                player.companyEventFileId,
              );
              return { ...player, companyEventData };
            } catch {
              return player;
            }
          }),
        );

        setPlayers(withEventData);
        const ownedDefault = withEventData.find(
          (player) => player.ownsThisCompany,
        );
        setActiveSide((current) => {
          if (
            withEventData.some(
              (player) => player.side === current && player.ownsThisCompany,
            )
          )
            return current;
          return ownedDefault?.side || "A";
        });
        const sideA = withEventData.find((player) => player.side === "A");
        const sideB = withEventData.find((player) => player.side === "B");
        setResultsBySide({
          A: sideA
            ? readSideResult(sideA)
            : defaultResult(pairing.player1FileId),
          B: sideB
            ? readSideResult(sideB)
            : defaultResult(pairing.player2FileId),
        });
        setInducementsBySide({
          A: sideA ? readSideInducements(sideA) : defaultInducements(),
          B: sideB ? readSideInducements(sideB) : defaultInducements(),
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (showLoading) setLoadingData(false);
        else setRefreshing(false);
      }
    },
    [
      eventName,
      fileId,
      ownedSharedCompanyFileIds,
      pairing.player1FileId,
      pairing.player1Name,
      pairing.player2FileId,
      pairing.player2Name,
      pairingId,
      registeredCompanies,
      roundId,
    ],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!alive) return;
      await refreshSharedData(true);
    })();

    return () => {
      alive = false;
    };
  }, [refreshSharedData]);

  const playerA = players.find((player) => player.side === "A");
  const playerB = players.find((player) => player.side === "B");
  const activePlayer = players.find((player) => player.side === activeSide);
  const activeCompany = activePlayer?.companyPayload
    ? payloadToLocalCompany(
        activePlayer.companyPayload,
        activePlayer.companyName,
        activePlayer.companyFileId,
      )
    : null;
  const opposingCompany =
    activeSide === "A"
      ? playerB?.companyPayload
        ? payloadToLocalCompany(
            playerB.companyPayload,
            playerB.companyName,
            playerB.companyFileId,
          )
        : null
      : playerA?.companyPayload
        ? payloadToLocalCompany(
            playerA.companyPayload,
            playerA.companyName,
            playerA.companyFileId,
          )
        : null;
  const activeResult = resultsBySide[activeSide];
  const opposingResult = activeSide === "A" ? resultsBySide.B : resultsBySide.A;
  const activeInducements =
    inducementsBySide[activeSide] || defaultInducements();

  useEffect(() => {
    if (!activePlayer || !activeCompany) return;
    const captain = findCaptain(activeCompany);
    if (!captain || activeResult.troopers.length > 0) return;

    setResultsBySide((current) => ({
      ...current,
      [activeSide]: {
        ...current[activeSide],
        troopers: [
          {
            trooper: captain.id,
            aidCount: 0,
            stateCount: 0,
            objective: "",
            tag: "",
            alive: false,
            injury: "",
          },
        ],
        submitted: false,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, [
    activeCompany?.id,
    activePlayer?.companyFileId,
    activeResult.troopers.length,
    activeSide,
  ]);

  async function persistSharedResult(
    nextResult: PairingResult,
    submitted: boolean,
  ): Promise<boolean> {
    const owner = activePlayer;
    if (!owner) {
      setSaveError("Select one of your companies first.");
      return false;
    }
    if (!owner.ownsThisCompany) {
      setSaveError(
        "You can only write results to your own company event file.",
      );
      return false;
    }
    if (!owner.companyEventFileId) {
      setSaveError("This company is missing its company event file link.");
      return false;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const existing = await readSharedFile(owner.companyEventFileId);
      const pairings =
        typeof existing?.pairings === "object" && existing?.pairings
          ? existing.pairings
          : {};
      const pairingKey = `${fileId}:${roundId}:${pairingId}`;
      const now = new Date().toISOString();
      const ownerCompany = owner.companyPayload
        ? payloadToLocalCompany(
            owner.companyPayload,
            owner.companyName,
            owner.companyFileId,
          )
        : activeCompany;
      const troopersWithSnapshots = nextResult.troopers.map((entry) => ({
        ...entry,
        renownSnapshot: getTrooperPoints(
          findTrooper(ownerCompany, entry.trooper),
        ),
      }));

      const nextPayload = {
        ...existing,
        updatedAt: now,
        pairings: {
          ...pairings,
          [pairingKey]: {
            eventFileId: fileId,
            roundId,
            pairingId,
            mission: pairing.mission || null,
            side: owner.side,
            companyFileId: owner.companyFileId,
            ...nextResult,
            troopers: troopersWithSnapshots,
            inducements: {
              ...(inducementsBySide[owner.side] || defaultInducements()),
              updatedAt: now,
            },
            submitted,
            status: submitted ? "submitted" : "live",
            updatedAt: now,
          },
        },
      };

      await updateSharedFile(owner.companyEventFileId, nextPayload);
      setResultsBySide((current) => ({
        ...current,
        [owner.side]: {
          ...nextResult,
          submitted,
          updatedAt: now,
        },
      }));
      setSaveSuccess(
        submitted
          ? "Final result submitted to company event file."
          : "Live result saved to company event file.",
      );
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unknown error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleContinueToInducements() {
    const ok = await persistSharedResult(activeResult, false);
    if (!ok) return;
    await refreshSharedData(false);
    setStep(1);
  }

  async function handleContinueToMission() {
    const ok = await persistSharedResult(activeResult, false);
    if (ok) setStep(2);
  }

  function updateActiveDraft(nextResult: PairingResult) {
    setResultsBySide((current) => ({
      ...current,
      [activeSide]: {
        ...nextResult,
        submitted: false,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function updateActiveInducements(
    nextSelections: PairingInducementSelection[],
  ) {
    setInducementsBySide((current) => ({
      ...current,
      [activeSide]: {
        selections: nextSelections,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  return (
    <section className="company-manager pairing-manager">
      <div className="event-detail-header">
        <a
          className="icon-button"
          href={`/events/manage/?fileId=${encodeURIComponent(fileId)}`}
          aria-label="Back to event"
        >
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Shared Pairing</p>
          <h1>{pairing.mission || "Contract TBD"}</h1>
          <p>
            {roundName}: {pairing.player1Name} vs {pairing.player2Name}
          </p>
        </div>
      </div>

      <section className="company-section-card event-workspace-card">
        <div className="section-heading-row">
          <div>
            <span className="panel-kicker">Event</span>
            <h2>{eventName}</h2>
          </div>
        </div>
        <p className="legacy-empty-note">
          Both players can read each other's company and company-event files
          from here.
        </p>

        {loadingData && (
          <p className="legacy-empty-note">
            Loading company and event files...
          </p>
        )}
        {loadError && <p className="error-message">{loadError}</p>}

        {!loadingData && !loadError && (
          <>
            <div className="event-participant-list">
              {players.map((player) => (
                <article
                  className="event-participant-row"
                  key={player.companyFileId}
                >
                  <div>
                    <span className="panel-kicker">Player {player.side}</span>
                    <h3>{player.companyName}</h3>
                    <p>
                      {player.ownsThisCompany ? "Owned by you" : "Opponent"}
                    </p>
                  </div>
                  <a
                    className="command-button command-button--small"
                    href={player.companyShareLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Company File
                  </a>
                  {player.companyEventFileId ? (
                    <a
                      className="command-button command-button--small"
                      href={
                        player.companyEventShareLink ||
                        `${window.location.origin}/view?id=${encodeURIComponent(player.companyEventFileId)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Company Event File
                    </a>
                  ) : (
                    <button
                      className="command-button command-button--small"
                      type="button"
                      disabled
                    >
                      Missing Event File
                    </button>
                  )}
                </article>
              ))}
            </div>

            <div className="pairing-player-switch">
              {[playerA, playerB].filter(Boolean).map((player) => (
                <button
                  className={player?.side === activeSide ? "is-active" : ""}
                  type="button"
                  key={player?.companyFileId}
                  onClick={() => {
                    setActiveSide(player?.side || "A");
                    setStep(0);
                  }}
                  disabled={!player?.ownsThisCompany || saving}
                >
                  <span>
                    {player?.ownsThisCompany ? "Owned by you" : "Opponent"}
                  </span>
                  <strong>{player?.companyName}</strong>
                </button>
              ))}
            </div>

            <div className="pairing-stepper" aria-label="Pairing steps">
              {[
                "Deploy Troopers",
                "Inducements",
                "Mission",
                "Post Mission",
              ].map((label, index) => (
                <button
                  className={step === index ? "is-active" : ""}
                  type="button"
                  key={label}
                  onClick={() => setStep(index)}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <DeploymentStep
                company={activeCompany}
                result={activeResult}
                onChange={updateActiveDraft}
                nextLabel="Continue to Inducements"
                onNext={() => void handleContinueToInducements()}
              />
            )}
            {step === 1 && (
              <InducementsStep
                company={activeCompany}
                opposingCompany={opposingCompany}
                result={activeResult}
                opposingResult={opposingResult}
                selections={activeInducements.selections}
                onChangeSelections={updateActiveInducements}
                onRefresh={() => void refreshSharedData(false)}
                refreshing={refreshing}
                saving={saving}
                onBack={() => setStep(0)}
                onNext={() => void handleContinueToMission()}
              />
            )}
            {step === 2 && (
              <MissionStep
                company={activeCompany}
                opposingCompany={opposingCompany}
                result={activeResult}
                opposingResult={opposingResult}
                inducementSelections={activeInducements.selections}
                roundNumber={roundNumber || 1}
                onChange={updateActiveDraft}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <section className="pairing-panel">
                <div className="section-heading-row">
                  <div>
                    <span className="panel-kicker">Post Mission</span>
                    <h2>Review Results</h2>
                  </div>
                  <div className="pairing-step-actions">
                    <button
                      className="command-button"
                      type="button"
                      onClick={() =>
                        void persistSharedResult(activeResult, false)
                      }
                      disabled={saving || !activePlayer?.ownsThisCompany}
                    >
                      Save Live Update
                    </button>
                    <button
                      className="command-button command-button--primary"
                      type="button"
                      onClick={() =>
                        void persistSharedResult(activeResult, true)
                      }
                      disabled={saving || !activePlayer?.ownsThisCompany}
                    >
                      Submit {activePlayer?.companyName || "Result"}
                    </button>
                  </div>
                </div>
                <div className="pairing-summary-grid">
                  <SummaryCard
                    title="Player A"
                    company={
                      playerA?.companyPayload
                        ? payloadToLocalCompany(
                            playerA.companyPayload,
                            playerA.companyName,
                            playerA.companyFileId,
                          )
                        : null
                    }
                    result={resultsBySide.A}
                    roundNumber={roundNumber || 1}
                  />
                  <SummaryCard
                    title="Player B"
                    company={
                      playerB?.companyPayload
                        ? payloadToLocalCompany(
                            playerB.companyPayload,
                            playerB.companyName,
                            playerB.companyFileId,
                          )
                        : null
                    }
                    result={resultsBySide.B}
                    roundNumber={roundNumber || 1}
                  />
                </div>
                {saveError && <p className="error-message">{saveError}</p>}
                {saveSuccess && <p className="info-message">{saveSuccess}</p>}
              </section>
            )}
          </>
        )}
      </section>
    </section>
  );
}

function PairingWorkspace({
  context,
  companies,
}: {
  context: PairingContext;
  companies: LocalCompany[];
}) {
  const allowedParticipantIds = [
    context.pairing.player1Id,
    context.pairing.player2Id,
  ].filter((participantId) => {
    const participant = getParticipant(context.event, participantId);
    if (!participant) return false;
    return companies.some((company) => company.id === participant.companyId);
  });
  const [activeParticipantId, setActiveParticipantId] = useState(
    allowedParticipantIds[0] || context.pairing.player1Id,
  );
  const [step, setStep] = useState(0);
  const [contextState, setContextState] = useState(context);
  const participantA = getParticipant(
    contextState.event,
    contextState.pairing.player1Id,
  );
  const participantB = getParticipant(
    contextState.event,
    contextState.pairing.player2Id,
  );
  const activeParticipant = getParticipant(
    contextState.event,
    activeParticipantId,
  );
  const activeCompany = getCompany(companies, activeParticipant);
  const companyA = getCompany(companies, participantA);
  const companyB = getCompany(companies, participantB);
  const activeResult = getResult(contextState.pairing, activeParticipantId);
  const resultA = getResult(
    contextState.pairing,
    contextState.pairing.player1Id,
  );
  const resultB = getResult(
    contextState.pairing,
    contextState.pairing.player2Id,
  );
  const contractName =
    contextState.pairing.mission ||
    contextState.round.mission ||
    "Contract TBD";

  useEffect(() => {
    if (!allowedParticipantIds.includes(activeParticipantId)) {
      setActiveParticipantId(
        allowedParticipantIds[0] || contextState.pairing.player1Id,
      );
    }
  }, [
    activeParticipantId,
    allowedParticipantIds,
    contextState.pairing.player1Id,
  ]);

  function refreshFromEvent(updatedEvent: LocalEvent) {
    const round = updatedEvent.rounds.find(
      (entry) => entry.id === contextState.round.id,
    );
    const pairing = round?.pairings.find(
      (entry) => entry.id === contextState.pairing.id,
    );
    if (round && pairing)
      setContextState({ event: updatedEvent, round, pairing });
  }

  function saveResult(nextResult: PairingResult) {
    const updatedEvent = upsertPairingResult(
      contextState.event.id,
      contextState.round.id,
      contextState.pairing.id,
      nextResult,
    );
    if (updatedEvent) refreshFromEvent(updatedEvent);
  }

  function updateDraft(nextResult: PairingResult) {
    saveResult({
      ...nextResult,
      submitted: false,
      updatedAt: new Date().toISOString(),
    });
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
          injury: "",
        },
      ],
      submitted: false,
      updatedAt: new Date().toISOString(),
    });
  }, [activeCompany?.id, activeParticipantId]);

  function submitResult() {
    saveResult({
      ...activeResult,
      submitted: true,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="company-manager pairing-manager">
      <div className="event-detail-header">
        <a
          className="icon-button"
          href={`/events/manage/?id=${encodeURIComponent(contextState.event.id)}`}
          aria-label="Back to event"
        >
          <AppIcon name="back" />
        </a>
        <div>
          <p className="eyebrow">Pairing</p>
          <h1>{contractName}</h1>
          <p>
            {contextState.round.name}: {participantA?.companyName || "Player A"}{" "}
            vs {participantB?.companyName || "Player B"}
          </p>
        </div>
      </div>

      <div className="pairing-player-switch">
        {[participantA, participantB].filter(Boolean).map((participant) => (
          <button
            className={
              participant?.id === activeParticipantId ? "is-active" : ""
            }
            type="button"
            key={participant?.id}
            onClick={() => {
              setActiveParticipantId(participant?.id || "");
              setStep(0);
            }}
            disabled={
              !participant?.id ||
              !allowedParticipantIds.includes(participant.id)
            }
          >
            <span>{participant?.userName}</span>
            <strong>{participant?.companyName}</strong>
          </button>
        ))}
      </div>

      <div className="pairing-stepper" aria-label="Pairing steps">
        {["Deploy Troopers", "Mission", "Post Mission"].map((label, index) => (
          <button
            className={step === index ? "is-active" : ""}
            type="button"
            key={label}
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <DeploymentStep
          company={activeCompany}
          result={activeResult}
          onChange={updateDraft}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <MissionStep
          company={activeCompany}
          opposingCompany={
            activeParticipantId === contextState.pairing.player1Id
              ? companyB
              : companyA
          }
          result={activeResult}
          opposingResult={
            activeParticipantId === contextState.pairing.player1Id
              ? resultB
              : resultA
          }
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
            <button
              className="command-button command-button--primary"
              type="button"
              onClick={submitResult}
            >
              Submit {activeParticipant?.companyName || "Result"}
            </button>
          </div>
          <div className="pairing-summary-grid">
            <SummaryCard
              title="Player A"
              company={companyA}
              result={resultA}
              roundNumber={contextState.round.number}
            />
            <SummaryCard
              title="Player B"
              company={companyB}
              result={resultB}
              roundNumber={contextState.round.number}
            />
          </div>
          <p className="legacy-specops-note">
            This saves pairing results locally. Applying XP, CR, injuries, and
            downtime effects to company files will be the next pass.
          </p>
        </section>
      )}
    </section>
  );
}

export default function PairingManager() {
  const [context, setContext] = useState<PairingContext | null>(null);
  const [sharedContext, setSharedContext] = useState<{
    fileId: string;
    roundId: string;
    pairingId: string;
    eventName: string;
    roundName: string;
    roundNumber: number;
    pairing: {
      player1FileId: string;
      player2FileId: string;
      player1Name: string;
      player2Name: string;
      mission?: string;
    };
    registeredCompanies?: Record<string, RegisteredCompanyRef>;
  } | null>(null);
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [ownedSharedCompanyFileIds, setOwnedSharedCompanyFileIds] = useState<
    Set<string>
  >(new Set());
  const [signedIn, setSignedIn] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);

  useEffect(() => {
    setCompanies(loadLocalCompanies());
  }, []);

  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    const fileId = getQueryParam("fileId");
    if (!fileId) return;
    if (!signedIn) return;

    let alive = true;
    setLoadingShared(true);
    setSharedError(null);

    const roundId = getQueryParam("roundId");
    const pairingId = getQueryParam("pairingId");

    readSharedFile(fileId)
      .then((payload) => {
        if (!alive) return;
        if (payload?.kind !== "infinity-mercenaries-event") {
          throw new Error("This shared file is not an event file.");
        }

        const rounds = Array.isArray(payload?.rounds) ? payload.rounds : [];
        const round = rounds.find((entry: any) => entry?.id === roundId);
        const pairing = Array.isArray(round?.pairings)
          ? round.pairings.find((entry: any) => entry?.id === pairingId)
          : null;
        if (!round || !pairing) {
          throw new Error("Shared pairing not found.");
        }

        setSharedContext({
          fileId,
          roundId,
          pairingId,
          eventName: String(payload?.event?.name || "Shared Event"),
          roundName: String(round?.name || "Round"),
          roundNumber: Number(round?.number || 1),
          pairing: {
            player1FileId: String(pairing?.player1FileId || ""),
            player2FileId: String(pairing?.player2FileId || ""),
            player1Name: String(pairing?.player1Name || "Player A"),
            player2Name: String(pairing?.player2Name || "Player B"),
            mission: String(pairing?.mission || "") || undefined,
          },
          registeredCompanies: Array.isArray(
            (payload as any)?.registeredCompanies,
          )
            ? (payload as any).registeredCompanies.reduce(
                (acc: Record<string, RegisteredCompanyRef>, entry: any) => {
                  const companyFileId =
                    extractFileId(String(entry?.fileId || "")) ||
                    extractFileId(String(entry?.shareLink || "")) ||
                    String(entry?.fileId || "").trim();
                  if (!companyFileId) return acc;

                  const companyEventFileId =
                    extractFileId(String(entry?.companyEventFileId || "")) ||
                    extractFileId(String(entry?.companyEventShareLink || "")) ||
                    extractFileId(
                      String(entry?.companyEventFile?.fileId || ""),
                    ) ||
                    extractFileId(
                      String(entry?.companyEventFile?.shareLink || ""),
                    ) ||
                    extractFileId(String(entry?.companyEventFile?.link || ""));
                  if (!companyEventFileId) return acc;

                  acc[companyFileId] = {
                    companyEventFileId,
                    companyEventShareLink: String(
                      entry?.companyEventShareLink ||
                        entry?.companyEventFile?.shareLink ||
                        entry?.companyEventFile?.link ||
                        `${window.location.origin}/view?id=${encodeURIComponent(companyEventFileId)}`,
                    ),
                  };
                  return acc;
                },
                {},
              )
            : undefined,
        });
      })
      .catch((error) => {
        if (!alive) return;
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
  }, [signedIn]);

  useEffect(() => {
    const fileId = getQueryParam("fileId");
    if (fileId) return;

    const eventId = getQueryParam("eventId");
    const roundId = getQueryParam("roundId");
    const pairingId = getQueryParam("pairingId");
    const loaded = getEventRoundPairing(eventId, roundId, pairingId);
    if (loaded.event && loaded.round && loaded.pairing) {
      setContext({
        event: loaded.event,
        round: loaded.round,
        pairing: loaded.pairing,
      });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const owned = new Set<string>();

      for (const company of companies) {
        if (company.shareFileId) owned.add(company.shareFileId);
        if (company.shareLink) {
          const parsed = extractFileId(company.shareLink);
          if (parsed) owned.add(parsed);
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

      if (alive) setOwnedSharedCompanyFileIds(owned);
    })();

    return () => {
      alive = false;
    };
  }, [companies, signedIn]);

  if (getQueryParam("fileId") && !signedIn) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Google Sign-In Required</span>
          <h1>Sign In to Open Pairing</h1>
          <p>Use the Google button in the nav bar, then reopen this pairing.</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  if (getQueryParam("fileId") && loadingShared) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Shared Pairing</span>
          <h1>Loading Pairing</h1>
          <p>Fetching shared event pairing details...</p>
        </div>
      </section>
    );
  }

  if (getQueryParam("fileId") && sharedError) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Shared Pairing</span>
          <h1>Could Not Load Pairing</h1>
          <p>{sharedError}</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  if (sharedContext) {
    const canAccess =
      ownedSharedCompanyFileIds.has(sharedContext.pairing.player1FileId) ||
      ownedSharedCompanyFileIds.has(sharedContext.pairing.player2FileId);

    if (!canAccess) {
      return (
        <section className="company-manager pairing-manager">
          <div className="company-empty-state">
            <span className="panel-kicker">Access Denied</span>
            <h1>You Do Not Own This Pairing</h1>
            <p>
              You can only open pairings where one of your company files is in
              the matchup.
            </p>
            <a
              className="command-button command-button--primary"
              href={`/events/manage/?fileId=${encodeURIComponent(sharedContext.fileId)}`}
            >
              Back to Event
            </a>
          </div>
        </section>
      );
    }

    return (
      <SharedPairingWorkspace
        fileId={sharedContext.fileId}
        roundId={sharedContext.roundId}
        pairingId={sharedContext.pairingId}
        eventName={sharedContext.eventName}
        roundName={sharedContext.roundName}
        roundNumber={sharedContext.roundNumber}
        pairing={sharedContext.pairing}
        registeredCompanies={sharedContext.registeredCompanies}
        ownedSharedCompanyFileIds={ownedSharedCompanyFileIds}
      />
    );
  }

  const allowedParticipantIds = context
    ? [context.pairing.player1Id, context.pairing.player2Id].filter(
        (participantId) => {
          const participant = getParticipant(context.event, participantId);
          if (!participant) return false;
          return companies.some(
            (company) => company.id === participant.companyId,
          );
        },
      )
    : [];

  if (!context) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Missing Pairing</span>
          <h1>Pairing Not Found</h1>
          <p>This local event pairing could not be loaded.</p>
          <a className="command-button command-button--primary" href="/events/">
            Back to Events
          </a>
        </div>
      </section>
    );
  }

  if (allowedParticipantIds.length === 0) {
    return (
      <section className="company-manager pairing-manager">
        <div className="company-empty-state">
          <span className="panel-kicker">Access Denied</span>
          <h1>You Do Not Own This Pairing</h1>
          <p>
            You can only open pairings where one of your local companies is in
            the matchup.
          </p>
          <a
            className="command-button command-button--primary"
            href={`/events/manage/?id=${encodeURIComponent(context.event.id)}`}
          >
            Back to Event
          </a>
        </div>
      </section>
    );
  }

  return <PairingWorkspace context={context} companies={companies} />;
}
