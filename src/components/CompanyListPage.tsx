import { useEffect, useMemo, useState } from "react";
import {
  deleteLocalCompany,
  loadLocalCompanies,
  type LocalCompany,
} from "../lib/mercs/companyStore";
import {
  isSignedIn as getGoogleSignedIn,
  subscribeAuthState,
  listAppDataCompanyReferences,
  checkSharedFileAccess,
  removeAppDataCompanyReference,
  deleteSharedFile,
  type AppDataCompanyReference,
} from "../lib/google-drive-adapter";
import { AppIcon } from "./AppIcon";
import styles from "./CompanyListPage.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getCompanyHref(companyId: string): string {
  return `/companies/manage/?id=${encodeURIComponent(companyId)}`;
}

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [driveCompanies, setDriveCompanies] = useState<
    AppDataCompanyReference[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [brokenFileIds, setBrokenFileIds] = useState<Set<string>>(new Set());
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setCompanies(loadLocalCompanies());
  }, []);

  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setDriveCompanies([]);
      return;
    }

    let alive = true;
    listAppDataCompanyReferences()
      .then((entries) => {
        if (!alive) return;
        setDriveCompanies(entries);
      })
      .catch((error) => {
        console.error("Failed to load appdata company index:", error);
      });

    return () => {
      alive = false;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || driveCompanies.length === 0) {
      setBrokenFileIds(new Set());
      return;
    }

    let alive = true;
    void (async () => {
      const broken = new Set<string>();
      for (const company of driveCompanies) {
        const isAccessible = await checkSharedFileAccess(company.fileId);
        if (!isAccessible) {
          broken.add(company.fileId);
        }
      }
      if (alive) setBrokenFileIds(broken);
    })();

    return () => {
      alive = false;
    };
  }, [signedIn, driveCompanies]);

  function handleDeleteCompany(companyId: string) {
    setCompanies(deleteLocalCompany(companyId));
  }

  async function handleDeleteDriveCompany(fileId: string, companyName: string) {
    if (
      !window.confirm(
        `Delete "${companyName}" from Drive and remove from your account?`,
      )
    )
      return;

    setDeletingFileIds((current) => new Set([...current, fileId]));
    try {
      await deleteSharedFile(fileId);
      await removeAppDataCompanyReference(fileId);
      setDriveCompanies((current) =>
        current.filter((company) => company.fileId !== fileId),
      );
    } catch (error) {
      console.error("Failed to delete company:", error);
    } finally {
      setDeletingFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    }
  }

  async function handleCleanupBrokenCompanyReference(
    fileId: string,
    companyName: string,
  ) {
    if (
      !window.confirm(
        `Remove broken reference to "${companyName}" from your account?`,
      )
    )
      return;

    setDeletingFileIds((current) => new Set([...current, fileId]));
    try {
      await removeAppDataCompanyReference(fileId);
      setDriveCompanies((current) =>
        current.filter((company) => company.fileId !== fileId),
      );
      setBrokenFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    } catch (error) {
      console.error("Failed to remove reference:", error);
    } finally {
      setDeletingFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    }
  }

  const localOnlyCompanies = useMemo(
    () =>
      companies.filter((company) => !company.shareFileId && !company.shareLink),
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return localOnlyCompanies;
    return localOnlyCompanies.filter((company) =>
      company.name.toLowerCase().includes(normalized),
    );
  }, [localOnlyCompanies, searchTerm]);

  const filteredDriveCompanies = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return driveCompanies;
    return driveCompanies.filter((company) =>
      [company.name, company.eventName || ""].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [driveCompanies, searchTerm]);

  return (
    <section
      className={`${styles.companyManager} ${styles.companyListPage}`}
      aria-label="Company list"
    >
      <div className={styles.companyManagerMasthead}>
        <p className="eyebrow">Company Command</p>
        <h1 className={styles.companyManagerMastheadH1}>Companies</h1>
        <p>Manage your saved companies and open each roster workspace.</p>
      </div>

      <div className={styles.eventListToolbar}>
        <a
          className={`${styles.commandButton} ${styles.commandButtonPrimary}`}
          href="/companies/create/"
        >
          <AppIcon name="add" size={16} />
          New Company
        </a>
      </div>

      <section
        className={`${styles.companySectionCard} ${styles.companyIndexCard}`}
      >
        <div className={styles.sectionHeadingRow}>
          <div>
            <span className={styles.panelKicker}>Saved Companies</span>
            <h2>Company List</h2>
          </div>
          <span className={styles.companyCount}>
            {filteredCompanies.length + filteredDriveCompanies.length}
          </span>
        </div>

        <label className={styles.field}>
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Find by company or linked event"
          />
        </label>

        <div className={styles.companyCardList}>
          {filteredCompanies.map((company) => (
            <article className={styles.companyIndexItem} key={company.id}>
              <a href={getCompanyHref(company.id)}>
                <span className={styles.panelKicker}>
                  {company.sectorial1?.name || "No sectorial selected"}
                </span>
                <h3>{company.name}</h3>
                <p>
                  {company.troopers?.length || 0} troopers. Updated{" "}
                  {formatDate(company.updatedAt)}.
                </p>
                {company.eventName && <p>Linked event: {company.eventName}</p>}
              </a>
              <button
                className={`${styles.commandButton} ${styles.commandButtonDanger}`}
                type="button"
                onClick={() => handleDeleteCompany(company.id)}
              >
                <AppIcon name="trash" size={16} />
                Delete
              </button>
            </article>
          ))}

          {filteredDriveCompanies.map((company) => (
            <article
              className={styles.companyIndexItem}
              key={`drive-${company.fileId}`}
            >
              {brokenFileIds.has(company.fileId) ? (
                <div>
                  <span className={styles.panelKicker}>
                    Drive-backed (Broken Link)
                  </span>
                  <h3>{company.name}</h3>
                  <p>
                    File not found. Organizer or co-owner may have deleted it.
                  </p>
                  {company.eventName && (
                    <p>Was linked event: {company.eventName}</p>
                  )}
                </div>
              ) : (
                <a
                  href={
                    company.shareLink ||
                    `/view?id=${encodeURIComponent(company.fileId)}`
                  }
                >
                  <span className={styles.panelKicker}>Drive-backed</span>
                  <h3>{company.name}</h3>
                  <p>
                    Shared company file. Updated {formatDate(company.updatedAt)}
                    .
                  </p>
                  {company.eventName && (
                    <p>Linked event: {company.eventName}</p>
                  )}
                </a>
              )}
              {brokenFileIds.has(company.fileId) ? (
                <button
                  className={`${styles.commandButton} ${styles.commandButtonDanger}`}
                  type="button"
                  disabled={deletingFileIds.has(company.fileId)}
                  onClick={() =>
                    handleCleanupBrokenCompanyReference(
                      company.fileId,
                      company.name,
                    )
                  }
                >
                  <AppIcon name="trash" size={16} />
                  {deletingFileIds.has(company.fileId)
                    ? "Removing..."
                    : "Remove Reference"}
                </button>
              ) : (
                <>
                  <a
                    className={styles.commandButton}
                    href={
                      company.shareLink ||
                      `/view?id=${encodeURIComponent(company.fileId)}`
                    }
                  >
                    Open
                  </a>
                  <button
                    className={`${styles.commandButton} ${styles.commandButtonDanger}`}
                    type="button"
                    disabled={deletingFileIds.has(company.fileId)}
                    onClick={() =>
                      handleDeleteDriveCompany(company.fileId, company.name)
                    }
                  >
                    <AppIcon name="trash" size={16} />
                    {deletingFileIds.has(company.fileId)
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </>
              )}
            </article>
          ))}

          {filteredCompanies.length === 0 &&
            filteredDriveCompanies.length === 0 && (
              <p className={styles.emptyNote}>No companies found.</p>
            )}
        </div>
      </section>
    </section>
  );
}
