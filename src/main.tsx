import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SocialProfilesProvider } from "./components/profile/SocialProfiles";
import "@fontsource-variable/dm-sans";
import "@fontsource/space-mono/latin-400.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Portfolio root element was not found");
}

createRoot(root).render(
  <StrictMode>
    <SocialProfilesProvider>
      <App />
    </SocialProfilesProvider>
  </StrictMode>,
);
