import {
  applyItemToTrooper,
  renderCombinedDetails,
} from "../lib/mercs/trooperUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadRecruitmentPool } from "../lib/mercs/recruitment";
import { mapItemData } from "../lib/mercs/metadata";
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
  type PairingDowntimeResult,
  type PairingResult,
  type TrooperMissionResult,
} from "../lib/mercs/eventStore";
import {
  loadLocalCompanies,
  type LocalCompany,
} from "../lib/mercs/companyStore";
import {
  contractHrefFromValue,
  contractTitleFromValue,
} from "../data/contracts";
import {
  DOWNTIME_EVENTS,
  describeDowntimeOutcomeLabel,
  getDowntimeActiveTraits,
  getDowntimeChoiceById,
  getDowntimeEffectSummary,
  getDowntimeEventById,
  getDowntimeTraitTooltip,
  isDowntimeParticipantTrait,
  isDowntimeResolutionTrait,
  type DowntimeOutcome,
} from "../data/downtime";
import {
  INDUCEMENT_HIRE_MAPPINGS,
  INDUCEMENT_WEAPON_MAPPINGS,
} from "../data/inducementMappings";
import { AppIcon } from "./AppIcon";
import UnifiedProfileCard, { UnitProfileDisplay } from "./UnifiedProfileCard";
import { npcGroups, type NpcProfile } from "../data/npcs";

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

type InducementTargetType = "trooper" | "company" | "hire";

type PairingInducementSelection = {
  id: string;
  optionId: string;
  targetType: InducementTargetType;
  targetId: string;
};

type PairingInducements = {
  selections: PairingInducementSelection[];
  updatedAt: string;
};

type InducementCategory =
  | "troops"
  | "command"
  | "primary"
  | "secondary"
  | "equipment";

type InducementOption = {
  id: string;
  label: string;
  category: InducementCategory;
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

const INDUCEMENT_CATEGORY_LABEL: Record<InducementCategory, string> = {
  troops: "Troops for Hire",
  command: "Command Tokens",
  primary: "Rented Primary Weapons",
  secondary: "Rented Secondary Weapons",
  equipment: "Rented Utility Equipment",
};

function getInducementTargetType(
  option: InducementOption,
): InducementTargetType {
  if (option.category === "command") return "company";
  if (option.category === "troops") return "hire";
  return "trooper";
}

function getInducementTargetLabel(targetType: InducementTargetType): string {
  if (targetType === "company") return "Company";
  if (targetType === "hire") return "Temporary Hire";
  return "Assigned Trooper";
}

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

function defaultDowntimeResult(): PairingDowntimeResult {
  return {
    roll: null,
    eventId: "",
    choiceId: "",
    participantTrooperId: "",
    beneficiaryTrooperId: "",
    opponentBeneficiaryTrooperId: "",
    spentCr: 0,
    outcome: "",
    notes: "",
  };
}

function normalizeDowntimeResult(raw: any): PairingDowntimeResult {
  const next = defaultDowntimeResult();
  if (!raw || typeof raw !== "object") return next;

  const legacyEvent = String(raw.event || "").trim();
  const legacyResult = String(raw.result || "")
    .trim()
    .toLowerCase();
  const matchedLegacyEvent = DOWNTIME_EVENTS.find(
    (event) => event.event.toLowerCase() === legacyEvent.toLowerCase(),
  );

  return {
    roll:
      raw.roll === null || raw.roll === undefined
        ? null
        : Number(raw.roll) || null,
    eventId: String(raw.eventId || matchedLegacyEvent?.id || ""),
    choiceId: String(raw.choiceId || ""),
    participantTrooperId: String(raw.participantTrooperId || ""),
    beneficiaryTrooperId: String(raw.beneficiaryTrooperId || ""),
    opponentBeneficiaryTrooperId: String(
      raw.opponentBeneficiaryTrooperId || "",
    ),
    spentCr: Math.max(0, Number(raw.spentCr || 0) || 0),
    outcome:
      raw.outcome === "failure" ||
      raw.outcome === "pass" ||
      raw.outcome === "critical-pass"
        ? raw.outcome
        : legacyResult === "failure"
          ? "failure"
          : legacyResult === "success"
            ? "pass"
            : legacyResult === "critical success"
              ? "critical-pass"
              : "",
    notes: String(raw.notes || ""),
  };
}

function defaultResult(participantId: string): PairingResult {
  return {
    participantId,
    op: 0,
    won: false,
    downtime: defaultDowntimeResult(),
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

function getContractHref(contractName?: string): string | null {
  return contractHrefFromValue(contractName);
}

function getContractNpcProfiles(contractName?: string): NpcProfile[] {
  const target = contractTitleFromValue(contractName).trim().toLowerCase();
  if (!target) return [];

  return npcGroups.flatMap((group) =>
    (group.profiles || []).filter((profile) =>
      (profile.contracts || []).some(
        (name) => String(name).trim().toLowerCase() === target,
      ),
    ),
  );
}

/** Loads unit profile data for each unique hire inducement option ID. */
function useHireProfilesByOptionIds(optionIds: string[]): Map<string, any> {
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const optionIdsKey = optionIds.join("|");

  const uniqueOptionIds = useMemo(
    () => [...new Set(optionIds.filter(Boolean))],
    [optionIdsKey],
  );

  useEffect(() => {
    if (!uniqueOptionIds.length) {
      setProfiles(new Map());
      return;
    }
    let alive = true;
    Promise.all(
      uniqueOptionIds.map(async (optionId) => {
        const mapping = INDUCEMENT_HIRE_MAPPINGS[optionId];
        if (!mapping) return null;
        try {
          const { units } = await loadRecruitmentPool([mapping.factionSlug]);
          const unit = (units || []).find((u: any) => u.id === mapping.unitId);
          return {
            optionId,
            unit: unit || null,
            displayName: mapping.displayName,
          };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!alive) return;
      const map = new Map<string, any>();
      results.forEach((r) => {
        if (r) map.set(r.optionId, r);
      });
      setProfiles(map);
    });
    return () => {
      alive = false;
    };
  }, [uniqueOptionIds]);

  return profiles;
}

/** Loads unit profile data for each unique hire inducement selection. */
function useHireProfiles(
  hireSelections: PairingInducementSelection[],
): Map<string, any> {
  const optionIds = useMemo(
    () => hireSelections.map((selection) => selection.optionId),
    [hireSelections],
  );
  return useHireProfilesByOptionIds(optionIds);
}

function makeHireProfileTargetId(
  optionId: string,
  groupId: string | number,
  profileOptionId: string | number,
): string {
  return `hire:${encodeURIComponent(optionId)}:${encodeURIComponent(String(groupId))}:${encodeURIComponent(String(profileOptionId))}`;
}

function parseHireProfileTargetId(targetId: string): {
  optionId: string;
  groupId: string;
  profileOptionId: string;
  groupIndex?: number;
  optionIndex?: number;
} | null {
  const raw = String(targetId || "");
  const parts = raw.split(":");
  if (parts.length !== 4 || parts[0] !== "hire") return null;
  let optionId = "";
  let groupId = "";
  let profileOptionId = "";
  try {
    optionId = decodeURIComponent(parts[1]);
    groupId = decodeURIComponent(parts[2]);
    profileOptionId = decodeURIComponent(parts[3]);
  } catch {
    return null;
  }
  const parsed: {
    optionId: string;
    groupId: string;
    profileOptionId: string;
    groupIndex?: number;
    optionIndex?: number;
  } = {
    optionId,
    groupId,
    profileOptionId,
  };
  if (/^\d+$/.test(groupId)) parsed.groupIndex = Number(groupId);
  if (/^\d+$/.test(profileOptionId))
    parsed.optionIndex = Number(profileOptionId);
  return parsed;
}

function getHireConstraintTokens(optionLabel: string): string[] {
  const match = String(optionLabel || "").match(/\(([^)]+)\)/);
  if (!match) return [];
  const raw = String(match[1] || "").trim();
  if (!raw || /^any\b/i.test(raw)) return [];
  return raw
    .replace(/\+/g, " or ")
    .split(/\bor\b|\band\b|,|\//i)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !/^immunity\b/i.test(token));
}

function getHireProfileChoices(
  option: InducementOption,
  unit: any,
): Array<{
  targetId: string;
  label: string;
  groupIndex: number;
  optionIndex: number;
  groupId: string | number;
  profileOptionId: string | number;
}> {
  const groups = Array.isArray(unit?.profileGroups) ? unit.profileGroups : [];
  const constraints = getHireConstraintTokens(option.label).map((entry) =>
    entry.toLowerCase(),
  );
  const matchesConstraint = (value: string) => {
    if (!constraints.length) return true;
    const lower = String(value || "").toLowerCase();
    return constraints.some((token) => lower.includes(token));
  };

  const allChoices = groups.flatMap((group: any, groupIndex: number) =>
    (Array.isArray(group?.options) ? group.options : []).map(
      (groupOption: any, optionIndex: number) => {
        const label = String(
          groupOption?.name ||
            group?.isc ||
            unit?.isc ||
            unit?.name ||
            "Profile",
        );
        const groupId = group?.id ?? groupIndex;
        const profileOptionId = groupOption?.id ?? optionIndex;
        return {
          targetId: makeHireProfileTargetId(
            option.id,
            groupId,
            profileOptionId,
          ),
          label,
          groupIndex,
          optionIndex,
          groupId,
          profileOptionId,
        };
      },
    ),
  );

  const filtered = allChoices.filter((choice) =>
    matchesConstraint(choice.label),
  );
  return filtered.length ? filtered : allChoices;
}

function getRenderableHireProfileGroups(
  option: InducementOption,
  unit: any,
): any[] {
  const choices = getHireProfileChoices(option, unit);
  const allowedTargets = new Set(choices.map((choice) => choice.targetId));
  const groups = Array.isArray(unit?.profileGroups) ? unit.profileGroups : [];

  return groups
    .map((group: any, groupIndex: number) => {
      const options = Array.isArray(group?.options) ? group.options : [];
      const profiles = Array.isArray(group?.profiles) ? group.profiles : [];

      const selectedEntries = options
        .map((profileOption: any, optionIndex: number) => {
          const groupId = group?.id ?? groupIndex;
          const profileOptionId = profileOption?.id ?? optionIndex;
          const targetId = makeHireProfileTargetId(
            option.id,
            groupId,
            profileOptionId,
          );
          if (!allowedTargets.has(targetId)) return null;
          return { profileOption, optionIndex };
        })
        .filter(Boolean) as Array<{ profileOption: any; optionIndex: number }>;

      if (!selectedEntries.length) return null;

      const nextOptions = selectedEntries.map((entry) => ({
        ...entry.profileOption,
        disabled: false,
      }));
      const nextProfiles = selectedEntries
        .map((entry) => profiles[entry.optionIndex])
        .filter(Boolean);

      // Keep options/profiles paired by index for UnitProfileDisplay rows.
      if (!nextProfiles.length) return null;

      return {
        ...structuredClone(group),
        options: nextOptions,
        profiles: nextProfiles,
      };
    })
    .filter(Boolean);
}

function resolveHireTargetIdFromSelection(
  option: InducementOption,
  unit: any,
  group: any,
  profileOption: any,
): string | null {
  const groups = Array.isArray(unit?.profileGroups) ? unit.profileGroups : [];
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const sourceGroup = groups[groupIndex];
    const sourceOptions = Array.isArray(sourceGroup?.options)
      ? sourceGroup.options
      : [];
    for (
      let optionIndex = 0;
      optionIndex < sourceOptions.length;
      optionIndex += 1
    ) {
      const sourceOption = sourceOptions[optionIndex];
      const groupId = sourceGroup?.id ?? groupIndex;
      const profileOptionId = sourceOption?.id ?? optionIndex;

      const sameGroup =
        String(sourceGroup?.id ?? "") === String(group?.id ?? "") ||
        String(sourceGroup?.isc ?? "") === String(group?.isc ?? "");
      const sameOption =
        String(sourceOption?.id ?? "") === String(profileOption?.id ?? "") ||
        String(sourceOption?.name ?? "") === String(profileOption?.name ?? "");

      if (sameGroup && sameOption) {
        return makeHireProfileTargetId(option.id, groupId, profileOptionId);
      }
    }
  }
  return null;
}

function getSelectedHireDisplayData(
  selection: PairingInducementSelection,
  unit: any,
): { unit: any; profileGroups: any[]; profileLabel: string } | null {
  const option = INDUCEMENT_OPTION_BY_ID.get(selection.optionId);
  if (!option || !unit) return null;

  const choices = getHireProfileChoices(option, unit);
  if (!choices.length) return null;

  const parsed = parseHireProfileTargetId(selection.targetId);
  const selectedChoice =
    choices.find((choice) => choice.targetId === selection.targetId) ||
    (parsed && parsed.optionId === selection.optionId
      ? choices.find(
          (choice) =>
            String(choice.groupId) === parsed.groupId &&
            String(choice.profileOptionId) === parsed.profileOptionId,
        ) ||
        choices.find(
          (choice) =>
            parsed.groupIndex === choice.groupIndex &&
            parsed.optionIndex === choice.optionIndex,
        )
      : null) ||
    choices[0];

  const groups = Array.isArray(unit.profileGroups) ? unit.profileGroups : [];
  const sourceGroup = groups[selectedChoice.groupIndex];
  if (!sourceGroup) return null;

  const groupClone = structuredClone(sourceGroup);
  const options = Array.isArray(groupClone.options) ? groupClone.options : [];
  const profiles = Array.isArray(groupClone.profiles)
    ? groupClone.profiles
    : [];

  if (options[selectedChoice.optionIndex]) {
    groupClone.options = [options[selectedChoice.optionIndex]];
  }
  if (profiles.length > 1) {
    const profileIndex = Math.min(
      selectedChoice.optionIndex,
      profiles.length - 1,
    );
    groupClone.profiles = [profiles[profileIndex]];
  }

  const unitClone = structuredClone(unit);
  unitClone.isc = selectedChoice.label || unitClone.isc;

  return {
    unit: unitClone,
    profileGroups: [groupClone],
    profileLabel: selectedChoice.label,
  };
}

/** Injects rented weapon/equip metadata into a trooper profile clone. */
function applyInducementEquipment(
  trooper: any,
  rentals: PairingInducementSelection[],
): any {
  let result = structuredClone(trooper);
  for (const sel of rentals) {
    const mapping = INDUCEMENT_WEAPON_MAPPINGS[sel.optionId];
    if (!mapping) continue;
    result = applyItemToTrooper(
      result,
      { id: mapping.metadataId },
      mapping.collectionKey,
    );
  }
  return result;
}

function getMissionTroopers(
  company: LocalCompany | null,
  result: PairingResult,
): any[] {
  return (result.troopers || [])
    .map((entry) => findTrooper(company, entry.trooper))
    .filter(Boolean);
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
  hireSelections,
}: {
  company: LocalCompany | null;
  result: PairingResult;
  onChange: (result: PairingResult) => void;
  onNext: () => void;
  nextLabel?: string;
  hireSelections?: PairingInducementSelection[];
}) {
  const hireProfiles = useHireProfiles(hireSelections || []);
  const [expandedHires, setExpandedHires] = useState<Record<string, boolean>>(
    {},
  );
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
          {result.troopers.length === 0 &&
            (hireSelections || []).length === 0 && (
              <p className="empty-note">No troopers deployed yet.</p>
            )}
          {(hireSelections || []).map((sel) => {
            const profileEntry = hireProfiles.get(sel.optionId);
            const isExpanded = expandedHires[sel.id] || false;
            if (profileEntry?.unit) {
              const selected = getSelectedHireDisplayData(
                sel,
                profileEntry.unit,
              );
              if (selected) {
                return (
                  <article key={sel.id} className="legacy-trooper-card">
                    <p className="pairing-hire-subtitle">Temporary Hire</p>
                    <UnitProfileDisplay
                      unit={selected.unit}
                      profileGroups={selected.profileGroups}
                      collapsible
                      expanded={isExpanded}
                      onToggle={() =>
                        setExpandedHires((prev) => ({
                          ...prev,
                          [sel.id]: !prev[sel.id],
                        }))
                      }
                    />
                  </article>
                );
              }
            }
            const option = INDUCEMENT_OPTION_BY_ID.get(sel.optionId);
            return (
              <div
                className="pairing-trooper-row pairing-trooper-row--hire"
                key={sel.id}
              >
                <span>
                  <strong>
                    {profileEntry?.displayName ||
                      option?.label ||
                      "Hired Trooper"}
                  </strong>
                  <small>Temporary Hire · Loading profile...</small>
                </span>
              </div>
            );
          })}
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
  const hasBudget = inducementBudget > 0;
  const deployedTroopers = result.troopers
    .map((entry) => findTrooper(company, entry.trooper))
    .filter(Boolean);
  const deployedTrooperIds = new Set(
    result.troopers.map((entry) => entry.trooper),
  );
  const opposingDeployed = opposingResult.troopers
    .map((entry) => findTrooper(opposingCompany, entry.trooper))
    .filter(Boolean);
  const bothDeployed =
    result.troopers.length > 0 && opposingResult.troopers.length > 0;

  const normalizedSelections = selections.filter((selection) => {
    const option = INDUCEMENT_OPTION_BY_ID.get(selection.optionId);
    if (!option) return false;

    if (selection.targetType === "trooper") {
      return (
        Boolean(selection.targetId) &&
        deployedTrooperIds.has(selection.targetId)
      );
    }

    return true;
  });

  const spent = normalizedSelections.reduce(
    (total, selection) =>
      total +
      Number(INDUCEMENT_OPTION_BY_ID.get(selection.optionId)?.cost || 0),
    0,
  );
  const remaining = inducementBudget - spent;

  const countByOption = normalizedSelections.reduce<Record<string, number>>(
    (acc, selection) => {
      acc[selection.optionId] = (acc[selection.optionId] || 0) + 1;
      return acc;
    },
    {},
  );

  const companySelections = normalizedSelections.filter(
    (selection) => selection.targetType === "company",
  );
  const hiredTroopSelections = normalizedSelections.filter(
    (selection) => selection.targetType === "hire",
  );
  const trooperSelections = normalizedSelections.filter(
    (selection) => selection.targetType === "trooper",
  );
  const troopOptions = useMemo(
    () => INDUCEMENT_OPTIONS.filter((option) => option.category === "troops"),
    [],
  );
  const troopProfiles = useHireProfilesByOptionIds(
    troopOptions.map((option) => option.id),
  );

  function canAddOption(option: InducementOption): boolean {
    const currentCount = countByOption[option.id] || 0;
    if (option.maxCount && currentCount >= option.maxCount) return false;
    return remaining >= option.cost;
  }

  function addSelection(option: InducementOption, targetIdOverride?: string) {
    if (!canAddOption(option)) return;

    const targetType = getInducementTargetType(option);
    const targetId =
      targetIdOverride ||
      (targetType === "trooper"
        ? String(deployedTroopers[0]?.id || "")
        : targetType === "company"
          ? "company"
          : "");

    if ((targetType === "trooper" || targetType === "hire") && !targetId)
      return;

    onChangeSelections([
      ...normalizedSelections,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        optionId: option.id,
        targetType,
        targetId,
      },
    ]);
  }

  function updateSelection(
    selectionId: string,
    patch: Partial<PairingInducementSelection>,
  ) {
    onChangeSelections(
      normalizedSelections.map((selection) =>
        selection.id === selectionId ? { ...selection, ...patch } : selection,
      ),
    );
  }

  function removeSelection(selectionId: string) {
    onChangeSelections(
      normalizedSelections.filter((selection) => selection.id !== selectionId),
    );
  }

  function renderShopSection(
    title: string,
    description: string,
    options: InducementOption[],
  ) {
    return (
      <article className={styles.pairingShopSection}>
        <header>
          <span className="panel-kicker">{title}</span>
          <p>{description}</p>
        </header>
        <div className={styles.pairingShopOptionList}>
          {options.map((option) => {
            const count = countByOption[option.id] || 0;
            const canAdd = canAddOption(option);
            const maxText = option.maxCount ? ` / ${option.maxCount}` : "";
            return (
              <div className="pairing-shop-option" key={option.id}>
                <div>
                  <strong>{option.label}</strong>
                  <small>
                    {INDUCEMENT_CATEGORY_LABEL[option.category]} · {option.cost}{" "}
                    Ind
                  </small>
                </div>
                <div className="pairing-shop-option__meta">
                  <span>
                    {count}
                    {maxText}
                  </span>
                  <button
                    className="command-button command-button--small"
                    type="button"
                    onClick={() => addSelection(option)}
                    disabled={!canAdd || !bothDeployed || !hasBudget}
                  >
                    Buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>
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
          files. Once both deployments are present, the shop will unlock.
        </div>
      )}

      {bothDeployed && !hasBudget && (
        <div className="legacy-specops-note">
          No inducements are available for this pairing. Continue to Mission.
        </div>
      )}

      {bothDeployed && hasBudget && (
        <>
          <div className="pairing-inducement-toolbar">
            <div className="event-mini-stats">
              <span>Budget: {inducementBudget}</span>
              <span>Spent: {spent}</span>
              <span className={remaining < 0 ? "is-over-budget" : ""}>
                Remaining: {remaining}
              </span>
            </div>
          </div>

          <div className="pairing-shop-grid">
            {renderShopSection(
              "Company-Wide",
              "Command Tokens benefit the whole company and are not assigned to a trooper.",
              INDUCEMENT_OPTIONS.filter(
                (option) => option.category === "command",
              ),
            )}
            {renderTroopShopSection()}
            {renderShopSection(
              "Equipment Rentals",
              "Rentals are assigned to deployed troopers for this Contract only.",
              INDUCEMENT_OPTIONS.filter(
                (option) =>
                  option.category === "primary" ||
                  option.category === "secondary" ||
                  option.category === "equipment",
              ),
            )}
          </div>

          <div className="pairing-inducement-list">
            <h3>Purchased Benefits</h3>
            {normalizedSelections.map((selection) => {
              const option = INDUCEMENT_OPTION_BY_ID.get(selection.optionId);
              if (!option) return null;

              return (
                <div className="pairing-inducement-row" key={selection.id}>
                  <div className="pairing-inducement-row__summary">
                    <strong>{option.label}</strong>
                    <small>
                      {option.cost} Ind ·{" "}
                      {getInducementTargetLabel(selection.targetType)}
                    </small>
                  </div>

                  {selection.targetType === "trooper" ? (
                    <label className="field">
                      <span>Assigned Trooper</span>
                      <select
                        value={selection.targetId}
                        onChange={(event) =>
                          updateSelection(selection.id, {
                            targetId: event.target.value,
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
                  ) : selection.targetType === "hire" ? (
                    <div className="pairing-inducement-row__tag">
                      {(() => {
                        const hireUnit = troopProfiles.get(
                          selection.optionId,
                        )?.unit;
                        const choices = hireUnit
                          ? getHireProfileChoices(option, hireUnit)
                          : [];
                        const selectedChoice =
                          choices.find(
                            (choice) => choice.targetId === selection.targetId,
                          ) || choices[0];
                        return selectedChoice?.label || "Temporary hire";
                      })()}
                    </div>
                  ) : (
                    <div className="pairing-inducement-row__tag">
                      Company-wide benefit
                    </div>
                  )}

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => removeSelection(selection.id)}
                    aria-label="Remove inducement"
                  >
                    <AppIcon name="remove" size={17} />
                  </button>
                </div>
              );
            })}
            {normalizedSelections.length === 0 && (
              <p className="empty-note">No inducements purchased yet.</p>
            )}
          </div>

          <div className="pairing-force-grid">
            <article className="pairing-force-card">
              <span className="panel-kicker">Your Deployed Troopers</span>
              <h3>{company?.name || "Unknown Company"}</h3>
              <ul>
                {result.troopers.map((entry) => {
                  const trooper = findTrooper(company, entry.trooper);
                  const assigned = trooperSelections
                    .filter((selection) => selection.targetId === entry.trooper)
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
              <span className="panel-kicker">Inducement Summary</span>
              <h3>Purchased This Contract</h3>
              <ul>
                <li>
                  Command Tokens
                  <span>{companySelections.length}</span>
                </li>
                <li>
                  Temporary Hires
                  <span>{hiredTroopSelections.length}</span>
                </li>
                <li>
                  Trooper Equipment Rentals
                  <span>{trooperSelections.length}</span>
                </li>
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
  contractName,
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
  contractName?: string;
  roundNumber: number;
  onChange: (result: PairingResult) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const eliteDeployed = isEliteDeployed(result);
  const selections = Array.isArray(inducementSelections)
    ? inducementSelections
    : [];
  const [activeTab, setActiveTab] = useState<
    "results" | "mission" | "troopers"
  >("results");
  const [expandedTroopers, setExpandedTroopers] = useState<
    Record<string, boolean>
  >({});
  const playerTroopers = getMissionTroopers(company, result);
  const opponentTroopers = getMissionTroopers(opposingCompany, opposingResult);
  const contractTitle = contractTitleFromValue(contractName) || "Mission";
  const hireSelectionsForPlayer = useMemo(
    () => selections.filter((s) => s.targetType === "hire"),
    [selections],
  );
  const hireProfiles = useHireProfiles(hireSelectionsForPlayer);
  const contractHref = getContractHref(contractName);
  const npcProfiles = getContractNpcProfiles(contractName);

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
      </div>

      <div className="legacy-tabs pairing-mission-tabs" role="tablist">
        <button
          type="button"
          className={activeTab === "results" ? "is-active" : ""}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
        <button
          type="button"
          className={activeTab === "mission" ? "is-active" : ""}
          onClick={() => setActiveTab("mission")}
        >
          Mission
        </button>
        <button
          type="button"
          className={activeTab === "troopers" ? "is-active" : ""}
          onClick={() => setActiveTab("troopers")}
        >
          Troopers
        </button>
      </div>

      <div className="pairing-mission-tab-body">
        {activeTab === "results" && (
          <>
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
                      .filter(
                        (selection) =>
                          selection.targetType === "trooper" &&
                          selection.targetId === entry.trooper,
                      )
                      .map(
                        (selection) =>
                          INDUCEMENT_OPTION_BY_ID.get(selection.optionId)
                            ?.label || "Unknown Benefit",
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
                          {calculateTrooperXp(
                            entry,
                            roundNumber,
                            eliteDeployed,
                          )}
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
                              updateTrooper(index, {
                                alive: event.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            value={entry.injury || ""}
                            onChange={(event) =>
                              updateTrooper(index, {
                                injury: event.target.value,
                              })
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
          </>
        )}

        {activeTab === "mission" && (
          <section>
            {contractHref ? (
              <iframe
                title={`Contract reference: ${contractTitle}`}
                src={contractHref}
                className="pairing-contract-frame"
              />
            ) : (
              <article className="pairing-playing-card pairing-playing-card--fallback">
                <h3>No Contract Reference Available</h3>
                <p>
                  Set a contract on this pairing to display mission details.
                </p>
              </article>
            )}
          </section>
        )}

        {activeTab === "troopers" && (
          <section>
            <div className="pairing-playing-stack">
              <details className="pairing-playing-accordion" open>
                <summary>
                  <span className="panel-kicker">Player A</span>
                  <h3>{company?.name || "Unknown Company"}</h3>
                </summary>
                <div className="legacy-trooper-list pairing-playing-accordion__body">
                  {playerTroopers.map((trooper) => {
                    const trooperId = `a-${String(trooper?.id || getTrooperName(trooper))}`;
                    const isExpanded = expandedTroopers[trooperId] || false;
                    const trooperRentals = selections.filter(
                      (sel) =>
                        sel.targetType === "trooper" &&
                        sel.targetId === String(trooper?.id || ""),
                    );
                    const trooperWithRentals = applyInducementEquipment(
                      trooper,
                      trooperRentals,
                    );
                    const renderedTrooper =
                      renderCombinedDetails(trooperWithRentals);

                    return (
                      <article
                        key={trooperId}
                        className={`legacy-trooper-card${trooper?.captain ? " is-captain" : ""}`}
                      >
                        <UnitProfileDisplay
                          unit={renderedTrooper}
                          profileGroups={renderedTrooper.profileGroups || []}
                          collapsible
                          expanded={isExpanded}
                          onToggle={() =>
                            setExpandedTroopers((prev) => ({
                              ...prev,
                              [trooperId]: !prev[trooperId],
                            }))
                          }
                        />
                      </article>
                    );
                  })}

                  {hireSelectionsForPlayer.map((sel) => {
                    const profileEntry = hireProfiles.get(sel.optionId);
                    const trooperId = `a-hire-${sel.id}`;
                    const isExpanded = expandedTroopers[trooperId] || false;

                    if (profileEntry?.unit) {
                      const selected = getSelectedHireDisplayData(
                        sel,
                        profileEntry.unit,
                      );
                      if (selected) {
                        return (
                          <article
                            key={trooperId}
                            className="legacy-trooper-card"
                          >
                            <p className="pairing-hire-subtitle">
                              Temporary Hire
                            </p>
                            <UnitProfileDisplay
                              unit={selected.unit}
                              profileGroups={selected.profileGroups}
                              collapsible
                              expanded={isExpanded}
                              onToggle={() =>
                                setExpandedTroopers((prev) => ({
                                  ...prev,
                                  [trooperId]: !prev[trooperId],
                                }))
                              }
                            />
                          </article>
                        );
                      }
                    }

                    const option = INDUCEMENT_OPTION_BY_ID.get(sel.optionId);
                    return (
                      <article key={trooperId} className="legacy-trooper-card">
                        <div className="pairing-hire-card__header">
                          <p className="pairing-hire-subtitle">
                            Temporary Hire
                          </p>
                          <strong>
                            {profileEntry?.displayName ||
                              option?.label ||
                              "Hired Trooper"}
                          </strong>
                          <small>Loading profile...</small>
                        </div>
                      </article>
                    );
                  })}

                  {(() => {
                    const commandTokens = selections.filter(
                      (sel) =>
                        sel.targetType === "company" &&
                        sel.optionId === "cmd-token",
                    ).length;
                    if (!commandTokens) return null;
                    return (
                      <article className="legacy-trooper-card pairing-hire-card">
                        <div className="pairing-hire-card__header">
                          <span className="panel-kicker">Company Benefit</span>
                          <strong>
                            +{commandTokens} Command Token
                            {commandTokens === 1 ? "" : "s"}
                          </strong>
                        </div>
                      </article>
                    );
                  })()}
                </div>
              </details>

              <details className="pairing-playing-accordion">
                <summary>
                  <span className="panel-kicker">Player B</span>
                  <h3>{opposingCompany?.name || "Opponent"}</h3>
                </summary>
                <div className="legacy-trooper-list pairing-playing-accordion__body">
                  {opponentTroopers.map((trooper) => {
                    const trooperId = `b-${String(trooper?.id || getTrooperName(trooper))}`;
                    const isExpanded = expandedTroopers[trooperId] || false;
                    const renderedTrooper = renderCombinedDetails(trooper);
                    return (
                      <article
                        key={trooperId}
                        className={`legacy-trooper-card${trooper?.captain ? " is-captain" : ""}`}
                      >
                        <UnitProfileDisplay
                          unit={renderedTrooper}
                          profileGroups={renderedTrooper.profileGroups || []}
                          collapsible
                          expanded={isExpanded}
                          onToggle={() =>
                            setExpandedTroopers((prev) => ({
                              ...prev,
                              [trooperId]: !prev[trooperId],
                            }))
                          }
                        />
                      </article>
                    );
                  })}
                  {opponentTroopers.length === 0 && (
                    <article className="pairing-playing-card pairing-playing-card--fallback">
                      <h3>No Opponent Troopers</h3>
                      <p>The opposing deployment has not been saved yet.</p>
                    </article>
                  )}
                </div>
              </details>

              <details className="pairing-playing-accordion">
                <summary>
                  <span className="panel-kicker">Contract NPCs</span>
                  <h3>{contractTitle || "Mission NPCs"}</h3>
                </summary>
                <div className="legacy-trooper-list pairing-playing-accordion__body">
                  {npcProfiles.map((profile) => (
                    <article key={profile.id} className="legacy-trooper-card">
                      <UnifiedProfileCard profile={profile} />
                    </article>
                  ))}
                  {npcProfiles.length === 0 && (
                    <article className="pairing-playing-card pairing-playing-card--fallback">
                      <h3>No NPC Profiles</h3>
                      <p>
                        There are no NPC profiles mapped to this contract yet.
                      </p>
                    </article>
                  )}
                </div>
              </details>
            </div>
          </section>
        )}
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
          Continue to Downtime
        </button>
      </div>
    </section>
  );
}

function parseRollRange(value: string): [number, number] | null {
  const match = String(value || "").match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
}

function findDowntimeEventForRoll(roll: number) {
  return DOWNTIME_EVENTS.find((event) => {
    const range = parseRollRange(event.roll);
    return range ? roll >= range[0] && roll <= range[1] : false;
  });
}

function getRenderedMetadataNames(items: any[] = [], key?: string): string[] {
  return items.flatMap((item) => {
    if (!item) return [];
    const directName = String(item.name || "").trim();
    if (directName) return [directName];
    return key
      ? mapItemData({ ...item, key })
          .map((entry) => String(entry.name || "").trim())
          .filter(Boolean)
      : [];
  });
}

function getTrooperSearchStrings(trooper: any): string[] {
  if (!trooper) return [];
  const rendered = renderCombinedDetails(trooper);
  const profile = rendered?.profileGroups?.[0]?.profiles?.[0] || rendered;
  return [
    String(rendered?.name || rendered?.isc || ""),
    ...getRenderedMetadataNames(profile?.skills || [], "skills"),
    ...getRenderedMetadataNames(profile?.weapons || [], "weapons"),
    ...getRenderedMetadataNames(
      profile?.equip || profile?.equips || [],
      "equips",
    ),
    ...getRenderedMetadataNames(
      profile?.peripheral || profile?.peripherals || [],
      "peripheral",
    ),
  ]
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getDowntimeRequirementValue(traits: string[]): string | null {
  const requirementTrait = traits.find((trait) =>
    trait.startsWith("Requirement ("),
  );
  if (!requirementTrait) return null;
  const match = requirementTrait.match(/^Requirement \((.+)\)$/);
  return match?.[1]?.trim() || null;
}

function trooperMatchesDowntimeRequirement(
  trooper: any,
  requirement: string | null,
): boolean {
  if (!requirement) return true;
  const haystack = getTrooperSearchStrings(trooper);
  const target = requirement.trim().toLowerCase();
  if (target === "hacker") {
    return haystack.some(
      (entry) => entry.includes("hacking device") || entry === "hacker",
    );
  }
  if (target === "trinity program") {
    return haystack.some((entry) => entry.includes("trinity"));
  }
  return haystack.some((entry) => entry.includes(target));
}

function downtimeNeedsParticipant(choiceCheck: string): boolean {
  return String(choiceCheck || "").trim() !== "—";
}

function downtimeHasTargetableBenefit(
  traits: string[],
  outcome: DowntimeOutcome,
): boolean {
  if (!outcome) return false;
  const passes = outcome === "pass" || outcome === "critical-pass";
  return traits.some((trait) => {
    if (trait === "LT" || trait === "Weapon") return passes;
    if (trait === "XP") return passes;
    if (trait.startsWith("Skill (")) return passes;
    return false;
  });
}

function summarizeDowntimeEffects(
  traits: string[],
  outcome: DowntimeOutcome,
): string[] {
  return traits
    .map((trait) => getDowntimeEffectSummary(trait, outcome))
    .filter((entry): entry is string => Boolean(entry));
}

function DowntimeTraitPill({ trait }: { trait: string }) {
  const tooltip = getDowntimeTraitTooltip(trait);

  return (
    <span
      className={
        tooltip ? "downtime-trait downtime-trait--tip" : "downtime-trait"
      }
      tabIndex={tooltip ? 0 : undefined}
    >
      {trait}
      {tooltip && (
        <span className="trait-tooltip">
          <strong className="trait-tooltip-title">{trait}</strong>
          {tooltip.type === "text" ? (
            <span className="trait-tooltip-body">{tooltip.desc}</span>
          ) : (
            <>
              {tooltip.special && (
                <span className="trait-tooltip-special">{tooltip.special}</span>
              )}
              <span className="trait-tooltip-cols">
                <span className="trait-tooltip-col">
                  <span className="trait-tooltip-col-head">Fail</span>
                  <span className="trait-tooltip-col-val">
                    {tooltip.fail ?? "-"}
                  </span>
                </span>
                <span className="trait-tooltip-col">
                  <span className="trait-tooltip-col-head">Pass</span>
                  <span className="trait-tooltip-col-val">
                    {tooltip.pass ?? "-"}
                  </span>
                </span>
                <span className="trait-tooltip-col">
                  <span className="trait-tooltip-col-head">Crit</span>
                  <span className="trait-tooltip-col-val">
                    {tooltip.crit ?? "-"}
                  </span>
                </span>
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}

function DowntimeStep({
  company,
  opposingCompany,
  result,
  onChange,
  onBack,
  onNext,
}: {
  company: LocalCompany | null;
  opposingCompany: LocalCompany | null;
  result: PairingResult;
  onChange: (result: PairingResult) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allTroopers = ((company?.troopers || []) as any[]).filter(Boolean);
  const opposingTroopers = ((opposingCompany?.troopers || []) as any[]).filter(
    Boolean,
  );
  const selectedEvent = getDowntimeEventById(result.downtime.eventId);
  const selectedChoice = getDowntimeChoiceById(
    result.downtime.eventId,
    result.downtime.choiceId,
  );
  const activeTraits = getDowntimeActiveTraits(
    result.downtime.eventId,
    result.downtime.choiceId,
  );
  const participantTraits = activeTraits.filter(isDowntimeParticipantTrait);
  const resolutionTraits = activeTraits.filter(isDowntimeResolutionTrait);
  const requirement = getDowntimeRequirementValue(activeTraits);
  const participantNeeded = downtimeNeedsParticipant(
    selectedChoice?.check || "",
  );
  const captainId = String(findCaptain(company)?.id || "");
  const mvpId =
    result.troopers.find((entry) => Boolean(entry.mvp))?.trooper || "";
  const renownedId = String(
    [...allTroopers].sort(
      (a, b) => getTrooperPoints(b) - getTrooperPoints(a),
    )[0]?.id || "",
  );
  const downedIds = new Set(
    result.troopers
      .filter((entry) => !entry.alive)
      .map((entry) => String(entry.trooper || "")),
  );
  const eligibleParticipants = allTroopers.filter((trooper) => {
    const trooperId = String(trooper?.id || "");
    if (!participantNeeded) return false;
    if (
      participantTraits.includes("Captain") &&
      captainId &&
      trooperId !== captainId
    ) {
      return false;
    }
    if (participantTraits.includes("MVP") && mvpId && trooperId !== mvpId) {
      return false;
    }
    if (
      participantTraits.includes("Renowned") &&
      renownedId &&
      trooperId !== renownedId
    ) {
      return false;
    }
    if (
      selectedEvent?.id === "taken-hostage" &&
      downedIds.size > 0 &&
      !downedIds.has(trooperId)
    ) {
      return false;
    }
    if (!trooperMatchesDowntimeRequirement(trooper, requirement)) return false;
    return true;
  });
  const downtimeEffects = summarizeDowntimeEffects(
    resolutionTraits,
    result.downtime.outcome as DowntimeOutcome,
  );
  const selfBenefitNeeded =
    downtimeHasTargetableBenefit(
      resolutionTraits,
      result.downtime.outcome as DowntimeOutcome,
    ) ||
    (selectedEvent?.id === "nothing-to-report" &&
      result.downtime.choiceId === "take-the-quiet");
  const opponentBenefitNeeded =
    downtimeHasTargetableBenefit(
      resolutionTraits,
      result.downtime.outcome as DowntimeOutcome,
    ) &&
    ((activeTraits.includes("Opponent") &&
      result.downtime.outcome === "failure") ||
      (activeTraits.includes("Opponent (Mutual)") &&
        (result.downtime.outcome === "pass" ||
          result.downtime.outcome === "critical-pass")));
  const selectedParticipant = allTroopers.find(
    (trooper) =>
      String(trooper?.id || "") === result.downtime.participantTrooperId,
  );

  function updateDowntime(patch: Partial<PairingDowntimeResult>) {
    onChange({
      ...result,
      downtime: {
        ...result.downtime,
        ...patch,
      },
      submitted: false,
    });
  }

  useEffect(() => {
    if (!participantNeeded) {
      if (result.downtime.participantTrooperId) {
        updateDowntime({ participantTrooperId: "" });
      }
      return;
    }

    if (
      eligibleParticipants.length > 0 &&
      !eligibleParticipants.some(
        (trooper) =>
          String(trooper?.id || "") === result.downtime.participantTrooperId,
      )
    ) {
      updateDowntime({
        participantTrooperId: String(eligibleParticipants[0]?.id || ""),
      });
    }
  }, [
    participantNeeded,
    eligibleParticipants,
    result.downtime.participantTrooperId,
  ]);

  useEffect(() => {
    if (
      selfBenefitNeeded &&
      !result.downtime.beneficiaryTrooperId &&
      (selectedParticipant || allTroopers[0])
    ) {
      updateDowntime({
        beneficiaryTrooperId: String(
          selectedParticipant?.id || allTroopers[0]?.id || "",
        ),
      });
      return;
    }

    if (!selfBenefitNeeded && result.downtime.beneficiaryTrooperId) {
      updateDowntime({ beneficiaryTrooperId: "" });
    }
  }, [
    selfBenefitNeeded,
    selectedParticipant?.id,
    allTroopers,
    result.downtime.beneficiaryTrooperId,
  ]);

  useEffect(() => {
    if (
      opponentBenefitNeeded &&
      !result.downtime.opponentBeneficiaryTrooperId &&
      opposingTroopers[0]
    ) {
      updateDowntime({
        opponentBeneficiaryTrooperId: String(opposingTroopers[0]?.id || ""),
      });
      return;
    }

    if (
      !opponentBenefitNeeded &&
      result.downtime.opponentBeneficiaryTrooperId
    ) {
      updateDowntime({ opponentBeneficiaryTrooperId: "" });
    }
  }, [
    opponentBenefitNeeded,
    opposingTroopers,
    result.downtime.opponentBeneficiaryTrooperId,
  ]);

  function handleRollEvent() {
    const roll = Math.floor(Math.random() * 20) + 1;
    const event = findDowntimeEventForRoll(roll);
    updateDowntime({
      roll,
      eventId: event?.id || "",
      choiceId: "",
      participantTrooperId: "",
      beneficiaryTrooperId: "",
      opponentBeneficiaryTrooperId: "",
      outcome: "",
      notes: result.downtime.notes,
    });
  }

  function handleRollInputChange(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      updateDowntime({
        roll: null,
        eventId: "",
        choiceId: "",
        participantTrooperId: "",
        beneficiaryTrooperId: "",
        opponentBeneficiaryTrooperId: "",
        outcome: "",
      });
      return;
    }

    const roll = Math.max(1, Math.min(20, Number(trimmed) || 0));
    const event = findDowntimeEventForRoll(roll);
    updateDowntime({
      roll,
      eventId: event?.id || "",
      choiceId: "",
      participantTrooperId: "",
      beneficiaryTrooperId: "",
      opponentBeneficiaryTrooperId: "",
      outcome: "",
    });
  }

  return (
    <section className="pairing-panel">
      <div className="pairing-mission-header">
        <div>
          <span className="panel-kicker">Downtime</span>
          <h2>Resolve Post-Mission Activity</h2>
        </div>
        <div className="pairing-downtime-roll-controls">
          <label className="field pairing-downtime-roll-field">
            <span>Roll</span>
            <input
              type="number"
              min="1"
              max="20"
              inputMode="numeric"
              value={result.downtime.roll ?? ""}
              onChange={(event) => handleRollInputChange(event.target.value)}
              placeholder="d20"
            />
          </label>
          <div className="pairing-step-actions pairing-step-actions--flush">
            <button
              className="command-button"
              type="button"
              onClick={handleRollEvent}
            >
              Roll d20 Event
            </button>
          </div>
        </div>
      </div>

      <div className="pairing-downtime-layout">
        <div className="pairing-downtime-main">
          {selectedEvent && (
            <section className="pairing-downtime-event-card">
              <div className="pairing-downtime-event-card__header">
                <div>
                  <span className="panel-kicker">Event</span>
                  <h3>{selectedEvent.event}</h3>
                </div>
                <span className="pairing-tag-chip">{selectedEvent.roll}</span>
              </div>
              {selectedEvent.traits.length > 0 && (
                <div
                  className="downtime-event-traits"
                  aria-label="Event traits"
                >
                  {selectedEvent.traits.map((trait) => (
                    <DowntimeTraitPill trait={trait} key={trait} />
                  ))}
                </div>
              )}

              <div className="pairing-downtime-choice-list">
                {selectedEvent.choices.map((choice) => {
                  const isActive = result.downtime.choiceId === choice.id;
                  return (
                    <button
                      className={`pairing-downtime-choice-card${isActive ? " is-active" : ""}`}
                      type="button"
                      key={choice.id}
                      onClick={() =>
                        updateDowntime({
                          choiceId: choice.id,
                          participantTrooperId: "",
                          beneficiaryTrooperId: "",
                          opponentBeneficiaryTrooperId: "",
                          outcome: "",
                        })
                      }
                    >
                      <div className="pairing-downtime-choice-card__header">
                        <strong>{choice.check}</strong>
                        <span>{choice.text}</span>
                      </div>
                      {choice.traits.length > 0 && (
                        <div
                          className="downtime-event-traits"
                          aria-label="Choice traits"
                        >
                          {choice.traits.map((trait) => (
                            <DowntimeTraitPill
                              trait={trait}
                              key={`${choice.id}-${trait}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="pairing-downtime-side">
          <section className="pairing-force-card">
            <span className="panel-kicker">Participant</span>
            <h3>Who resolves this event?</h3>
            {selectedChoice ? (
              <>
                {participantTraits.length > 0 && (
                  <p className="pairing-downtime-note">
                    Restricted by: {participantTraits.join(", ")}
                  </p>
                )}
                {requirement && (
                  <p className="pairing-downtime-note">
                    Requirement: {requirement}
                  </p>
                )}
                {participantNeeded ? (
                  eligibleParticipants.length > 0 ? (
                    <label className="field">
                      <span>Selected Trooper</span>
                      <select
                        value={result.downtime.participantTrooperId}
                        onChange={(event) =>
                          updateDowntime({
                            participantTrooperId: event.target.value,
                          })
                        }
                      >
                        {eligibleParticipants.map((trooper) => (
                          <option
                            value={String(trooper?.id || "")}
                            key={String(trooper?.id || "")}
                          >
                            {getTrooperName(trooper)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="empty-note">
                      No eligible troopers match this event's participant rules.
                    </p>
                  )
                ) : (
                  <p className="pairing-downtime-note">
                    This response does not require a skill check participant.
                  </p>
                )}
              </>
            ) : (
              <p className="empty-note">Choose a response first.</p>
            )}
          </section>

          <section className="pairing-force-card">
            <span className="panel-kicker">Resolution</span>
            <h3>Record the outcome</h3>
            <label className="field">
              <span>Outcome</span>
              <select
                value={result.downtime.outcome}
                onChange={(event) =>
                  updateDowntime({
                    outcome: event.target.value as DowntimeOutcome,
                  })
                }
                disabled={!selectedChoice || selectedChoice.check === "—"}
              >
                <option value="">
                  {selectedChoice?.check === "—"
                    ? "No roll required"
                    : "Not rolled"}
                </option>
                <option value="failure">Failure</option>
                <option value="pass">Pass</option>
                <option value="critical-pass">Critical Pass</option>
              </select>
            </label>
            {activeTraits.includes("P2P") && (
              <label className="field">
                <span>CR Spent Before Roll</span>
                <input
                  type="number"
                  min="0"
                  value={result.downtime.spentCr}
                  onChange={(event) =>
                    updateDowntime({
                      spentCr: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </label>
            )}
            {selfBenefitNeeded && allTroopers.length > 0 && (
              <label className="field">
                <span>
                  {selectedEvent?.id === "nothing-to-report" &&
                  result.downtime.choiceId === "take-the-quiet"
                    ? "Recovered Trooper"
                    : "Benefit Recipient"}
                </span>
                <select
                  value={result.downtime.beneficiaryTrooperId}
                  onChange={(event) =>
                    updateDowntime({ beneficiaryTrooperId: event.target.value })
                  }
                >
                  {allTroopers.map((trooper) => (
                    <option
                      value={String(trooper?.id || "")}
                      key={String(trooper?.id || "")}
                    >
                      {getTrooperName(trooper)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {opponentBenefitNeeded && opposingTroopers.length > 0 && (
              <label className="field">
                <span>Opponent Benefit Recipient</span>
                <select
                  value={result.downtime.opponentBeneficiaryTrooperId}
                  onChange={(event) =>
                    updateDowntime({
                      opponentBeneficiaryTrooperId: event.target.value,
                    })
                  }
                >
                  {opposingTroopers.map((trooper) => (
                    <option
                      value={String(trooper?.id || "")}
                      key={String(trooper?.id || "")}
                    >
                      {getTrooperName(trooper)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>Resolution Notes</span>
              <textarea
                rows={4}
                value={result.downtime.notes}
                onChange={(event) =>
                  updateDowntime({ notes: event.target.value })
                }
                placeholder="Track manual effects, rerolls, injuries removed, or opponent picks."
              />
            </label>
          </section>

          <section className="pairing-force-card">
            <span className="panel-kicker">Effects</span>
            <h3>Outcome Preview</h3>
            {resolutionTraits.length > 0 ? (
              <>
                <div
                  className="downtime-event-traits"
                  aria-label="Effect traits"
                >
                  {resolutionTraits.map((trait) => (
                    <DowntimeTraitPill trait={trait} key={`effect-${trait}`} />
                  ))}
                </div>
                <ul className="pairing-downtime-effect-list">
                  {downtimeEffects.length > 0 ? (
                    downtimeEffects.map((entry) => <li key={entry}>{entry}</li>)
                  ) : (
                    <li>
                      No effect applies for the currently selected outcome.
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="empty-note">
                Select an event response to preview its consequences.
              </p>
            )}
          </section>
        </div>
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

function formatDowntimeSummary(
  result: PairingResult,
  company: LocalCompany | null,
) {
  const event = getDowntimeEventById(result.downtime.eventId);
  const choice = getDowntimeChoiceById(
    result.downtime.eventId,
    result.downtime.choiceId,
  );
  const participant = findTrooper(
    company,
    result.downtime.participantTrooperId,
  );
  const outcome = describeDowntimeOutcomeLabel(
    result.downtime.outcome as DowntimeOutcome,
  );

  if (!event) return "Downtime: None";

  const parts = [event.event];
  if (choice) parts.push(choice.text);
  if (participant) parts.push(`by ${getTrooperName(participant)}`);
  if (result.downtime.outcome) parts.push(`(${outcome})`);
  return `Downtime: ${parts.join(" · ")}`;
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
      <p>{formatDowntimeSummary(result, company)}</p>
    </article>
  );
}

function SharedPairingWorkspace({
  fileId,
  roundId,
  pairingId,
  eventName,
  roundName,
  roundMission,
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
  roundMission?: string;
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
      downtime: normalizeDowntimeResult(stored?.downtime),
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
        .map((entry: any, index: number) => {
          const optionId = String(entry?.optionId || "");
          const option = INDUCEMENT_OPTION_BY_ID.get(optionId);
          const fallbackTargetType = option
            ? getInducementTargetType(option)
            : "trooper";
          const legacyTrooperId = String(entry?.trooperId || "");
          const parsedTargetType = String(
            entry?.targetType || fallbackTargetType,
          ) as InducementTargetType;
          const targetType: InducementTargetType =
            parsedTargetType === "company" ||
            parsedTargetType === "hire" ||
            parsedTargetType === "trooper"
              ? parsedTargetType
              : fallbackTargetType;
          const targetId = String(
            entry?.targetId ||
              legacyTrooperId ||
              (targetType === "company"
                ? "company"
                : targetType === "hire"
                  ? `hire-${player.side}-${index}`
                  : ""),
          );

          return {
            id: String(entry?.id || `${player.side}-${index}`),
            optionId,
            targetType,
            targetId,
          };
        })
        .filter((entry) => entry.optionId),
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
        const ownedPlayer = withEventData.find((p) => p.ownsThisCompany);
        if (ownedPlayer) {
          const storedStep =
            ownedPlayer.companyEventData?.pairings?.[pairingKey]?.step;
          if (
            typeof storedStep === "number" &&
            storedStep >= 0 &&
            storedStep <= 4
          ) {
            setStep(storedStep);
          }
        }
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
    const ownedPlayer = players.find((player) => player.ownsThisCompany);
    if (!ownedPlayer) return;
    if (ownedPlayer.side !== activeSide) {
      setActiveSide(ownedPlayer.side);
    }
  }, [players, activeSide]);

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
            mission: pairing.mission || roundMission || null,
            side: owner.side,
            companyFileId: owner.companyFileId,
            ...nextResult,
            troopers: troopersWithSnapshots,
            inducements: {
              ...(inducementsBySide[owner.side] || defaultInducements()),
              updatedAt: now,
            },
            step,
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
    goToStep(1);
  }

  async function handleContinueToMission() {
    const ok = await persistSharedResult(activeResult, false);
    if (ok) goToStep(2);
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

  async function persistStepOnly(nextStep: number) {
    const owner = players.find((p) => p.ownsThisCompany);
    if (!owner?.companyEventFileId) return;
    try {
      const existing = await readSharedFile(owner.companyEventFileId);
      const pairings =
        typeof existing?.pairings === "object" && existing?.pairings
          ? existing.pairings
          : {};
      const now = new Date().toISOString();
      const currentEntry = pairings[pairingKey] || {};
      await updateSharedFile(owner.companyEventFileId, {
        ...existing,
        updatedAt: now,
        pairings: {
          ...pairings,
          [pairingKey]: {
            ...currentEntry,
            step: nextStep,
            updatedAt: now,
          },
        },
      });
    } catch {
      // non-critical, step persistence failure is silent
    }
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    void persistStepOnly(nextStep);
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
          <h1>
            {contractTitleFromValue(pairing.mission || roundMission) ||
              "Contract TBD"}
          </h1>
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

        {loadingData && (
          <p className="legacy-empty-note">
            Loading company and event files...
          </p>
        )}
        {loadError && <p className="error-message">{loadError}</p>}

        {!loadingData && !loadError && (
          <>
            <div className="pairing-stepper" aria-label="Pairing steps">
              {[
                "Deploy Troopers",
                "Inducements",
                "Mission",
                "Downtime",
                "Post Mission",
              ].map((label, index) => (
                <button
                  className={step === index ? "is-active" : ""}
                  type="button"
                  key={label}
                  onClick={() => goToStep(index)}
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
                hireSelections={activeInducements.selections.filter(
                  (sel) => sel.targetType === "hire",
                )}
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
                onBack={() => goToStep(0)}
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
                contractName={pairing.mission || roundMission}
                roundNumber={roundNumber || 1}
                onChange={updateActiveDraft}
                onBack={() => goToStep(1)}
                onNext={() => goToStep(3)}
              />
            )}
            {step === 3 && (
              <DowntimeStep
                company={activeCompany}
                opposingCompany={opposingCompany}
                result={activeResult}
                onChange={updateActiveDraft}
                onBack={() => goToStep(2)}
                onNext={() => goToStep(4)}
              />
            )}
            {step === 4 && (
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
    contextState.pairing.mission || contextState.round.mission || "";
  const contractTitle = contractTitleFromValue(contractName) || "Contract TBD";

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
          <h1>{contractTitle}</h1>
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
        {["Deploy Troopers", "Mission", "Downtime", "Post Mission"].map(
          (label, index) => (
            <button
              className={step === index ? "is-active" : ""}
              type="button"
              key={label}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          ),
        )}
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
          contractName={contractName}
          roundNumber={contextState.round.number}
          onChange={updateDraft}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <DowntimeStep
          company={activeCompany}
          opposingCompany={
            activeParticipantId === contextState.pairing.player1Id
              ? companyB
              : companyA
          }
          result={activeResult}
          onChange={updateDraft}
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
    roundMission?: string;
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
          roundMission: String(round?.mission || "") || undefined,
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
        roundMission={sharedContext.roundMission}
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
