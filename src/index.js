import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App"; // Popup UI
import ResearchHub from "./ResearchHub"; // Notes Hub
import "./index.css";

// Detect the current environment
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> {/* Popup */}
        <Route path="/research" element={<ResearchHub />} /> {/* Notes Hub */}
      </Routes>
    </Router>
  </React.StrictMode>
);
