/*global chrome*/
import React from "react";


function App() {
  const openResearchHub = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html#/research") });
  };

  const resetNotes = () => {
    chrome.storage.local.set({ notes: [] }, () => {
      console.log("All notes have been reset.");
    });
  };

  return (
    <div className="p-6 bg-slate-800 text-white flex flex-col items-center min-w-[300px]">
      <h1
        className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text"
        style={{
          backgroundImage: "linear-gradient(90deg, #00FFFF, #800080, #FF1493)",
        }}
      >
        Inquira
      </h1>

      {/* Logo as Button */}
      <button
        onClick={openResearchHub}
        className="hover:shadow-lg transform hover:scale-125 transition-all duration-300"
      >
        <img
          src="logo512.png" // Replace with the actual logo path
          alt="Inquira Logo"
          className="w-28 h-28 mb-5"
        />
      </button>

      <button
        onClick={resetNotes}
        className="hover:shadow-lg transform hover:scale-150 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.136 21H7.864a2 2 0 01-1.997-1.858L5 7m5-4h4m-4 0a2 2 0 00-2 2m6-2a2 2 0 012 2m-6 0h6m2 0h-2m-6 0H5m14 0h-2"
          />
        </svg>
      </button>
    </div>
  );
}

export default App;
