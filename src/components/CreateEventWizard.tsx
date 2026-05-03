import { useEffect, useState } from "react";
import { AppIcon } from "./AppIcon";
import {
  createEventRegistrationForm,
  createSharedFile,
  getOrCreateOrganizerFolders,
  getCurrentUserName,
  getOrganizerRegistrationTemplate,
  isSignedIn,
  makeFilePublic,
  saveOrganizerRegistrationTemplate,
  subscribeAuthState,
  type EventRegistrationForm,
  type OrganizerRegistrationTemplate,
  upsertAppDataEventReference,
} from "../lib/google-drive-adapter";

type WizardStep = "details" | "setup" | "complete";

const STEPS: WizardStep[] = ["details", "setup", "complete"];

const STEP_LABELS: Record<WizardStep, string> = {
  details: "General Details",
  setup: "Event Setup",
  complete: "Share Link",
};

type EventDetails = {
  name: string;
  description: string;
  location: string;
  maxPlayers: string;
  startDate: string;
  endDate: string;
  rounds: string;
  startingCr: string;
};

function makeSlug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "event";
}

function toIsoDate(dateString: string): string | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
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

export default function CreateEventWizard() {
  const [step, setStep] = useState<WizardStep>("details");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
  const [registrationFormLink, setRegistrationFormLink] = useState<
    string | null
  >(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [registrationTemplate, setRegistrationTemplate] =
    useState<OrganizerRegistrationTemplate | null>(null);
  const [onboardingForm, setOnboardingForm] =
    useState<EventRegistrationForm | null>(null);
  const [onboardingPrefilledLink, setOnboardingPrefilledLink] = useState("");
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(
    null,
  );
  const [details, setDetails] = useState<EventDetails>({
    name: "",
    description: "",
    location: "",
    maxPlayers: "",
    startDate: "",
    endDate: "",
    rounds: "",
    startingCr: "75",
  });

  // Keep sign-in state fresh while this panel is open.
  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setRegistrationTemplate(null);
      return;
    }

    let alive = true;
    setTemplateLoading(true);
    getOrganizerRegistrationTemplate()
      .then((template) => {
        if (!alive) return;
        if (
          template &&
          template.responseEntries?.companyNameEntryId &&
          template.responseEntries?.companyLinkEntryId &&
          template.responseEntries?.eventFileIdEntryId
        ) {
          setRegistrationTemplate(template);
          setRegistrationFormLink(template.responderUri);
        } else {
          setRegistrationTemplate(null);
        }
      })
      .catch((loadError) => {
        if (!alive) return;
        console.error(
          "Failed to load organizer registration template:",
          loadError,
        );
        setRegistrationTemplate(null);
      })
      .finally(() => {
        if (alive) setTemplateLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [signedIn]);

  const currentStepIndex = STEPS.indexOf(step);

  function updateField(field: keyof EventDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function canContinueFromDetails(): boolean {
    if (!details.name.trim()) return false;
    if (!details.startDate) return false;
    return true;
  }

  function canContinueFromSetup(): boolean {
    if (!details.startingCr.trim()) return false;
    const cr = Number(details.startingCr);
    if (!Number.isFinite(cr) || cr <= 0) return false;
    return true;
  }

  function handleNext() {
    if (step === "details" && canContinueFromDetails()) {
      setStep("setup");
      return;
    }
  }

  function handleBack() {
    if (step === "setup") {
      setStep("details");
    }
  }

  async function handleCreateOrganizerForm() {
    try {
      setOnboardingBusy(true);
      setOnboardingError(null);
      setOnboardingSuccess(null);
      const form = await createEventRegistrationForm(
        "Infinity Mercenaries Organizer Registrations",
      );
      setOnboardingForm(form);
      setRegistrationFormLink(form.responderUri);
      setOnboardingSuccess(
        "Registration form created. Follow the instructions below to capture responder IDs once.",
      );
    } catch (err) {
      console.error("Failed to create organizer registration form:", err);
      setOnboardingError(
        `Could not create registration form: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setOnboardingBusy(false);
    }
  }

  async function handleSaveOrganizerTemplate() {
    const parsed = parseResponseEntryIdsFromPrefilledLink(
      onboardingPrefilledLink,
    );
    if (!parsed) {
      setOnboardingError(
        "Could not parse the prefilled URL. Use placeholders COMPANY_NAME, COMPANY_LINK, and EVENT_FILE_ID when generating the prefilled link.",
      );
      return;
    }

    const baseTemplate = onboardingForm;
    if (!baseTemplate) {
      setOnboardingError("Create the organizer registration form first.");
      return;
    }

    try {
      setOnboardingBusy(true);
      setOnboardingError(null);
      const template: OrganizerRegistrationTemplate = {
        ...baseTemplate,
        responseEntries: parsed,
      };
      await saveOrganizerRegistrationTemplate(template);
      setRegistrationTemplate(template);
      setRegistrationFormLink(template.responderUri);
      setOnboardingSuccess(
        "Organizer registration template saved. Future event creation can skip this setup.",
      );
      setOnboardingPrefilledLink("");
    } catch (err) {
      console.error("Failed saving organizer registration template:", err);
      setOnboardingError(
        `Could not save organizer template: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setOnboardingBusy(false);
    }
  }

  async function handleCreateEventFile() {
    if (!signedIn) {
      setError("Sign in with Google before creating an event file.");
      return;
    }

    if (!canContinueFromSetup()) {
      setError("Please provide a valid starting CR before creating the event.");
      return;
    }

    if (!registrationTemplate) {
      setError(
        "Complete organizer onboarding first so event registrations can be submitted.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const timestamp = new Date().toISOString();
      const startingCr = Number(details.startingCr);
      const roundCount = details.rounds ? Number(details.rounds) : undefined;
      const maxPlayers = details.maxPlayers
        ? Number(details.maxPlayers)
        : undefined;
      const registrationForm = registrationTemplate;

      const eventPayload = {
        schemaVersion: 1,
        kind: "infinity-mercenaries-event",
        createdAt: timestamp,
        updatedAt: timestamp,
        organizer: {
          name: getCurrentUserName() || "Organizer",
        },
        event: {
          name: details.name.trim(),
          description: details.description.trim() || "",
          location: details.location.trim() || "",
          maxPlayers: Number.isFinite(maxPlayers as number)
            ? maxPlayers
            : undefined,
          startDate: toIsoDate(details.startDate),
          endDate: toIsoDate(details.endDate),
          rounds: Number.isFinite(roundCount as number)
            ? roundCount
            : undefined,
          startingCr,
          rules: {
            allEnabled: true,
            note: "All rules are currently enabled. Organizer restrictions will be configurable in a future update.",
          },
        },
        registrationForm,
        participants: [],
        registeredCompanies: [],
      };

      const fileName = `mercs-event-${makeSlug(details.name)}-${Date.now()}.json`;
      const folders = await getOrCreateOrganizerFolders();
      const fileId = await createSharedFile(
        fileName,
        eventPayload,
        folders.eventsFolderId,
      );
      await makeFilePublic(fileId);

      const playerLink = `${window.location.origin}/events/manage/?fileId=${encodeURIComponent(fileId)}`;

      await upsertAppDataEventReference({
        fileId,
        name: details.name.trim(),
        shareLink: playerLink,
        location: details.location.trim() || undefined,
        description: details.description.trim() || undefined,
        startDate: toIsoDate(details.startDate),
        updatedAt: timestamp,
      });

      setShareLink(playerLink);
      setDriveFileLink(
        `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`,
      );
      setRegistrationFormLink(registrationForm.responderUri);
      setStep("complete");
    } catch (err) {
      console.error("Failed to create event file:", err);
      setError(
        `Failed to create shareable event file: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="company-section-card event-create-card event-create-wizard"
      aria-label="Create event"
    >
      <div className="company-wizard__masthead">
        <div>
          <p className="eyebrow">Organizer Tools</p>
          <h2>Create Event File</h2>
        </div>
      </div>

      {registrationTemplate && (
        <nav className="company-wizard__steps" aria-label="Event setup steps">
          {STEPS.map((entry, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = entry === step;
            return (
              <div
                key={entry}
                className={[
                  "company-wizard__step-indicator",
                  isComplete ? "is-complete" : "",
                  isCurrent ? "is-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="company-wizard__step-number">
                  {isComplete ? <AppIcon name="check" size={14} /> : index + 1}
                </span>
                <span className="company-wizard__step-label">
                  {STEP_LABELS[entry]}
                </span>
              </div>
            );
          })}
        </nav>
      )}

      {!signedIn && (
        <p className="legacy-empty-note event-wizard-note">
          Sign in with Google first. Event creation is only supported for
          organizers with Drive and Forms create/edit permissions.
        </p>
      )}

      {!templateLoading && signedIn && !registrationTemplate && (
        <div className="company-wizard__panel">
          <h3>Organizer Onboarding (One-Time)</h3>
          <p>
            Before creating events, we create one reusable registration form for
            your account. This keeps setup simple and lets all your events share
            one response pipeline.
          </p>

          {!onboardingForm ? (
            <div className="wizard-actions-row">
              <button
                type="button"
                className="command-button command-button--primary"
                onClick={handleCreateOrganizerForm}
                disabled={onboardingBusy}
              >
                {onboardingBusy
                  ? "Creating Form..."
                  : "Create My Registration Form"}
              </button>
            </div>
          ) : (
            <>
              <section
                className="procedure-card"
                aria-label="Capture responder entry IDs"
              >
                <header>
                  <span>Procedure</span>
                  <strong>Capture Responder Entry IDs</strong>
                </header>
                <ol>
                  <li>Open the prefill page linked below.</li>
                  <li>
                    Generate a prefilled URL using placeholders COMPANY_NAME,
                    COMPANY_LINK, and EVENT_FILE_ID.
                  </li>
                  <li>Paste that generated URL into the field below.</li>
                </ol>
              </section>
              <p className="event-wizard-file-note">
                <a
                  href={`https://docs.google.com/forms/d/${encodeURIComponent(onboardingForm.formId)}/prefill`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open prefill page
                </a>
              </p>
              <label className="field">
                <span>Paste Prefilled URL</span>
                <input
                  value={onboardingPrefilledLink}
                  onChange={(event) =>
                    setOnboardingPrefilledLink(event.target.value)
                  }
                  placeholder="Paste the prefilled Google Form URL"
                />
              </label>
              <div className="wizard-actions-row">
                <button
                  type="button"
                  className="command-button command-button--primary"
                  onClick={handleSaveOrganizerTemplate}
                  disabled={onboardingBusy || !onboardingPrefilledLink.trim()}
                >
                  {onboardingBusy ? "Saving..." : "Save and Continue"}
                </button>
              </div>
            </>
          )}

          {onboardingError && (
            <p className="legacy-empty-note">{onboardingError}</p>
          )}
          {onboardingSuccess && (
            <p className="info-message">{onboardingSuccess}</p>
          )}
        </div>
      )}

      {registrationTemplate && step === "details" && (
        <div className="company-wizard__panel">
          <h3>General Details</h3>
          <p>
            Set core event information that will be shared with all players.
          </p>

          <div className="event-form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={details.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. NeoTerra Summer Circuit"
              />
            </label>

            <label className="field">
              <span>Start Date</span>
              <input
                type="date"
                value={details.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Description (optional)</span>
              <textarea
                value={details.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe the event format or theme"
              />
            </label>

            <label className="field">
              <span>Location (optional)</span>
              <input
                value={details.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="Store, city, or online platform"
              />
            </label>

            <label className="field">
              <span>Max Players (optional)</span>
              <input
                type="number"
                min="0"
                value={details.maxPlayers}
                onChange={(event) =>
                  updateField("maxPlayers", event.target.value)
                }
                placeholder="Unlimited"
              />
            </label>

            <label className="field">
              <span>End Date (optional)</span>
              <input
                type="date"
                value={details.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </label>
          </div>

          <div className="wizard-actions-row">
            <button
              type="button"
              className="command-button command-button--primary"
              onClick={handleNext}
              disabled={!signedIn || !canContinueFromDetails()}
            >
              Next: Event Setup
            </button>
          </div>
        </div>
      )}

      {registrationTemplate && step === "setup" && (
        <div className="company-wizard__panel">
          <h3>Event Setup</h3>
          <p>Configure rounds and starting conditions for all players.</p>

          <div className="event-form-grid event-form-grid--compact">
            <label className="field">
              <span>Number of Rounds (optional)</span>
              <input
                type="number"
                min="0"
                value={details.rounds}
                onChange={(event) => updateField("rounds", event.target.value)}
                placeholder="e.g. 4"
              />
            </label>

            <label className="field">
              <span>Starting CR</span>
              <input
                type="number"
                min="1"
                value={details.startingCr}
                onChange={(event) =>
                  updateField("startingCr", event.target.value)
                }
              />
            </label>
          </div>

          <div className="event-cr-suggestions">
            <p className="panel-kicker">Recommended Starting CR</p>
            <ul>
              <li>
                <strong>60 CR</strong>: Slow-burn campaigns where companies grow
                over many rounds.
              </li>
              <li>
                <strong>75 CR</strong>: Standard recommendation and most
                playtested default.
              </li>
              <li>
                <strong>90 CR</strong>: Higher-powered starts for shorter or
                experienced-group events.
              </li>
            </ul>
            <p className="legacy-empty-note">
              Rules selection controls are coming later. For now, all rules
              remain enabled.
            </p>
          </div>

          <div className="wizard-actions-row">
            <button
              type="button"
              className="command-button"
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="button"
              className="command-button command-button--primary"
              onClick={handleCreateEventFile}
              disabled={!signedIn || loading || !canContinueFromSetup()}
            >
              {loading
                ? "Creating Event File..."
                : "Create Shareable Event File"}
            </button>
          </div>
        </div>
      )}

      {registrationTemplate && step === "complete" && (
        <div className="company-wizard__panel">
          <h3>Event File Ready</h3>
          <p>
            Your event JSON file and registration Google Form were created and
            are now ready.
          </p>

          {shareLink && (
            <label className="field">
              <span>Event Link (share this with players)</span>
              <input
                readOnly
                value={shareLink}
                onClick={(event) => (event.target as HTMLInputElement).select()}
              />
            </label>
          )}

          {driveFileLink && (
            <p className="event-wizard-file-note">
              This is the event file in your Google Drive:{" "}
              <a href={driveFileLink} target="_blank" rel="noreferrer">
                Open file in Drive
              </a>
            </p>
          )}

          {registrationFormLink && (
            <p className="event-wizard-file-note">
              This is the registration form players submit to:{" "}
              <a href={registrationFormLink} target="_blank" rel="noreferrer">
                Open registration form
              </a>
            </p>
          )}

          <div className="event-wizard-warning">
            <strong>Important:</strong> Do not edit this file directly in Drive.
            Copy the event link above and give it to players.
          </div>

          <p className="legacy-empty-note">
            Players can now attach this event during company creation. Their
            company link will be auto-submitted to the registration form.
          </p>
        </div>
      )}

      {error && <p className="legacy-empty-note">{error}</p>}
    </section>
  );
}
