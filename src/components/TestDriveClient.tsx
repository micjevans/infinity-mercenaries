import React, { useState, useEffect } from "react";
import {
  isSignedIn as getIsSignedIn,
  subscribeAuthState,
  getCachedFileId,
  getOrCreateDataFile,
  readDataFromDrive,
  writeDataToDrive,
  createSharedFile,
  makeFilePublic,
  updateSharedFile,
  getCachedSharedFileId,
  cacheSharedFileId,
} from "../lib/google-drive-adapter";

interface TestData {
  testName: string;
  testValue: string;
  timestamp: string;
}

export default function TestDriveClient() {
  const [signedIn, setIsSignedIn] = useState(getIsSignedIn());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [testName, setTestName] = useState("");
  const [testValue, setTestValue] = useState("");

  // Data state
  const [loadedData, setLoadedData] = useState<TestData | null>(null);

  // Share state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Track auth state without polling.
  useEffect(() => {
    return subscribeAuthState((nextSignedIn) => {
      setIsSignedIn(nextSignedIn);
    });
  }, []);

  // Auto-load data once signed in
  useEffect(() => {
    if (signedIn) {
      handleLoadFromDrive();
    }
  }, [signedIn]);

  const handleSaveToDrive = async () => {
    if (!testName || !testValue) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!getIsSignedIn()) {
        setError("Please sign in first");
        setLoading(false);
        return;
      }

      // Get or create the data file
      let fileId = getCachedFileId();
      if (!fileId) {
        const file = await getOrCreateDataFile();
        fileId = file.id;
      }

      // Create test data
      const data: TestData = {
        testName,
        testValue,
        timestamp: new Date().toISOString(),
      };

      // Write to Drive
      await writeDataToDrive(fileId, {
        version: 1,
        lastUpdated: new Date().toISOString(),
        data,
      });

      setSuccess("Data saved to your Google Drive!");
      setLoadedData(data);
      setTestName("");
      setTestValue("");
    } catch (err) {
      console.error("Error saving data:", err);
      setError(
        `Failed to save data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromDrive = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!getIsSignedIn()) {
        setError("Please sign in first");
        setLoading(false);
        return;
      }

      let fileId = getCachedFileId();
      if (!fileId) {
        const file = await getOrCreateDataFile();
        fileId = file.id;
      }

      const fileData = await readDataFromDrive(fileId);
      if (fileData.data) {
        setLoadedData(fileData.data);
        setSuccess("Data loaded from your Google Drive!");
      } else {
        setSuccess("No data found in your file");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        `Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!loadedData) {
      setError("Save some data first before sharing.");
      return;
    }
    try {
      setShareLoading(true);
      setError(null);

      // Reuse existing shared file or create a new one
      let sharedFileId = getCachedSharedFileId();
      if (!sharedFileId) {
        sharedFileId = await createSharedFile("infinity-shared-data.json", {
          version: 1,
          createdAt: new Date().toISOString(),
          data: loadedData,
        });
        await makeFilePublic(sharedFileId);
        cacheSharedFileId(sharedFileId);
      } else {
        await updateSharedFile(sharedFileId, {
          version: 1,
          lastUpdated: new Date().toISOString(),
          data: loadedData,
        });
      }

      const url = `${window.location.origin}/view?id=${sharedFileId}`;
      setShareLink(url);
    } catch (err) {
      console.error("Share error:", err);
      setError(
        `Failed to generate share link: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setShareLoading(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="test-form">
        <div className="form-section">
          <p className="info-message">
            ✓ Please sign in with your Google account using the button in the
            navigation bar to begin testing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-form">
      <div className="form-section">
        <h2>Write Test Data</h2>
        <div className="form-group">
          <label htmlFor="testName">Test Name:</label>
          <input
            id="testName"
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Enter a test name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="testValue">Test Value:</label>
          <textarea
            id="testValue"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            placeholder="Enter test data (can be JSON)"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button
            onClick={handleSaveToDrive}
            disabled={loading}
            className="primary-btn"
          >
            {loading ? "Saving..." : "Save to Drive"}
          </button>
          <button
            onClick={handleLoadFromDrive}
            disabled={loading}
            className="secondary-btn"
          >
            {loading ? "Loading..." : "Load from Drive"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      {loadedData && (
        <div className="form-section">
          <h2>Loaded Data</h2>
          <div className="data-display">
            <p>
              <strong>Test Name:</strong> {loadedData.testName}
            </p>
            <p>
              <strong>Test Value:</strong>
            </p>
            <pre>{loadedData.testValue}</pre>
            <p>
              <strong>Last Updated:</strong>{" "}
              {new Date(loadedData.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {loadedData && (
        <div className="form-section">
          <h2>Share Your Data</h2>
          <p className="share-description">
            Generate a public link so another user can view this data. They will
            need to sign in with their own Google account to access it.
          </p>
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="primary-btn"
          >
            {shareLoading
              ? "Generating link..."
              : shareLink
                ? "Update Share Link"
                : "Generate Share Link"}
          </button>
          {shareLink && (
            <div className="share-link-box">
              <p>
                <strong>Share this link:</strong>
              </p>
              <div className="share-link-row">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                  }}
                >
                  Copy
                </button>
              </div>
              <a
                href={shareLink}
                target="_blank"
                rel="noreferrer"
                className="share-preview-link"
              >
                Open viewer →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
