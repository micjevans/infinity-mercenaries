import styles from "./CompanyTypeDetail.module.css";
/**
 * React equivalent of the CompanyTypeCard + CompanyTypeSection Astro components.
 * Uses the exact same CSS classes so it renders identically to the rules page.
 */

type Tone = "setup" | "benefits" | "restrictions" | "notes";

// SVG path data mirrored from CompanyTypeCard.astro
export const ICON_PATHS: Record<string, string> = {
  standard: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`,
  cohesive: `<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>`,
  leader: `<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>`,
  airborne: `<path d="M2 22h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"/>`,
  tag: `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
  proxy: `<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>`,
};

function TypeSection({
  title,
  tone = "notes",
  children,
}: {
  title: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${styles.companyTypeSection} ${styles[`tone${capitalize(tone)}`]}`}
    >
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export type CompanyTypeVariant =
  | "standard"
  | "cohesive"
  | "leader"
  | "airborne"
  | "tag"
  | "proxy";

export function CompanyTypeDetail({
  variant,
}: {
  variant: CompanyTypeVariant;
}) {
  const iconPath = ICON_PATHS[variant] ?? "";

  const icon = (
    <span className={styles.companyTypeIcon} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: iconPath }}
      />
    </span>
  );

  return (
    <section
      className={`${styles.companyTypeCard} ${styles[`variant${capitalize(variant)}`]}`}
    >
      {icon}
      {variant === "standard" && <StandardDetail />}
      {variant === "cohesive" && <CohesiveDetail />}
      {variant === "leader" && <LeaderDetail />}
      {variant === "airborne" && <AirborneDetail />}
      {variant === "tag" && <TagDetail />}
      {variant === "proxy" && <ProxyDetail />}
    </section>
  );
}

function StandardDetail() {
  return (
    <>
      <h2>Standard Company</h2>
      <p className={styles.companyTypeTagline}>
        The flexible all-rounder — maximum faction freedom with no tradeoffs.
      </p>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>2 sectorials</strong> or{" "}
          <strong>1 vanilla army</strong>.
        </p>
      </TypeSection>
      <TypeSection title="Default" tone="notes">
        <p>
          This is the baseline company type. It grants no extra benefits or
          added restrictions beyond the normal Company rules.
        </p>
      </TypeSection>
    </>
  );
}

function CohesiveDetail() {
  return (
    <>
      <h2>Cohesive Company</h2>
      <p className={styles.companyTypeTagline}>
        An elite synchronized unit built around a single fireteam's deep
        synergy.
      </p>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>1 sectorial</strong> and choose one Fireteam Core
          available to that sectorial. The Captain and all other purchased
          troopers must be able to join that fireteam.
        </p>
      </TypeSection>
      <TypeSection title="Benefits" tone="benefits">
        <ul>
          <li>
            All fireteam members are considered the same unit for fireteam
            bonuses.
          </li>
          <li>
            This Company may form 1 Fireteam Core from its sectorial with 6 or
            fewer Troopers.
          </li>
          <li>Gain +1 WIP at Fireteam Level 6.</li>
          <li>
            The Captain gains <strong>FT Master</strong>.
          </li>
          <li>
            All troopers gain <strong>Number 2</strong>.
          </li>
          <li>Ignore the Core Fireteam's minimum trooper restriction.</li>
        </ul>
      </TypeSection>
      <TypeSection title="Restrictions" tone="restrictions">
        <ul>
          <li>Tactical Awareness may never be spent on the Core Fireteam.</li>
          <li>
            Troopers purchased with Tactical Awareness are discounted by 3 CR.
          </li>
          <li>
            Troopers that are not part of the Core link are considered
            Irregular.
          </li>
        </ul>
      </TypeSection>
    </>
  );
}

function LeaderDetail() {
  return (
    <>
      <h2>Inspiring Leader</h2>
      <p className={styles.companyTypeTagline}>
        One exceptional Captain leading a crew of irregulars from across the
        Human Sphere.
      </p>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>1 sectorial</strong> and choose a Captain from that
          sectorial.
        </p>
        <p>
          Aside from the Captain, all other troopers must be Irregular troopers
          and may be purchased from any sectorial or vanilla army.
        </p>
      </TypeSection>
      <TypeSection title="Benefits" tone="benefits">
        <p>
          The Captain gains <strong>Inspiring Leadership</strong>. Use any
          single sectorial's AVA for each trooper type without combining AVAs.
        </p>
      </TypeSection>
    </>
  );
}

function AirborneDetail() {
  return (
    <>
      <h2>Airborne Company</h2>
      <p className={styles.companyTypeTagline}>
        A hard-insertion force built entirely around Airborne Deployment.
      </p>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>1 sectorial</strong> and choose a Captain from that
          sectorial.
        </p>
        <p>
          Aside from the Captain, all other troopers must have an Airborne
          Deployment skill and may be purchased from any sectorial or vanilla
          army.
        </p>
      </TypeSection>
      <TypeSection title="Benefits" tone="benefits">
        <p>
          The Captain gains <strong>Parachutist</strong> and{" "}
          <strong>Network Support (Only Controlled Jump)</strong>.
        </p>
        <ul>
          <li>
            The Company gets one free use of Speedball per contract, dropping
            only one Speedball.
          </li>
        </ul>
      </TypeSection>
      <TypeSection title="Restrictions" tone="restrictions">
        <ul>
          <li>
            Troopers in this Company must use an AD skill when deployed during
            the Deployment Phase.
          </li>
          <li>
            When deployed this way, troopers treat the opponent's Deployment
            Zone plus an additional 8 inches outside it as an Exclusion Zone.
          </li>
          <li>The Captain must be deployed during the Deployment Phase.</li>
        </ul>
      </TypeSection>
    </>
  );
}

function TagDetail() {
  return (
    <>
      <h2>TAG Company</h2>
      <p className="company-type-tagline">
        A repurposed industrial TAG at the centre of the roster, customizable
        and perk-eligible.
      </p>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>1 sectorial</strong> and gain access to a special
          TAG profile with a cost of <strong>40 CR</strong> and AVA 1.
        </p>
      </TypeSection>
      <TypeSection title="Customization" tone="notes">
        <p>
          When purchased, the TAG may use <strong>20 Spec-Ops XP</strong> to
          customize the profile using the Spec-Ops equipment and skills for the
          Company's sectorial.
        </p>
      </TypeSection>
      <TypeSection title="Restrictions" tone="restrictions">
        <ul>
          <li>ARM, BTS, and STR may not be modified using Spec-Ops XP.</li>
          <li>
            The TAG may be the Company's Captain, but does not gain additional
            Spec-Ops XP.
          </li>
          <li>
            The TAG may not purchase Forward Deployment, Strategic Deployment,
            Infiltration, Impersonation, Parachutist, Combat Jump, or Engineer
            with Spec-Ops XP.
          </li>
          <li>The TAG may never gain those skills by any other means.</li>
        </ul>
      </TypeSection>
      <TypeSection title="Deployment" tone="restrictions">
        <p>
          When a TAG deploys in a contract, it takes up{" "}
          <strong>two slots</strong>. This means a Company may deploy only 3
          total troopers for Elite Deployment and 5 total troopers for non-Elite
          Deployment if the TAG is included.
        </p>
      </TypeSection>
      <TypeSection title="Progression" tone="benefits">
        <p>
          When a TAG receives enough experience to level up, it receives a TAG
          Perk in addition to the normally earned perk. The TAG Perk must be
          chosen from the TAG Perk Tree and may not be rolled randomly.
        </p>
        <p>
          TAGs purchase and use equipment from markets like regular troopers for
          all slots except <strong>Armor</strong>.
        </p>
      </TypeSection>
    </>
  );
}

function ProxyDetail() {
  return (
    <>
      <h2>Proxy Pack</h2>
      <p className="company-type-tagline">
        Experimental solo play: a single Lone Wolf who splits into multiple
        Aspects across the battlefield.
      </p>
      <div className="warning-callout">
        <strong>Proxy Pack Balance Warning</strong>
        <p>
          Proxy Pack is poorly balanced in the current ruleset and is
          recommended not to be used at this time. Players should consult their
          event organizer before choosing Proxy Pack as a company type.
        </p>
      </div>
      <TypeSection title="Setup" tone="setup">
        <p>
          Select any <strong>1 sectorial or vanilla army</strong> and choose a
          Captain from that force. This is the only trooper the Company may
          gain. The trooper does not need the Lieutenant skill, but must have
          Regular Training.
        </p>
        <p>
          This trooper is the <strong>Lone Wolf</strong> and gains:
        </p>
      </TypeSection>
      <TypeSection title="Benefits" tone="benefits">
        <ul>
          <li>10 additional Spec-Ops XP, regardless of trooper cost.</li>
          <li>2 Perks and 10 Renown whenever they level up.</li>
          <li>
            The ability to Doctor themselves even when not Unconscious, and to
            do so to regain VITA up to their maximum.
          </li>
          <li>Elite Deployment and Tactical Awareness.</li>
          <li>
            1 Aspect at the start, 2 at Level 2, 3 at Level 3, and 4 at Level 5,
            to a maximum of 4 Aspects.
          </li>
          <li>
            The <strong>Transfer Consciousness</strong> skill.
          </li>
        </ul>
      </TypeSection>
    </>
  );
}
