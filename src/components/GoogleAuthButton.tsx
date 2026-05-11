import styles from "./GoogleAuthButton.module.css";
import React, { useEffect, useRef, useState } from "react";
import {
  initializeGAPIClient,
  initializeTokenClient,
  requestAccessToken,
  revokeAccessToken,
  isSignedIn,
  getCurrentUserName,
  restorePersistedAuthState,
  subscribeAuthState,
  getOrCreateDataFile,
  cacheFileId,
} from "../lib/google-drive-adapter";

interface GoogleAuthButtonProps {
  clientId: string;
}

export default function GoogleAuthButton({ clientId }: GoogleAuthButtonProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Initialize gapi client and GIS token client once both scripts have loaded
  useEffect(() => {
    // Sync real auth state on first client render to avoid SSR hydration mismatch
    setSignedIn(isSignedIn());
    setUserName(getCurrentUserName());
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") return;

    const unsubscribe = subscribeAuthState((nextSignedIn, nextUserName) => {
      setSignedIn(nextSignedIn);
      setUserName(nextUserName);
    });

    const tryInit = async () => {
      try {
        await initializeGAPIClient();
        initializeTokenClient(clientId, async (token) => {
          if (!token) {
            setError("Sign-in failed. Please try again.");
            setLoading(false);
            return;
          }
          // Ensure the user's data file exists
          try {
            const file = await getOrCreateDataFile();
            cacheFileId(file.id);
          } catch (e) {
            console.error("Could not initialize Drive file:", e);
          }
          setLoading(false);
        });

        // Rehydrate auth state across refresh/navigation when token is still valid.
        restorePersistedAuthState();

        setReady(true);
      } catch (err) {
        console.error("Failed to initialize Google API:", err);
        setError("Failed to initialize authentication");
      }
    };

    // Wait for both gapi and google scripts to load
    const poll = setInterval(() => {
      if (
        typeof (window as any).gapi !== "undefined" &&
        typeof (window as any).google !== "undefined"
      ) {
        clearInterval(poll);
        tryInit();
      }
    }, 100);

    return () => {
      clearInterval(poll);
      unsubscribe();
    };
  }, [clientId]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignIn = () => {
    setError(null);
    setLoading(true);
    requestAccessToken();
    // loading state is cleared in the token callback above
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    setLoading(true);
    revokeAccessToken(() => {
      setSignedIn(false);
      setUserName(null);
      setLoading(false);
    });
  };

  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") return null;

  return (
    <div className={`${styles.googleAuthButton} google-auth-button`}>
      {signedIn ? (
        <div
          ref={menuRef}
          className={`${styles.authMenu} auth-menu`}
          data-open={menuOpen ? "true" : "false"}
        >
          <button
            type="button"
            className={styles.authStatusTrigger}
            title={userName ? `Drive linked: ${userName}` : "Drive linked"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusLabel}>Drive linked</span>
            <span className={styles.menuChevron} aria-hidden="true" />
          </button>
          <div className={styles.authDropdown} role="menu">
            <a
              href="#"
              role="menuitem"
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
            >
              <span>Profile</span>
              <small>{userName || "Coming soon"}</small>
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={loading}
              title="Sign out of Google"
            >
              {loading ? "Disconnecting" : "Sign out"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={loading || !ready}
          className={`${styles.loginBtn} login-btn`}
          title="Sign in with Google to save data to your Drive"
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span>
            {loading ? "Connecting" : ready ? "Cloud sync" : "Auth link"}
          </span>
        </button>
      )}
      {error && <div className={styles.authError}>{error}</div>}
    </div>
  );
}
