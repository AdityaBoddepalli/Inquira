# Inquira Chrome Extension

## Prerequisites

To use this extension, you need to have trial tokens for the following Chrome APIs:
- **Summarizer API**
- **Prompt API**

### Obtain Trial Tokens
You can request and retrieve the required trial tokens from the following link:
[Active Origin Trials](https://developer.chrome.com/origintrials/#/trials/active)
Add them as an array in manifest.json

### Set Up Chrome Canary
1. Download and install [Chrome Canary](https://www.google.com/chrome/canary/).
2. Open Chrome Canary and navigate to `chrome://flags/`.
3. Enable all the built-in AI features by searching for:
   - `#enable-built-in-ai`
   - `#enable-summarizer-api`
   - `#enable-prompt-api`
4. Relaunch Chrome Canary to apply these settings.

### Usage
1. Install the extension by loading the unpacked directory in Chrome Canary via `chrome://extensions/`.
2. Ensure the trial tokens are added to your environment or project.
3. Start using Inquira to enhance your research and note-taking workflows!
