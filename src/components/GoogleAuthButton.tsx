import React, { useEffect, useState } from "react";
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

  const handleSignIn = () => {
    setError(null);
    setLoading(true);
    requestAccessToken();
    // loading state is cleared in the token callback above
  };

  const handleSignOut = () => {
    setLoading(true);
    revokeAccessToken(() => {
      setSignedIn(false);
      setUserName(null);
      setLoading(false);
    });
  };

  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") return null;

  return (
    <div className="google-auth-button">
      {signedIn ? (
        <div className="auth-menu">
          {userName && <span className="user-name">{userName}</span>}
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="logout-btn"
            title="Sign out of Google"
          >
            {loading ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={loading || !ready}
          className="login-btn"
          title="Sign in with Google to save data to your Drive"
        >
          {loading ? "Signing in..." : "Sign In with Google"}
        </button>
      )}
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}
