const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return (
      process.env.REACT_APP_API_URL ||
      "http://localhost:5001/infinity-mercenaries/us-central1/api"
    );
  }
  return (
    process.env.REACT_APP_API_URL ||
    "https://us-central1-infinity-mercenaries.cloudfunctions.net/api"
  );
};

export const API_BASE_URL = getApiBaseUrl();
