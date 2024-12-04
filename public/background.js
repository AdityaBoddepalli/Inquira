chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToNote",
    title: "Add to Note",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "addSummaryToNote",
    title: "Add Summary to Note",
    contexts: ["selection"]
  });

  console.log("Context menus added!");
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "addToNote") {
    chrome.storage.local.get({ notes: [] }, (data) => {
      const newNotes = [
        ...data.notes,
        { text: info.selectionText, type: "raw" },
      ];
      chrome.storage.local.set({ notes: newNotes }, () => {
        console.log("Raw note added:", info.selectionText);
      });
    });
  }

  if (info.menuItemId === "addSummaryToNote") {
    chrome.storage.local.get({ notes: [] }, async (data) => {
      const summarizedText = await summarizeText(info.selectionText);
      const newNotes = [
        ...data.notes,
        { text: summarizedText, type: "summary" },
      ];
      chrome.storage.local.set({ notes: newNotes }, () => {
        console.log("Summarized note added:", summarizedText);
      });
    });
  }
});

async function summarizeText(text) {
  const options = {
    sharedContext: "This is some text on the internet",
    type: "key-points",
    format: "markdown",
    length: "long",
  };

  const available = (await self.ai.summarizer.capabilities()).available;
  let summarizer;
  if (available === "no") {
    // The Summarizer API isn't usable.
    console.error("The Summarizer API is not available in this environment.");
    return;
  }
  if (available === "readily") {
    // The Summarizer API can be used immediately .
    summarizer = await self.ai.summarizer.create(options);
  } else {
    // The Summarizer API can be used after the model is downloaded.
    summarizer = await self.ai.summarizer.create(options);
    summarizer.addEventListener("downloadprogress", (e) => {
      console.log(e.loaded, e.total);
    });
    await summarizer.ready;
  }

  const summary = await summarizer.summarize(text);
  summarizer.destroy();

  return Promise.resolve(summary);
}

let session;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "askAI") {
    const { context, chatHistory, userMessage } = message.payload;
    console.log("Context:", context);
    console.log("Chat History:", chatHistory);
    console.log("User Message:", userMessage);

    const aiResponse = async () => {
      return await promptResponse(context, chatHistory, userMessage);
    };
    aiResponse()
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.error("Error in AI response:", error);
        sendResponse({ error: "Failed to generate AI response" });
      });
    return true;
  }

  if (message.type === "rewrite") {
    const { text, context, withSummary } = message.payload;
    console.log("Rewrite Text:", text);
    console.log("Context:", context);
    console.log("With Summary:", withSummary);

    let newText = text;
    if (withSummary) {
      newText = summarizeText(text);
    }
    const rewrittenText = async () => {
      return await combineText(context, newText);
    };

    rewrittenText()
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.error("Error in rewriting response:", error);
        sendResponse({ error: "Failed to rewrite AI response" });
      });
    return true;
  }
  if (message.type === "clearChat") {
    if (session) {
      session.destroy();
      session = null;
    }
  }
});

async function promptResponse(context, chatHistory, userMessage) {
  const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();

  if (capabilities.available === "no") {
    // The Prompt API isn't usable.
    console.error("The Prompt API is not available in this environment.");
    return;
  }

  if (!session) {
    await createSession(context, chatHistory, capabilities);
  }
  const result = await session.prompt(userMessage);
  console.log("AI Response:", result);
  return result;
}

async function createSession(context, chatHistory, capabilities) {
  const options = {
    topK: capabilities.topK,
    temperature: capabilities.temperature,
    systemPrompt: context,
  };
  if (capabilities.available === "readily") {
    // The Summarizer API can be used immediately .
    session = await chrome.aiOriginTrial.languageModel.create(options);
  } else {
    // The Summarizer API can be used after the model is downloaded.
    session = await chrome.aiOriginTrial.languageModel.create(options);
    session.addEventListener("downloadprogress", (e) => {
      console.log(e.loaded, e.total);
    });
    await session.ready;
  }
}

async function combineText(context, newText) {
  const writeput = await session.prompt(
    `Combine the following two texts into concise bullet points under a single descriptive title:\n\n` +
      `Text 1: ${context}\n\n` +
      `Text 2: ${newText}\n\n` +
      `Provide the title first as a heading, followed by the bullet points. Avoid giving multiple title options.`
  );
  console.log("Combined Text:", writeput);

  return writeput;
}
