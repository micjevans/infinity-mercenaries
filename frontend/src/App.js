import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Backend URL (without trailing slash)
    const backendUrl =
      "https://mercenaries-backend-r7n5kyibrq-uc.a.run.app/helloworld";

    const fetchMessage = async () => {
      try {
        const response = await fetch(backendUrl);
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Error fetching backend data:", error);
        setMessage("Failed to fetch backend data.");
      }
    };

    fetchMessage();
  }, []);

  return (
    <div>
      <h1>Infinity Mercenaries</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
