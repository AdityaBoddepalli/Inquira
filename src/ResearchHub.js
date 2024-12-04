import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ResearchHub() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedNotes, setSelectedNotes] = useState([]); 
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchNotes = () => {
    chrome.storage.local.get("notes", (data) => {
      setNotes(data.notes || []);
    });
  };
  useEffect(() => {
    fetchNotes();

    // Listen for changes in storage and refresh notes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.notes) {
        fetchNotes();
      }
    });

    // Cleanup listener when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener((changes, area) => {
        if (area === "local" && changes.notes) {
          fetchNotes();
        }
      });
    };
  }, []);

  // Delete a note
  const deleteNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
  };

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply filter to notes
  const filteredNotes =
    filter === "all" ? notes : notes.filter((note) => note.type === filter);

  const handleSendMessage = () => {
    const inputElement = document.getElementById("chat-input");
    const userMessage = inputElement.value.trim();

    if (!userMessage) {
      alert("Please enter a message!");
      return;
    }

    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    const context =
      selectedNotes.length > 0
        ? selectedNotes.map((index) => notes[index].text).join("\n\n")
        : notes.length > 0
        ? notes.map((note) => note.text).join("\n\n")
        : null;

    if (!context) {
      alert("No notes available to ask questions about.");
      return;
    }

    inputElement.value = ""; 
    sendToAI(context, userMessage);
  };

  const sendToAI = (context, userMessage) => {
    chrome.runtime.sendMessage(
      { type: "askAI", payload: { context, chatHistory, userMessage } },
      (response) => {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response || "AI response: Skip this response.",
            showActions: true,
          },
        ]);
      }
    );
  };

  const handleRewrite = (withSummary = false) => {
    const lastAIResponse = chatHistory[chatHistory.length - 1];
    if (!lastAIResponse) {
      alert("No AI response available to rewrite.");
      return;
    }

    if (selectedNotes.length === 0) {
      alert("Please select notes to rewrite.");
      return;
    }

    const selectedTexts = selectedNotes.map((index) => notes[index].text);

    chrome.runtime.sendMessage(
      {
        type: "rewrite",
        payload: {
          text: lastAIResponse.content,
          context: selectedTexts.join("\n\n"),
          withSummary,
        },
      },
      (response) => {
        if (response) {
          const updatedNotes = [
            ...notes.filter((_, i) => !selectedNotes.includes(i)),
            { text: response, type: withSummary ? "summary" : "raw" },
          ];
          setNotes(updatedNotes);
          setSelectedNotes([]);
          chrome.storage.local.set({ notes: updatedNotes });
        } else {
          console.error("Error in rewriting AI response.");
        }
      }
    );
  };

  const handleChatClose = () => {
    setChatHistory([]);
    setIsChatPanelOpen(false);
    chrome.runtime.sendMessage({ type: "clearChat" });
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "linear-gradient(180deg, #2A2A2A, #202020)",
      }}
    >
      <div
        className={`flex-grow p-4 overflow-y-auto ${
          isChatPanelOpen ? "w-2/3" : "w-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <img
            src="logo512.png"
            alt="Inquira Logo"
            className="w-32 h-32"
          />

          {/* Title */}
          <h1
            className="text-2xl font-bold text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(90deg, #00FFFF, #800080)", 
            }}
          >
            Inquira Core
          </h1>

          {/* Inquira AI Button */}
          <button
            className="bg-cyan-500 text-white py-2 px-4 rounded hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => setIsChatPanelOpen(true)}
          >
            Inquora AI
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-slate-200">
            Filter by Type:
          </label>
          <select
            className="p-2 border rounded w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="raw">Raw</option>
            <option value="summary">Summary</option>
          </select>
        </div>

        {/* Notes Section */}
        <div className="flex-grow p-4 overflow-y-auto h-[calc(100vh-100px)]">
          {filteredNotes.length === 0 ? (
            <p className="text-gray-300">No Research notes available.</p>
          ) : (
            <ul className="space-y-4">
              {filteredNotes.map((note, index) => (
                <li
                  key={index}
                  onClick={() => {
                    if (selectedNotes.includes(index)) {
                      setSelectedNotes(
                        selectedNotes.filter((i) => i !== index)
                      );
                    } else {
                      setSelectedNotes([...selectedNotes, index]);
                    }
                  }}
                  className={`p-4 shadow rounded flex justify-between items-center gap-4 ${
                    selectedNotes.includes(index)
                      ? "bg-obsidian-purple"
                      : "bg-slate-200"
                  } cursor-pointer`}
                >
                  <div className="text-gray-500 font-bold mr-2">
                    {index + 1}.
                  </div>
                  <div className="w-full">
                    <ReactMarkdown className="prose max-w-none text-gray-800">
                      {note.text}
                    </ReactMarkdown>
                    <p className="text-sm text-gray-500">Type: {note.type}</p>
                  </div>
                  <button
                    className="text-red-500 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(index);
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Export Button */}
        <button
          className="w-full bg-cyan-500 text-white py-2 px-4 rounded hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          onClick={exportNotes}
        >
          Export Research Notes
        </button>
      </div>

      {/* Chat Panel Section */}
      {isChatPanelOpen && (
        <div
          className="w-1/3 h-full bg-gray-900 shadow-lg flex flex-col text-white"
          style={{
            background: "linear-gradient(180deg, #2A2A2A, #202020)", // Gradient background
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold">Inquira Chat</h2>
          </div>

          {/* Chat History */}
          <div
            className="flex-grow p-4 overflow-y-auto h-[calc(100vh-100px)]"
            id="chat-history"
          >
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  message.role === "assistant"
                    ? "bg-purple-200"
                    : "bg-slate-200"
                } mb-2`}
              >
                <ReactMarkdown className="prose max-w-none text-gray-900">
                  {message.content}
                </ReactMarkdown>

                {/* Rewrite Buttons for AI Responses */}
                {message.role === "assistant" && message.showActions && (
                  <div className="flex justify-between mt-2">
                    <button
                      className="bg-cyan-600 text-white py-1 px-3 rounded hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      onClick={() => handleRewrite(false)}
                    >
                      Rewrite
                    </button>
                    <button
                      className="bg-pink-600 text-white py-1 px-3 rounded hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      onClick={() => handleRewrite(true)}
                    >
                      Rewrite with Summary
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-gray-700 flex items-center gap-2">
            <input
              type="text"
              className="flex-grow p-2 border border-gray-600 rounded bg-gray-800 text-white"
              placeholder="Ask something..."
              id="chat-input"
            />
            <button
              className="bg-cyan-500 text-white py-2 px-4 rounded hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>

          {/* Close Button */}
          <button
            className="p-2 text-red-500 underline text-center border-t border-gray-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => handleChatClose()}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
export default ResearchHub;
