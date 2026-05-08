import styles from "./DriveViewer.module.css";
import React, { useState, useEffect } from "react";
import {
  isSignedIn as getIsSignedIn,
  subscribeAuthState,
  readSharedFile,
} from "../lib/google-drive-adapter";

function formatDateTime(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function DriveViewer() {
  const [signedIn, setSignedIn] = useState(getIsSignedIn());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  // Get file ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    setFileId(id);
  }, []);

  // Track sign-in state without polling.
  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
    });
  }, []);

  // Load data once signed in and fileId is known
  useEffect(() => {
    if (signedIn && fileId) {
      loadData(fileId);
    }
  }, [signedIn, fileId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await readSharedFile(id);
      setData(result);
    } catch (err) {
      console.error("Error loading shared data:", err);
      setError(
        `Could not load shared data. The link may be invalid or you may not have permission to view it.`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!fileId) {
    return (
      <div className={styles.viewerState}>
        <p className={styles.errorMessage}>
          No file ID in the URL. Make sure you used the full share link.
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className={styles.viewerState}>
        <p className={styles.infoMessage}>
          Sign in with Google using the button in the nav bar to view this
          shared data.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.viewerState}>
        <p className={styles.infoMessage}>Loading shared data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.viewerState}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isEventFile = data?.kind === "infinity-mercenaries-event";
  const isCompanyFile = data?.kind === "infinity-mercenaries-company";
  const testData = data.data;

  // Redirect to CompanyManager for company files
  if (isCompanyFile && fileId) {
    // Use a meta redirect since we're in a React component in Astro
    if (typeof window !== "undefined") {
      window.location.replace(
        `/companies/manage/?fileId=${encodeURIComponent(fileId)}`,
      );
    }
    return (
      <div className={styles.viewerState}>
        <p className={styles.infoMessage}>Redirecting to company editor...</p>
      </div>
    );
  }

  return (
    <div className={styles.viewerContent}>
      <div className={styles.formSection}>
        <h2>{isEventFile ? "Event Viewer" : "Shared Data"}</h2>
        {data.lastUpdated && (
          <p className={styles.viewerMeta}>
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        )}
        {isEventFile && (
          <>
            <div className={styles.dataDisplay}>
              <p>
                <strong>Event Name:</strong>{" "}
                {data?.event?.name || "Unnamed event"}
              </p>
              {data?.event?.location && (
                <p>
                  <strong>Location:</strong> {data.event.location}
                </p>
              )}
              {data?.event?.startDate && (
                <p>
                  <strong>Starts:</strong>{" "}
                  {formatDateTime(data.event.startDate)}
                </p>
              )}
            </div>
            <div className={styles.dataDisplay}>
              <p>
                <strong>Event Workspace</strong>
              </p>
              <p>
                Register companies and create rounds/pairings from the event
                management workspace.
              </p>
              {fileId && (
                <a
                  className={styles.primaryBtn}
                  href={`/events/manage/?fileId=${encodeURIComponent(fileId)}`}
                >
                  Open Event Workspace
                </a>
              )}
            </div>
          </>
        )}
        {testData ? (
          <div className={styles.dataDisplay}>
            <p>
              <strong>Test Name:</strong> {testData.testName}
            </p>
            <p>
              <strong>Test Value:</strong>
            </p>
            <pre>{testData.testValue}</pre>
            {testData.timestamp && (
              <p>
                <strong>Saved at:</strong>{" "}
                {new Date(testData.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          !isEventFile && (
            <div className={styles.dataDisplay}>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )
        )}
      </div>
    </div>
  );
}
