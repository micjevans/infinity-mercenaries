/**
 * Data abstraction layer for companies.
 * Provides a unified interface for reading/writing/deleting companies
 * regardless of whether they are stored locally or on Google Drive.
 */

import {
  loadLocalCompanies,
  upsertLocalCompany,
  deleteLocalCompany as deleteLocalCompanyFromStore,
  type LocalCompany,
} from "./companyStore";
import {
  readSharedFile,
  updateSharedFile,
  upsertAppDataCompanyReference,
  removeAppDataCompanyReference,
  deleteSharedFile as deleteDriveFile,
  listAppDataCompanyReferences,
  type AppDataCompanyReference,
} from "../google-drive-adapter";

type DriveCompanyEnvelope = {
  schemaVersion?: number;
  kind?: string;
  createdAt?: string;
  updatedAt?: string;
  company?: LocalCompany;
  event?: Record<string, unknown> | null;
  companyEventFile?: Record<string, unknown> | null;
};

/**
 * Determines if a company is stored on Drive vs locally.
 */
export function isCompanyDriveBacked(company: LocalCompany): boolean {
  return !!(company.shareFileId || company.shareLink);
}

function looksLikeDriveFileId(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,}$/.test(value);
}

function isDriveCompanyEnvelope(raw: unknown): raw is DriveCompanyEnvelope {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Record<string, unknown>;
  return value.kind === "infinity-mercenaries-company";
}

function extractDriveCompanyPayload(raw: unknown): LocalCompany | null {
  if (!raw || typeof raw !== "object") return null;

  if (isDriveCompanyEnvelope(raw)) {
    const envelope = raw as DriveCompanyEnvelope;
    if (envelope.company && typeof envelope.company === "object") {
      return envelope.company;
    }
  }

  return raw as LocalCompany;
}

function mergeDriveCompanyEnvelope(
  existingRaw: unknown,
  nextCompany: LocalCompany,
): Record<string, unknown> {
  if (isDriveCompanyEnvelope(existingRaw)) {
    const envelope = existingRaw as DriveCompanyEnvelope;
    return {
      ...envelope,
      updatedAt: new Date().toISOString(),
      company: {
        ...envelope.company,
        ...nextCompany,
      },
    };
  }

  // If a file isn't in envelope format, preserve existing fields but write
  // a proper envelope moving forward.
  return {
    schemaVersion: 1,
    kind: "infinity-mercenaries-company",
    createdAt:
      (existingRaw as Record<string, unknown> | null)?.createdAt ||
      new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: nextCompany,
    event: (existingRaw as Record<string, unknown> | null)?.event || null,
    companyEventFile:
      (existingRaw as Record<string, unknown> | null)?.companyEventFile || null,
  };
}

/**
 * Load a single company by ID (local) or fileId (Drive).
 * Returns null if not found.
 */
export async function loadCompany(
  idOrFileId: string,
): Promise<LocalCompany | null> {
  // Try loading from local storage first
  const local = loadLocalCompanies().find((c) => c.id === idOrFileId);
  if (local) return local;

  // For direct links like /companies/manage/?fileId=..., read the file directly
  // without requiring appdata index access.
  if (looksLikeDriveFileId(idOrFileId)) {
    try {
      const driveData = await readSharedFile(idOrFileId);
      const baseCompany = extractDriveCompanyPayload(driveData);
      if (!baseCompany) return null;

      return transformDriveCompanyToLocalCompany(baseCompany, {
        fileId: idOrFileId,
        companyId: baseCompany.id || idOrFileId,
        name: baseCompany.name || "Drive Company",
        shareLink:
          baseCompany.shareLink || `/view?id=${encodeURIComponent(idOrFileId)}`,
        eventFileId: baseCompany.eventFileId,
        eventName: baseCompany.eventName,
        updatedAt: baseCompany.updatedAt || new Date().toISOString(),
      });
    } catch {
      return null;
    }
  }

  // Unknown non-local identifier.
  return null;
}

/**
 * Load all companies (both local and Drive-backed).
 */
export async function loadAllCompanies(): Promise<LocalCompany[]> {
  const local = loadLocalCompanies();
  let driveReferences: AppDataCompanyReference[] = [];
  try {
    driveReferences = await listAppDataCompanyReferences();
  } catch {
    // When auth/session is not ready, still return local companies.
    return local;
  }

  // Load full data for Drive companies
  const driveCompanies = await Promise.all(
    driveReferences.map(async (ref) => {
      try {
        const driveData = await readSharedFile(ref.fileId);
        const baseCompany = extractDriveCompanyPayload(driveData);
        if (!baseCompany) {
          return transformDriveCompanyToLocalCompany(
            { name: ref.name } as LocalCompany,
            ref,
          );
        }
        return transformDriveCompanyToLocalCompany(baseCompany, ref);
      } catch {
        // If file is inaccessible, return minimal entry (broken link)
        return transformDriveCompanyToLocalCompany(
          { name: ref.name } as LocalCompany,
          ref,
        );
      }
    }),
  );

  return [...local, ...driveCompanies];
}

/**
 * Save a company to the appropriate storage backend.
 * - If local: saves to localStorage
 * - If Drive: saves to Drive file + updates appdata index
 */
export async function saveCompany(company: LocalCompany): Promise<void> {
  if (isCompanyDriveBacked(company)) {
    // Save to Drive
    if (!company.shareFileId) {
      throw new Error("Drive company missing shareFileId");
    }

    // Preserve the company envelope shape in Drive files.
    const existingRaw = await readSharedFile(company.shareFileId);
    const payload = mergeDriveCompanyEnvelope(existingRaw, company);
    await updateSharedFile(company.shareFileId, payload);

    // Update appdata index
    await upsertAppDataCompanyReference({
      fileId: company.shareFileId,
      companyId: company.id,
      name: company.name,
      shareLink: company.shareLink || "",
      eventFileId: company.eventFileId,
      eventName: company.eventName,
      updatedAt: company.updatedAt,
    });
  } else {
    // Save locally
    upsertLocalCompany(company);
  }
}

/**
 * Delete a company from the appropriate storage backend.
 * - If local: removes from localStorage
 * - If Drive: deletes Drive file + removes from appdata index
 */
export async function deleteCompany(company: LocalCompany): Promise<void> {
  if (isCompanyDriveBacked(company)) {
    // Delete from Drive
    if (!company.shareFileId) {
      throw new Error("Drive company missing shareFileId");
    }

    await deleteDriveFile(company.shareFileId);
    await removeAppDataCompanyReference(company.shareFileId);
  } else {
    // Delete locally
    deleteLocalCompanyFromStore(company.id);
  }
}

/**
 * Transform a Drive company file into LocalCompany shape for UI consumption.
 * This merges the full Drive file data with metadata from appdata index.
 */
function transformDriveCompanyToLocalCompany(
  driveData: LocalCompany,
  appDataRef: AppDataCompanyReference,
): LocalCompany {
  const base = driveData as LocalCompany;

  return {
    // Use existing values from Drive file where present
    ...base,
    // Ensure critical metadata from appdata index is set
    id: base.id || appDataRef.companyId,
    name: base.name || appDataRef.name,
    shareFileId: appDataRef.fileId,
    shareLink: appDataRef.shareLink,
    eventFileId: base.eventFileId || appDataRef.eventFileId,
    eventName: base.eventName || appDataRef.eventName,
    updatedAt:
      base.updatedAt || appDataRef.updatedAt || new Date().toISOString(),
  };
}
