import { useEffect, useRef, useState } from "react";
import { factionList } from "../lib/mercs/metadata";
import type { FactionMetadata } from "../lib/mercs/types";
import { companyTypes } from "../data/companyTypes";
import {
  CompanyTypeDetail,
  type CompanyTypeVariant,
  ICON_PATHS,
} from "./CompanyTypeDetail";
import { createLocalCompany } from "../lib/mercs/companyStore";
import {
  createSharedFile,
  getOrCreateOrganizerFolders,
  isSignedIn,
  makeFilePublic,
  readSharedFile,
  submitCompanyRegistrationToForm,
  type EventRegistrationForm,
  updateSharedFile,
  upsertAppDataCompanyReference,
  upsertAppDataEventReference,
} from "../lib/google-drive-adapter";
import { AppIcon } from "./AppIcon";
import { CaptainCreatorStep } from "./CaptainCreatorStep";

type WizardStep = "name" | "companyType" | "sectorials" | "captain" | "share";

const STEPS: WizardStep[] = [
  "name",
  "companyType",
  "sectorials",
  "captain",
  "share",
];

const STEP_LABELS: Record<WizardStep, string> = {
  name: "Name",
  companyType: "Company Type",
  sectorials: "Sectorials",
  captain: "Captain",
  share: "Share",
};

type LinkedEvent = {
  fileId: string;
  name: string;
  startDate?: string;
  registrationForm?: EventRegistrationForm;
};

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
    // fall through and attempt to interpret as a raw ID
  }

  return /^[a-zA-Z0-9_-]{10,}$/.test(trimmed) ? trimmed : null;
}

function FactionSelector({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: FactionMetadata | null;
  options: FactionMetadata[];
  placeholder: string;
  onChange: (faction: FactionMetadata | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className={`faction-selector${open ? " is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="faction-selector__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <span className="faction-selector__selected">
            {value.logo && (
              <img
                src={value.logo}
                alt=""
                aria-hidden="true"
                className="faction-selector__logo"
              />
            )}
            <span>{value.name}</span>
          </span>
        ) : (
          <span className="faction-selector__placeholder">{placeholder}</span>
        )}
        <AppIcon name="down" size={15} />
      </button>

      {open && (
        <ul className="faction-selector__list" role="listbox">
          <li
            role="option"
            aria-selected={!value}
            className={`faction-selector__option${!value ? " is-selected" : ""}`}
            onPointerDown={(e) => {
              e.preventDefault();
              onChange(null);
              setOpen(false);
            }}
          >
            <span className="faction-selector__placeholder">{placeholder}</span>
          </li>
          {options.map((faction) => (
            <li
              key={faction.id}
              role="option"
              aria-selected={value?.id === faction.id}
              className={`faction-selector__option${value?.id === faction.id ? " is-selected" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                onChange(faction);
                setOpen(false);
              }}
            >
              {faction.logo && (
                <img
                  src={faction.logo}
                  alt=""
                  aria-hidden="true"
                  className="faction-selector__logo"
                />
              )}
              <span>{faction.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function isVanillaArmy(faction: FactionMetadata): boolean {
  return faction.id === faction.parent;
}

const activeFactions = factionList.filter((f) => !f.discontinued);

export default function CreateCompanyWizard({
  onCancel,
}: {
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<WizardStep>("name");
  const [name, setName] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [linkedEvent, setLinkedEvent] = useState<LinkedEvent | null>(null);
  const [eventLookupLoading, setEventLookupLoading] = useState(false);
  const [eventLookupError, setEventLookupError] = useState<string | null>(null);
  const [companyTypeId, setCompanyTypeId] = useState("");
  const [sectorial1, setSectorial1] = useState<FactionMetadata | null>(null);
  const [sectorial2, setSectorial2] = useState<FactionMetadata | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const isStandard = companyTypeId === "standard";
  const s1IsVanilla = sectorial1 ? isVanillaArmy(sectorial1) : false;
  const showSectorial2 = isStandard && !s1IsVanilla;
  const availableSectorials = isStandard
    ? activeFactions
    : activeFactions.filter((f) => !isVanillaArmy(f));

  const currentStepIndex = STEPS.indexOf(step);

  function cancelWizard() {
    if (onCancel) {
      onCancel();
      return;
    }
    window.location.href = "/companies/";
  }

  function canAdvance(): boolean {
    if (step === "name") {
      if (!name.trim()) return false;
      if (eventLookupLoading) return false;
      if (eventLink.trim() && !linkedEvent) return false;
      return true;
    }
    if (step === "companyType") return !!companyTypeId;
    if (step === "sectorials") {
      if (!sectorial1) return false;
      if (showSectorial2 && !sectorial2) return false;
      if (sectorial1 && sectorial2 && sectorial1.id === sectorial2.id)
        return false;
      return true;
    }
    return false;
  }

  function handleNext() {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  }

  function handleBack() {
    if (currentStepIndex === 0) {
      cancelWizard();
    } else {
      setStep(STEPS[currentStepIndex - 1]);
    }
  }

  function handleCompanyTypeChange(id: string) {
    setCompanyTypeId(id);
    if (id !== "standard" && sectorial1 && isVanillaArmy(sectorial1)) {
      setSectorial1(null);
      setSectorial2(null);
    }
  }

  async function handleCaptainConfirm(trooper: any) {
    if (!isSignedIn()) {
      setWizardError(
        "Sign in with Google before creating and sharing a company file.",
      );
      return;
    }

    if (eventLink.trim() && !linkedEvent) {
      setWizardError(
        "The event link could not be validated. Fix it or clear it before continuing.",
      );
      return;
    }

    setWizardError(null);
    setCreatingShare(true);

    const company = createLocalCompany({
      name: name.trim(),
      companyTypeId,
      sectorial1,
      sectorial2: showSectorial2 ? sectorial2 : null,
    });

    const withCaptain = {
      ...company,
      troopers: [trooper],
      eventFileId: linkedEvent?.fileId,
      eventName: linkedEvent?.name,
      eventLink: eventLink.trim() || undefined,
    };

    try {
      const timestamp = new Date().toISOString();
      const companyFilePayload = {
        schemaVersion: 1,
        kind: "infinity-mercenaries-company",
        createdAt: timestamp,
        updatedAt: timestamp,
        company: withCaptain,
        event: linkedEvent
          ? {
              fileId: linkedEvent.fileId,
              name: linkedEvent.name,
              link: eventLink.trim(),
            }
          : null,
      };

      const fileName = `mercs-company-${name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.json`;
      const folders = await getOrCreateOrganizerFolders();
      const fileId = await createSharedFile(
        fileName,
        companyFilePayload,
        folders.companiesFolderId,
      );
      await makeFilePublic(fileId);

      const companyShareLink = `${window.location.origin}/view?id=${encodeURIComponent(fileId)}`;

      let companyEventFileId: string | undefined;
      let companyEventShareLink: string | undefined;

      if (linkedEvent) {
        const companyEventPayload = {
          schemaVersion: 1,
          kind: "infinity-mercenaries-company-event",
          updatedAt: timestamp,
          event: {
            fileId: linkedEvent.fileId,
            name: linkedEvent.name,
            link: eventLink.trim() || undefined,
          },
          company: {
            id: withCaptain.id,
            name: withCaptain.name,
            companyFileId: fileId,
            companyShareLink,
          },
          pairings: {},
        };

        const companyEventFileName = `mercs-company-event-${name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.json`;
        companyEventFileId = await createSharedFile(
          companyEventFileName,
          companyEventPayload,
          folders.eventsFolderId,
        );
        await makeFilePublic(companyEventFileId);
        companyEventShareLink = `${window.location.origin}/view?id=${encodeURIComponent(companyEventFileId)}`;

        await updateSharedFile(fileId, {
          ...companyFilePayload,
          updatedAt: new Date().toISOString(),
          company: {
            ...withCaptain,
            shareFileId: fileId,
            shareLink: companyShareLink,
            companyEventFileId,
            companyEventShareLink,
          },
          event: {
            fileId: linkedEvent.fileId,
            name: linkedEvent.name,
            link: eventLink.trim(),
            companyEventFileId,
            companyEventShareLink,
          },
          companyEventFile: {
            fileId: companyEventFileId,
            shareLink: companyEventShareLink,
          },
        });
      }

      const withShare = {
        ...withCaptain,
        shareFileId: fileId,
        shareLink: companyShareLink,
        companyEventFileId,
        companyEventShareLink,
      };

      await upsertAppDataCompanyReference({
        companyId: withShare.id,
        name: withShare.name,
        fileId,
        shareLink: companyShareLink,
        eventFileId: linkedEvent?.fileId,
        eventName: linkedEvent?.name,
        updatedAt: timestamp,
      });

      if (linkedEvent) {
        await upsertAppDataEventReference({
          fileId: linkedEvent.fileId,
          name: linkedEvent.name,
          shareLink: eventLink.trim() || undefined,
          startDate: linkedEvent.startDate,
          updatedAt: timestamp,
        });
      }

      if (linkedEvent?.registrationForm) {
        await submitCompanyRegistrationToForm(linkedEvent.registrationForm, {
          companyName: withShare.name,
          companyShareLink,
          eventFileId: linkedEvent.fileId,
        });
      }

      setShareLink(companyShareLink);
      setStep("share");
    } catch (error) {
      console.error("Failed to create company share file:", error);
      setWizardError(
        `Failed to create shareable company file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setCreatingShare(false);
    }
  }

  useEffect(() => {
    const trimmed = eventLink.trim();
    if (!trimmed) {
      setLinkedEvent(null);
      setEventLookupError(null);
      setEventLookupLoading(false);
      return;
    }

    const fileId = extractFileId(trimmed);
    if (!fileId) {
      setLinkedEvent(null);
      setEventLookupError("Event link format is invalid.");
      return;
    }

    if (!isSignedIn()) {
      setLinkedEvent(null);
      setEventLookupError("Sign in with Google to validate event links.");
      return;
    }

    const timeout = window.setTimeout(async () => {
      setEventLookupLoading(true);
      setEventLookupError(null);

      try {
        const payload = await readSharedFile(fileId);
        if (!payload || payload.kind !== "infinity-mercenaries-event") {
          setLinkedEvent(null);
          setEventLookupError("The linked file is not a valid event file.");
          return;
        }

        const eventName = String(payload?.event?.name || "").trim();
        if (!eventName) {
          setLinkedEvent(null);
          setEventLookupError("The event file is missing an event name.");
          return;
        }

        const registrationForm = payload?.registrationForm;
        if (
          !registrationForm ||
          typeof registrationForm.formId !== "string" ||
          typeof registrationForm.responderUri !== "string" ||
          !registrationForm.questions ||
          typeof registrationForm.questions.companyNameQuestionId !==
            "string" ||
          typeof registrationForm.questions.companyLinkQuestionId !==
            "string" ||
          typeof registrationForm.questions.eventFileIdQuestionId !== "string"
        ) {
          setLinkedEvent(null);
          setEventLookupError(
            "This event is missing registration form metadata. Recreate the event file.",
          );
          return;
        }

        setLinkedEvent({
          fileId,
          name: eventName,
          startDate: payload?.event?.startDate,
          registrationForm,
        });
        if (!registrationForm.responseEntries) {
          setEventLookupError(
            "Event linked, but responder entry IDs are not configured yet. Auto-submit may fail until those are saved from the event page dev tools.",
          );
        } else {
          setEventLookupError(null);
        }
      } catch (error) {
        setLinkedEvent(null);
        setEventLookupError(
          `Could not load event data: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setEventLookupLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [eventLink]);

  return (
    <section
      className="company-manager company-wizard"
      aria-label="Create company"
    >
      <div className="company-wizard__masthead">
        <div>
          <p className="eyebrow">Company Command</p>
          <h1>Create Company</h1>
        </div>
        <button className="command-button" type="button" onClick={cancelWizard}>
          Cancel
        </button>
      </div>

      <nav className="company-wizard__steps" aria-label="Setup steps">
        {STEPS.map((s, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = step === s;
          const isFuture = index > currentStepIndex;
          return (
            <div
              key={s}
              className={[
                "company-wizard__step-indicator",
                isComplete ? "is-complete" : "",
                isCurrent ? "is-current" : "",
                isFuture ? "is-future" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="company-wizard__step-number">
                {isComplete ? <AppIcon name="check" size={14} /> : index + 1}
              </span>
              <span className="company-wizard__step-label">
                {STEP_LABELS[s]}
              </span>
            </div>
          );
        })}
      </nav>

      <div className="company-wizard__body">
        {step === "name" && (
          <div className="company-wizard__panel">
            <h2>Name Your Company</h2>
            <p>
              Every company needs a name. Optionally attach an event link to
              import event context.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canAdvance()) handleNext();
              }}
            >
              <label className="field">
                <span>Company Name</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Iron Wasp"
                />
              </label>

              <label className="field">
                <span>Event Link (optional)</span>
                <input
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  placeholder="Paste event share URL"
                />
                {eventLookupLoading && <small>Checking event link...</small>}
                {!eventLookupLoading && linkedEvent && (
                  <small>Linked event: {linkedEvent.name}</small>
                )}
                {!eventLookupLoading && eventLookupError && (
                  <small className="company-wizard__error-text">
                    {eventLookupError}
                  </small>
                )}
              </label>
            </form>
          </div>
        )}

        {step === "companyType" && (
          <div className="company-wizard__panel">
            <h2>Choose a Company Type</h2>
            <p>
              Company type shapes your roster rules, setup requirements, and any
              special benefits or restrictions.
            </p>
            <div className="company-wizard__type-grid">
              {companyTypes.map((type) => (
                <button
                  key={type.id}
                  className={[
                    "company-wizard__type-card",
                    `variant-${type.id}`,
                    companyTypeId === type.id ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  onClick={() => handleCompanyTypeChange(type.id)}
                >
                  <strong>{type.name}</strong>
                  <span>{type.tagline}</span>
                  <span
                    className="company-wizard__type-card-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      dangerouslySetInnerHTML={{
                        __html: ICON_PATHS[type.id] ?? "",
                      }}
                    />
                  </span>
                </button>
              ))}
            </div>
            {companyTypeId && (
              <div className="company-wizard__type-detail">
                <CompanyTypeDetail
                  variant={companyTypeId as CompanyTypeVariant}
                />
              </div>
            )}
          </div>
        )}

        {step === "sectorials" && (
          <div className="company-wizard__panel">
            <h2>Choose Sectorials</h2>
            <p>
              {isStandard
                ? "Standard Company: select 2 sectorials, or 1 vanilla army."
                : "Select the 1 sectorial your Captain and roster draw from."}
            </p>
            <div className="company-wizard__sectorial-grid">
              <div className="field">
                <span>Sectorial 1</span>
                <FactionSelector
                  value={sectorial1}
                  options={availableSectorials}
                  placeholder="Select a faction…"
                  onChange={(faction) => {
                    setSectorial1(faction);
                    if (
                      !faction ||
                      isVanillaArmy(faction) ||
                      sectorial2?.id === faction.id
                    ) {
                      setSectorial2(null);
                    }
                  }}
                />
              </div>

              {showSectorial2 && (
                <div className="field">
                  <span>Sectorial 2</span>
                  <FactionSelector
                    value={sectorial2}
                    options={activeFactions.filter(
                      (f) => !isVanillaArmy(f) && f.id !== sectorial1?.id,
                    )}
                    placeholder="Select a second faction…"
                    onChange={setSectorial2}
                  />
                </div>
              )}

              {sectorial1 && isStandard && s1IsVanilla && (
                <p className="company-wizard__note">
                  Vanilla armies count as a single selection — no second
                  sectorial needed.
                </p>
              )}

              {sectorial1 && sectorial2 && sectorial1.id === sectorial2.id && (
                <p className="company-wizard__error">
                  Sectorials must be different factions.
                </p>
              )}
            </div>
          </div>
        )}

        {step === "captain" && (
          <div className="company-wizard__panel company-wizard__panel--captain">
            <h2>Choose Your Captain</h2>
            <p>
              Select a Lieutenant or Infinity Spec-Ops eligible trooper from
              your sectorials. They will receive Spec-Ops improvements up to 28
              points.
            </p>
            <p className="company-wizard__note">
              After captain setup, a shareable company Drive file is created and
              you will receive a link to send to the organizer.
            </p>
            <CaptainCreatorStep
              companyTypeId={companyTypeId}
              existingTroopers={[]}
              sectorialSlugs={
                [sectorial1?.slug, sectorial2?.slug].filter(Boolean) as string[]
              }
              onConfirm={handleCaptainConfirm}
            />
            {creatingShare && (
              <p className="company-wizard__note">
                Creating shareable company file...
              </p>
            )}
          </div>
        )}

        {step === "share" && (
          <div className="company-wizard__panel">
            <h2>Company File Ready</h2>
            <p>
              Your company file has been created and shared in Google Drive.
            </p>
            {shareLink && (
              <label className="field">
                <span>Company Link</span>
                <input
                  readOnly
                  value={shareLink}
                  onClick={(event) =>
                    (event.target as HTMLInputElement).select()
                  }
                />
                <small>Give this link to the event organizer.</small>
              </label>
            )}
            <p className="company-wizard__note">
              If you linked an event, your app data now tracks both this company
              and the event for future sessions.
            </p>
          </div>
        )}
      </div>

      {wizardError && <p className="company-wizard__error">{wizardError}</p>}

      <footer className="company-wizard__footer">
        <button
          className="command-button"
          type="button"
          onClick={step === "share" ? cancelWizard : handleBack}
        >
          {currentStepIndex === 0 ? "Cancel" : "Back"}
        </button>

        {step !== "captain" && step !== "share" && (
          <button
            className="command-button command-button--primary"
            type="button"
            disabled={!canAdvance()}
            onClick={handleNext}
          >
            Next
          </button>
        )}

        {step === "share" && shareLink && (
          <a
            className="command-button command-button--primary"
            href={shareLink}
          >
            Open Shared Company File
          </a>
        )}
      </footer>
    </section>
  );
}
