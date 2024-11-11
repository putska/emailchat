// src/components/AuthButton.tsx
"use client";

import React from "react";

export default function AuthButton() {
  const handleAuthRedirect = async () => {
    try {
      // Fetch the auth URL from the server-side endpoint
      const response = await fetch("/api/auth");
      const data = await response.json();

      if (data.authUrl) {
        // Redirect the user directly to the Google OAuth URL
        window.location.href = data.authUrl;
      } else {
        console.error("Authorization URL not received.");
      }
    } catch (error) {
      console.error("Error fetching authorization URL:", error);
    }
  };

  return <button onClick={handleAuthRedirect}>Authenticate with Google</button>;
}
