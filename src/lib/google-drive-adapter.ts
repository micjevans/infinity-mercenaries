/**
 * Google Drive Adapter
 * Uses Google Identity Services (GIS) for OAuth and gapi for Drive API calls.
 *
 * Two file modes:
 *  - Private (AppData): hidden from Drive UI, not shareable, uses drive.appdata scope
 *  - Shared (Drive): visible in Drive, shareable via link, uses drive.file scope
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gapi: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

const SCOPES = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
].join(" ");
const DATA_FILE_NAME = "infinity-data.json";
const AUTH_STATE_KEY = "infinity-google-auth-state";
const ROOT_FOLDER_NAME = "Infinity Mercenaries";
const EVENTS_FOLDER_NAME = "Events";
const COMPANIES_FOLDER_NAME = "Companies";
const FORMS_FOLDER_NAME = "Forms";

type PersistedAuthState = {
  accessToken: string;
  userName: string | null;
  expiresAt: number;
};

export type AppDataEventReference = {
  fileId: string;
  name: string;
  shareLink?: string;
  location?: string;
  description?: string;
  startDate?: string;
  updatedAt: string;
};

export type AppDataCompanyReference = {
  companyId: string;
  name: string;
  fileId: string;
  shareLink: string;
  eventFileId?: string;
  eventName?: string;
  updatedAt: string;
};

type AppDataDocument = {
  version: number;
  updatedAt: string;
  data: {
    events: AppDataEventReference[];
    companies: AppDataCompanyReference[];
    organizerRegistrationTemplate?: OrganizerRegistrationTemplate;
    driveFolders?: Partial<OrganizerFolders>;
  };
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export type EventRegistrationForm = {
  formId: string;
  responderUri: string;
  editUri?: string;
  questions: {
    companyNameQuestionId: string;
    companyLinkQuestionId: string;
    eventFileIdQuestionId: string;
  };
  responseEntries?: {
    companyNameEntryId: string;
    companyLinkEntryId: string;
    eventFileIdEntryId: string;
  };
};

export type OrganizerRegistrationTemplate = EventRegistrationForm;

type OrganizerFolders = {
  rootFolderId: string;
  eventsFolderId: string;
  companiesFolderId: string;
  formsFolderId: string;
};

export type EventRegistrationSubmission = {
  companyName: string;
  companyShareLink: string;
  eventFileId: string;
  submittedAt: string;
};

let tokenClient: any = null;
let accessToken: string | null = null;
let userName: string | null = null;
let accessTokenExpiresAt: number | null = null;
const authStateListeners = new Set<
  (signedIn: boolean, currentUserName: string | null) => void
>();

function hasAccessToken(): boolean {
  return Boolean(accessToken);
}

function applyAccessTokenToGapiClient(): void {
  if (typeof gapi === "undefined") return;
  if (!gapi?.client?.setToken) return;
  if (accessToken) {
    gapi.client.setToken({ access_token: accessToken });
  } else {
    gapi.client.setToken(null);
  }
}

function emitAuthState(): void {
  const signedIn = Boolean(accessToken);
  for (const listener of authStateListeners) {
    listener(signedIn, userName);
  }
}

function setAuthSession(
  token: string,
  name: string | null,
  expiresAt?: number | null,
): void {
  accessToken = token;
  userName = name;
  accessTokenExpiresAt = expiresAt ?? null;
  applyAccessTokenToGapiClient();
  emitAuthState();
}

function clearAuthSession(): void {
  accessToken = null;
  userName = null;
  accessTokenExpiresAt = null;
  applyAccessTokenToGapiClient();
  clearPersistedAuthState();
  emitAuthState();
}

function requireDriveAuth(): void {
  if (!hasAccessToken()) {
    throw new Error("Not signed in to Google Drive.");
  }
}

function authHeaders(contentType?: string): HeadersInit {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function persistAuthState(
  token: string,
  name: string | null,
  expiresInSeconds?: number,
): void {
  if (!canUseStorage()) return;
  const ttl =
    Number.isFinite(expiresInSeconds) && (expiresInSeconds as number) > 0
      ? (expiresInSeconds as number)
      : 3600;
  const payload: PersistedAuthState = {
    accessToken: token,
    userName: name,
    expiresAt: Date.now() + ttl * 1000,
  };
  window.localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(payload));
}

function clearPersistedAuthState(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_STATE_KEY);
}

/**
 * Restores auth state from localStorage when token is still valid.
 * Returns true when an in-memory session was restored.
 */
export function restorePersistedAuthState(): boolean {
  if (!canUseStorage()) return false;

  try {
    const raw = window.localStorage.getItem(AUTH_STATE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as PersistedAuthState;
    if (!parsed?.accessToken || !parsed?.expiresAt) {
      clearAuthSession();
      return false;
    }

    if (parsed.expiresAt <= Date.now()) {
      clearAuthSession();
      return false;
    }

    const nextUserName = parsed.userName ?? null;
    const changed =
      accessToken !== parsed.accessToken ||
      userName !== nextUserName ||
      accessTokenExpiresAt !== parsed.expiresAt;
    accessToken = parsed.accessToken;
    userName = nextUserName;
    accessTokenExpiresAt = parsed.expiresAt;
    applyAccessTokenToGapiClient();
    if (changed) {
      emitAuthState();
    }
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

/**
 * Load gapi client and initialize Drive API discovery.
 * Call once on app mount before any Drive operations.
 */
export async function initializeGAPIClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    gapi.load("client", async () => {
      try {
        await gapi.client.init({
          // Note: no clientId or scope here — that belongs to the GIS token client below
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        });
        // If we restored a token before gapi initialization completed,
        // bind it into the active gapi client now.
        applyAccessTokenToGapiClient();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Initialize the GIS token client.
 * onTokenReceived is called with null on failure, or the access token on success.
 */
export function initializeTokenClient(
  clientId: string,
  onTokenReceived: (token: string | null, name: string | null) => void,
): void {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: async (response: any) => {
      if (response.error) {
        console.error("Token error:", response.error);
        clearAuthSession();
        onTokenReceived(null, null);
        return;
      }
      const grantedToken = response.access_token as string;

      // Fetch the user's display name from the People API
      let resolvedUserName: string | null = null;
      try {
        const info = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${grantedToken}` } },
        );
        const json = await info.json();
        resolvedUserName = json.name ?? json.email ?? "Signed In";
      } catch {
        resolvedUserName = "Signed In";
      }

      const expiresAt =
        Number.isFinite(response.expires_in) && Number(response.expires_in) > 0
          ? Date.now() + Number(response.expires_in) * 1000
          : null;

      setAuthSession(grantedToken, resolvedUserName, expiresAt);
      persistAuthState(grantedToken, resolvedUserName, response.expires_in);

      onTokenReceived(grantedToken, resolvedUserName);
    },
  });
}

/**
 * Trigger the Google sign-in / token popup.
 */
export function requestAccessToken(): void {
  if (!tokenClient) throw new Error("Token client not initialized");
  tokenClient.requestAccessToken({ prompt: "" });
}

/**
 * Sign out: revoke the token and clear local state.
 */
export function revokeAccessToken(onRevoked: () => void): void {
  if (!accessToken) {
    clearAuthSession();
    onRevoked();
    return;
  }
  google.accounts.oauth2.revoke(accessToken, () => {
    clearAuthSession();
    onRevoked();
  });
}

export function isSignedIn(): boolean {
  if (
    accessToken &&
    accessTokenExpiresAt &&
    accessTokenExpiresAt <= Date.now()
  ) {
    clearAuthSession();
    return false;
  }

  if (!accessToken) {
    restorePersistedAuthState();
  }

  if (
    accessToken &&
    accessTokenExpiresAt &&
    accessTokenExpiresAt <= Date.now()
  ) {
    clearAuthSession();
    return false;
  }

  return accessToken !== null;
}

export function subscribeAuthState(
  listener: (signedIn: boolean, currentUserName: string | null) => void,
): () => void {
  authStateListeners.add(listener);
  listener(isSignedIn(), userName);
  return () => {
    authStateListeners.delete(listener);
  };
}

export function getCurrentUserName(): string | null {
  return userName;
}

// ---- Drive file operations ----

/**
 * Get or create the data file on user's Drive
 */
export async function getOrCreateDataFile(): Promise<DriveFile> {
  requireDriveAuth();

  // Check if file already exists
  const existingFile = await findDataFile();
  if (existingFile) {
    return existingFile;
  }

  // Create new file
  return createDataFile();
}

/**
 * Find the data file on user's Drive
 */
async function findDataFile(): Promise<DriveFile | null> {
  if (!hasAccessToken()) {
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
        q: `name=\"${DATA_FILE_NAME}\" and mimeType=\"application/json\" and trashed=false`,
        spaces: "appDataFolder",
        fields: "files(id,name,mimeType)",
        pageSize: "1",
      }).toString()}`,
      { headers: authHeaders() },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to find data file: ${response.status} ${text}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload?.files) && payload.files.length > 0) {
      const file = payload.files[0];
      return {
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding data file:", error);
    return null;
  }
}

/**
 * Create the data file on user's Drive
 */
async function createDataFile(): Promise<DriveFile> {
  requireDriveAuth();

  const metadata = {
    name: DATA_FILE_NAME,
    mimeType: "application/json",
    parents: ["appDataFolder"],
  };
  const content = JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    data: {
      events: [],
      companies: [],
    },
  });

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  form.append("file", new Blob([content], { type: "application/json" }));

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType",
    {
      method: "POST",
      headers: authHeaders(),
      body: form,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create Drive file: ${response.status}`);
  }

  return response.json();
}

/**
 * Read data from the user's Drive file
 */
export async function readDataFromDrive(fileId: string): Promise<any> {
  requireDriveAuth();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new Error(`Failed to read from Drive: ${response.status}`);
  }
  return response.json();
}

/**
 * Write data to the user's Drive file
 */
export async function writeDataToDrive(
  fileId: string,
  data: any,
): Promise<void> {
  requireDriveAuth();

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: authHeaders("application/json"),
      body: JSON.stringify(data, null, 2),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to write to Drive: ${response.status}`);
  }
}

/**
 * Get the cached file ID from localStorage
 */
export function getCachedFileId(): string | null {
  return localStorage.getItem("infinity-drive-file-id");
}

/**
 * Cache the file ID in localStorage
 */
export function cacheFileId(fileId: string): void {
  localStorage.setItem("infinity-drive-file-id", fileId);
}

/**
 * Clear cached file ID
 */
export function clearCachedFileId(): void {
  localStorage.removeItem("infinity-drive-file-id");
}

// ---- Shared (public link) file operations ----

/**
 * Create a new file in the user's regular Drive (not AppData) intended for sharing.
 * Returns the file ID which becomes the share token.
 */
export async function createSharedFile(
  name: string,
  data: any,
  parentFolderId?: string,
): Promise<string> {
  const metadata: Record<string, any> = { name, mimeType: "application/json" };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }
  const content = JSON.stringify(data, null, 2);

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  form.append("file", new Blob([content], { type: "application/json" }));

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create shared file: ${response.status}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Create a Google Form for event company registrations.
 * Requires Google Forms API enabled in the same project as the OAuth client.
 */
export async function createEventRegistrationForm(
  eventName: string,
): Promise<EventRegistrationForm> {
  const createResponse = await fetch(
    "https://forms.googleapis.com/v1/forms?unpublished=false",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        info: {
          title: `${eventName} Company Registration`,
          documentTitle: `${eventName} Company Registration`,
        },
      }),
    },
  );

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(
      `Failed to create Google Form: ${createResponse.status} ${text}`,
    );
  }

  const createdForm = await createResponse.json();
  const formId = String(createdForm?.formId || "").trim();
  const responderUri = String(createdForm?.responderUri || "").trim();

  if (!formId || !responderUri) {
    throw new Error("Google Form creation returned incomplete data.");
  }

  const updateResponse = await fetch(
    `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              location: { index: 0 },
              item: {
                title: "Company Name",
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false,
                    },
                  },
                },
              },
            },
          },
          {
            createItem: {
              location: { index: 1 },
              item: {
                title: "Company Share Link",
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false,
                    },
                  },
                },
              },
            },
          },
          {
            createItem: {
              location: { index: 2 },
              item: {
                title: "Event File ID",
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false,
                    },
                  },
                },
              },
            },
          },
        ],
      }),
    },
  );

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(
      `Failed to configure Google Form fields: ${updateResponse.status} ${text}`,
    );
  }

  const updateResult = await updateResponse.json();
  const replies = Array.isArray(updateResult?.replies)
    ? updateResult.replies
    : [];
  const questionIds = replies
    .map((reply: any) => {
      const ids = reply?.createItem?.questionId;
      return Array.isArray(ids) ? ids[0] : null;
    })
    .filter(Boolean);

  if (questionIds.length < 3) {
    throw new Error(
      "Google Form fields were created but question IDs were not returned.",
    );
  }

  try {
    const folders = await getOrCreateOrganizerFolders();
    await ensureFileInFolder(formId, folders.formsFolderId);
  } catch (error) {
    console.warn("Could not move form into app folder:", error);
  }

  try {
    await fetch(
      `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}:setPublishSettings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publishSettings: {
            publishState: {
              isPublished: true,
              isAcceptingResponses: true,
            },
          },
        }),
      },
    );
  } catch (error) {
    console.warn("Could not set publish settings on registration form:", error);
  }

  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(formId)}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "anyone",
          role: "reader",
          view: "published",
        }),
      },
    );
  } catch (error) {
    console.warn("Could not set anyone-with-link responder permission:", error);
  }

  return {
    formId,
    responderUri,
    editUri: createdForm?.linkedSheetId ? undefined : createdForm?.responderUri,
    questions: {
      companyNameQuestionId: String(questionIds[0]),
      companyLinkQuestionId: String(questionIds[1]),
      eventFileIdQuestionId: String(questionIds[2]),
    },
  };
}

/**
 * Submit a company registration to a Google Form.
 * This uses the public form submission endpoint so players can submit without
 * requiring write access to the organizer's event file.
 */
export async function submitCompanyRegistrationToForm(
  form: EventRegistrationForm,
  payload: {
    companyName: string;
    companyShareLink: string;
    eventFileId: string;
  },
): Promise<void> {
  const baseResponderUri = form.responderUri.replace(
    /\/viewform(?:\?.*)?$/,
    "",
  );
  const submitUrl = `${baseResponderUri}/formResponse`;
  const body = new URLSearchParams();
  const companyNameEntryId =
    form.responseEntries?.companyNameEntryId ||
    form.questions.companyNameQuestionId;
  const companyLinkEntryId =
    form.responseEntries?.companyLinkEntryId ||
    form.questions.companyLinkQuestionId;
  const eventFileIdEntryId =
    form.responseEntries?.eventFileIdEntryId ||
    form.questions.eventFileIdQuestionId;

  // The public form endpoint accepts entry.<questionId> fields.
  body.set(`entry.${companyNameEntryId}`, payload.companyName);
  body.set(`entry.${companyLinkEntryId}`, payload.companyShareLink);
  body.set(`entry.${eventFileIdEntryId}`, payload.eventFileId);

  await fetch(submitUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });
}

function getFormAnswerValue(formResponse: any, questionId: string): string {
  const answer = formResponse?.answers?.[questionId];
  const firstTextAnswer = answer?.textAnswers?.answers?.[0]?.value;
  return String(firstTextAnswer || "").trim();
}

/**
 * Read normalized registration submissions from a Google Form.
 */
export async function listEventRegistrationFormResponses(
  form: EventRegistrationForm,
): Promise<EventRegistrationSubmission[]> {
  const submissions: EventRegistrationSubmission[] = [];
  let nextPageToken = "";

  do {
    const pageQuery = new URLSearchParams();
    pageQuery.set("pageSize", "500");
    if (nextPageToken) pageQuery.set("pageToken", nextPageToken);

    const response = await fetch(
      `https://forms.googleapis.com/v1/forms/${encodeURIComponent(form.formId)}/responses?${pageQuery.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to read Google Form responses: ${response.status} ${text}`,
      );
    }

    const payload = await response.json();
    const formResponses = Array.isArray(payload?.responses)
      ? payload.responses
      : Array.isArray(payload?.formResponses)
        ? payload.formResponses
        : [];

    for (const formResponse of formResponses) {
      const companyName = getFormAnswerValue(
        formResponse,
        form.questions.companyNameQuestionId,
      );
      const companyShareLink = getFormAnswerValue(
        formResponse,
        form.questions.companyLinkQuestionId,
      );
      const eventFileId = getFormAnswerValue(
        formResponse,
        form.questions.eventFileIdQuestionId,
      );
      if (!companyName || !companyShareLink || !eventFileId) continue;

      submissions.push({
        companyName,
        companyShareLink,
        eventFileId,
        submittedAt: String(
          formResponse?.lastSubmittedTime ||
            formResponse?.createTime ||
            new Date().toISOString(),
        ),
      });
    }

    nextPageToken = String(payload?.nextPageToken || "").trim();
  } while (nextPageToken);

  return submissions;
}

/**
 * Make an existing Drive file readable by anyone with the link.
 */
export async function makeFilePublic(fileId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "anyone", role: "reader" }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to share file: ${response.status}`);
  }
}

/**
 * Update an existing shared file's content.
 */
export async function updateSharedFile(
  fileId: string,
  data: any,
): Promise<void> {
  await writeDataToDrive(fileId, data);
}

/**
 * Read a shared file by ID.
 * Requires drive.readonly scope — any signed-in user can read a file
 * that has been made public via makeFilePublic().
 */
export async function readSharedFile(fileId: string): Promise<any> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive API returned ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * Cache the shared file ID (the one this user owns and has shared out).
 */
export function cacheSharedFileId(fileId: string): void {
  localStorage.setItem("infinity-shared-file-id", fileId);
}

export function getCachedSharedFileId(): string | null {
  return localStorage.getItem("infinity-shared-file-id");
}

function normalizeAppDataDocument(raw: any): AppDataDocument {
  const events = Array.isArray(raw?.data?.events) ? raw.data.events : [];
  const companies = Array.isArray(raw?.data?.companies)
    ? raw.data.companies
    : [];
  const organizerRegistrationTemplate =
    raw?.data?.organizerRegistrationTemplate;
  const driveFolders = raw?.data?.driveFolders;

  return {
    version: Number(raw?.version || 1),
    updatedAt: raw?.updatedAt || new Date().toISOString(),
    data: {
      events,
      companies,
      organizerRegistrationTemplate,
      driveFolders,
    },
  };
}

async function findFolderByName(
  name: string,
  parentId?: string,
): Promise<string | null> {
  const parentClause = parentId ? `'${parentId}' in parents and ` : "";
  const escapedName = name.replace(/'/g, "\\'");

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: `${parentClause}mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and trashed=false`,
      fields: "files(id,name)",
      pageSize: "1",
    }).toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to find folder: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const folder = Array.isArray(payload?.files) ? payload.files[0] : null;
  return folder?.id || null;
}

async function createFolder(name: string, parentId?: string): Promise<string> {
  const metadata: Record<string, any> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create folder: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return String(payload?.id || "");
}

async function getOrCreateFolder(
  name: string,
  parentId?: string,
): Promise<string> {
  const existingId = await findFolderByName(name, parentId);
  if (existingId) return existingId;
  return createFolder(name, parentId);
}

async function ensureFileInFolder(
  fileId: string,
  folderId: string,
): Promise<void> {
  const metaResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=parents`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!metaResponse.ok) {
    const text = await metaResponse.text();
    throw new Error(
      `Failed to inspect file parents: ${metaResponse.status} ${text}`,
    );
  }

  const metadata = await metaResponse.json();
  const parents: string[] = Array.isArray(metadata?.parents)
    ? metadata.parents
    : [];
  if (parents.includes(folderId)) return;

  const removeParents = parents.join(",");
  const query = new URLSearchParams({
    addParents: folderId,
    fields: "id,parents",
  });
  if (removeParents) query.set("removeParents", removeParents);

  const moveResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${query.toString()}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!moveResponse.ok) {
    const text = await moveResponse.text();
    throw new Error(
      `Failed to move file into app folder: ${moveResponse.status} ${text}`,
    );
  }
}

export async function getOrCreateOrganizerFolders(): Promise<OrganizerFolders> {
  const { fileId, doc } = await readAppDataDocumentWithFileId();
  const cached = doc.data.driveFolders;

  const rootFolderId =
    cached?.rootFolderId || (await getOrCreateFolder(ROOT_FOLDER_NAME));
  const eventsFolderId =
    cached?.eventsFolderId ||
    (await getOrCreateFolder(EVENTS_FOLDER_NAME, rootFolderId));
  const companiesFolderId =
    cached?.companiesFolderId ||
    (await getOrCreateFolder(COMPANIES_FOLDER_NAME, rootFolderId));
  const formsFolderId =
    cached?.formsFolderId ||
    (await getOrCreateFolder(FORMS_FOLDER_NAME, rootFolderId));

  const folders: OrganizerFolders = {
    rootFolderId,
    eventsFolderId,
    companiesFolderId,
    formsFolderId,
  };

  await writeAppDataDocument(fileId, {
    ...doc,
    data: {
      ...doc.data,
      driveFolders: folders,
    },
  });

  return folders;
}

export async function getOrganizerRegistrationTemplate(): Promise<OrganizerRegistrationTemplate | null> {
  const { doc } = await readAppDataDocumentWithFileId();
  const template = doc.data.organizerRegistrationTemplate;
  if (!template) return null;
  if (!template.formId || !template.responderUri) return null;
  if (
    !template.questions?.companyNameQuestionId ||
    !template.questions?.companyLinkQuestionId ||
    !template.questions?.eventFileIdQuestionId
  ) {
    return null;
  }
  return template;
}

export async function saveOrganizerRegistrationTemplate(
  template: OrganizerRegistrationTemplate,
): Promise<void> {
  const { fileId, doc } = await readAppDataDocumentWithFileId();
  await writeAppDataDocument(fileId, {
    ...doc,
    data: {
      ...doc.data,
      organizerRegistrationTemplate: template,
    },
  });
}

async function readAppDataDocumentWithFileId(): Promise<{
  fileId: string;
  doc: AppDataDocument;
}> {
  const file = await getOrCreateDataFile();
  const raw = await readDataFromDrive(file.id);
  return { fileId: file.id, doc: normalizeAppDataDocument(raw) };
}

async function writeAppDataDocument(
  fileId: string,
  doc: AppDataDocument,
): Promise<void> {
  await writeDataToDrive(fileId, {
    ...doc,
    updatedAt: new Date().toISOString(),
  });
}

export async function listAppDataEventReferences(): Promise<
  AppDataEventReference[]
> {
  if (!isSignedIn()) return [];
  const { doc } = await readAppDataDocumentWithFileId();
  return doc.data.events;
}

export async function listAppDataCompanyReferences(): Promise<
  AppDataCompanyReference[]
> {
  if (!isSignedIn()) return [];
  const { doc } = await readAppDataDocumentWithFileId();
  return doc.data.companies;
}

export async function upsertAppDataEventReference(
  entry: AppDataEventReference,
): Promise<void> {
  const { fileId, doc } = await readAppDataDocumentWithFileId();
  const next = [...doc.data.events];
  const idx = next.findIndex((candidate) => candidate.fileId === entry.fileId);
  const payload = {
    ...entry,
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };

  if (idx >= 0) {
    next[idx] = payload;
  } else {
    next.push(payload);
  }

  await writeAppDataDocument(fileId, {
    ...doc,
    data: {
      ...doc.data,
      events: next,
    },
  });
}

export async function upsertAppDataCompanyReference(
  entry: AppDataCompanyReference,
): Promise<void> {
  const { fileId, doc } = await readAppDataDocumentWithFileId();
  const next = [...doc.data.companies];
  const idx = next.findIndex((candidate) => candidate.fileId === entry.fileId);
  const payload = {
    ...entry,
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };

  if (idx >= 0) {
    next[idx] = payload;
  } else {
    next.push(payload);
  }

  await writeAppDataDocument(fileId, {
    ...doc,
    data: {
      ...doc.data,
      companies: next,
    },
  });
}

/**
 * Delete a Drive file by ID.
 * Only works on files you have permission to delete.
 */
export async function deleteSharedFile(fileId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status}`);
  }
}

/**
 * Check if a Drive file is accessible without reading its content.
 * Returns true if file exists and is readable, false otherwise.
 */
export async function checkSharedFileAccess(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Remove a company reference from appdata index.
 */
export async function removeAppDataCompanyReference(
  fileId: string,
): Promise<void> {
  const { fileId: appDataFileId, doc } = await readAppDataDocumentWithFileId();
  const next = doc.data.companies.filter(
    (company) => company.fileId !== fileId,
  );

  await writeAppDataDocument(appDataFileId, {
    ...doc,
    data: {
      ...doc.data,
      companies: next,
    },
  });
}

/**
 * Remove an event reference from appdata index.
 */
export async function removeAppDataEventReference(
  fileId: string,
): Promise<void> {
  const { fileId: appDataFileId, doc } = await readAppDataDocumentWithFileId();
  const next = doc.data.events.filter((event) => event.fileId !== fileId);

  await writeAppDataDocument(appDataFileId, {
    ...doc,
    data: {
      ...doc.data,
      events: next,
    },
  });
}
