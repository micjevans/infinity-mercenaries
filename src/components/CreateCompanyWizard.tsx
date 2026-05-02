import { useEffect, useRef, useState } from "react";
import { factionList } from "../lib/mercs/metadata";
import type { FactionMetadata } from "../lib/mercs/types";
import { companyTypes } from "../data/companyTypes";
import {
  CompanyTypeDetail,
  type CompanyTypeVariant,
  ICON_PATHS,
} from "./CompanyTypeDetail";
import {
  createLocalCompany,
  loadLocalCompanies,
  saveLocalCompanies,
} from "../lib/mercs/companyStore";
import { AppIcon } from "./AppIcon";
import { CaptainCreatorStep } from "./CaptainCreatorStep";

type WizardStep = "name" | "companyType" | "sectorials" | "captain";

const STEPS: WizardStep[] = ["name", "companyType", "sectorials", "captain"];

const STEP_LABELS: Record<WizardStep, string> = {
  name: "Name",
  companyType: "Company Type",
  sectorials: "Sectorials",
  captain: "Captain",
};

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
  onCancel: () => void;
}) {
  const [step, setStep] = useState<WizardStep>("name");
  const [name, setName] = useState("");
  const [companyTypeId, setCompanyTypeId] = useState("");
  const [sectorial1, setSectorial1] = useState<FactionMetadata | null>(null);
  const [sectorial2, setSectorial2] = useState<FactionMetadata | null>(null);

  const isStandard = companyTypeId === "standard";
  const s1IsVanilla = sectorial1 ? isVanillaArmy(sectorial1) : false;
  const showSectorial2 = isStandard && !s1IsVanilla;
  const availableSectorials = isStandard
    ? activeFactions
    : activeFactions.filter((f) => !isVanillaArmy(f));

  const currentStepIndex = STEPS.indexOf(step);

  function canAdvance(): boolean {
    if (step === "name") return name.trim().length > 0;
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
      onCancel();
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

  function handleCaptainConfirm(trooper: any) {
    const company = createLocalCompany({
      name: name.trim(),
      companyTypeId,
      sectorial1,
      sectorial2: showSectorial2 ? sectorial2 : null,
    });
    const withCaptain = { ...company, troopers: [trooper] };
    const existing = loadLocalCompanies();
    saveLocalCompanies([...existing, withCaptain]);
    window.location.href = `/companies/manage/?id=${encodeURIComponent(company.id)}`;
  }

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
        <button className="command-button" type="button" onClick={onCancel}>
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
            <p>Every company needs a name. Pick something memorable.</p>
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
            <CaptainCreatorStep
              companyTypeId={companyTypeId}
              existingTroopers={[]}
              sectorialSlugs={
                [sectorial1?.slug, sectorial2?.slug].filter(Boolean) as string[]
              }
              onConfirm={handleCaptainConfirm}
            />
          </div>
        )}
      </div>

      <footer className="company-wizard__footer">
        <button className="command-button" type="button" onClick={handleBack}>
          {currentStepIndex === 0 ? "Cancel" : "Back"}
        </button>

        {step !== "captain" && (
          <button
            className="command-button command-button--primary"
            type="button"
            disabled={!canAdvance()}
            onClick={handleNext}
          >
            Next
          </button>
        )}
      </footer>
    </section>
  );
}
