// popup.js

function cleanCompanyName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isMatchingCompany(company1, company2) {
  const cleaned1 = cleanCompanyName(company1);
  const cleaned2 = cleanCompanyName(company2);
  return cleaned1.includes(cleaned2) || cleaned2.includes(cleaned1);
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Get the user’s highlighted text from the active tab
  const highlightedText = await getHighlightedText();

  // 2. Fetch stored CSV data (connectionsData) and the current job company (if any)
  chrome.storage.local.get(['connectionsData', 'currentJobCompany'], (result) => {
    const connections = result.connectionsData || [];
    const currentJobCompany = result.currentJobCompany || '';

    // 3. Use highlighted text if available; otherwise, fall back to the detected company name.
    const finalCompany = highlightedText.trim() || currentJobCompany;

    // Filter the connections by that company name using refined matching.
    const relevantConnections = getRelevantConnections(connections, finalCompany);

    // 4. Display the results in the popup.
    displayResults(finalCompany, relevantConnections);
  });
});

/**
 * Executes a script in the active tab to obtain any highlighted text.
 */
async function getHighlightedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [injectionResult] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  });
  return injectionResult?.result || '';
}

/**
 * Filters connections based on whether their "Company" matches the target company (case-insensitive).
 */
function getRelevantConnections(connectionsArray, targetCompany) {
  if (!targetCompany) return [];
  return connectionsArray.filter(conn => {
    if (!conn["Company"]) return false;
    return isMatchingCompany(conn["Company"], targetCompany);
  });
}

/**
 * Displays the final company name being searched and the list of referral options.
 * Each referral displays:
 *  - The connection's full name in a header.
 *  - The "Company - Position" on a separate line.
 *  - Three buttons: "View Profile", "Edit Message", and the new "Send Message".
 */
function displayResults(finalCompany, relevantConnections) {
  const connectionsList = document.getElementById('connections');
  const jobInfoDiv = document.getElementById('jobInfo');
  
  // Clear previous content.
  connectionsList.innerHTML = '';
  jobInfoDiv.textContent = '';

  if (!finalCompany) {
    jobInfoDiv.textContent = 'No company name was detected or highlighted.';
    return;
  }

  // Display the searched company name in the banner.
  jobInfoDiv.textContent = finalCompany;

  if (relevantConnections.length === 0) {
    connectionsList.innerHTML = `No connections found at ${finalCompany}.`;
    return;
  }

  // Display each referral.
  relevantConnections.forEach(conn => {
    const fullName = conn["First Name"] + " " + conn["Last Name"];
    const company = conn["Company"] || "";
    const position = conn["Position"] || "";
    const li = document.createElement('li');
    li.className = 'connection';
    
    // Display the full name and below it "Company - Position"
    li.innerHTML = `
      <h2 style="font-size:18px; margin:0;"><strong>${fullName}</strong></h2>
      <p style="font-size:16px; margin:0;">${company} - ${position}</p>
    `;
    
    // "View Profile" button.
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn';
    viewBtn.textContent = 'View Profile';
    viewBtn.addEventListener('click', () => {
      if (conn["URL"]) {
        chrome.tabs.create({ url: conn["URL"] });
      } else {
        alert('LinkedIn URL not available for this connection.');
      }
    });

    // "Edit Message" button.
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit Message';
    editBtn.addEventListener('click', () => {
      openMessageEditor(conn, li);
    });
    
    // New "Send Message" button for one-click messaging.
    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn';
    sendBtn.textContent = 'Send Message';
    sendBtn.addEventListener('click', () => {
      const autoMessage = `Hi ${fullName},\n\nI'm interested in a referral at ${company}. Would you be open to connecting or providing some advice?\n\nThanks,\n[Your Name]`;
      sendMessage(autoMessage, conn);
    });

    li.appendChild(viewBtn);
    li.appendChild(editBtn);
    li.appendChild(sendBtn);
    connectionsList.appendChild(li);
  });
}

/**
 * Opens the message editor inline by moving the #messageEditor element
 * to be a child of the specific referral <li> element.
 */
function openMessageEditor(connection, liElement) {
  const editorDiv = document.getElementById('messageEditor');
  const messageText = document.getElementById('messageText');
  
  // Remove the editor from its current parent, if any.
  if (editorDiv.parentElement) {
    editorDiv.parentElement.removeChild(editorDiv);
  }
  
  // Append the editor to the specific <li> element.
  liElement.appendChild(editorDiv);
  editorDiv.style.display = 'block';

  const fullName = connection["First Name"] + " " + connection["Last Name"];
  messageText.value = `Hi ${fullName},\n\nI'm interested in a referral at ${connection["Company"]}. Would you be open to connecting or providing some advice?\n\nThanks,\n[Your Name]`;

  // Save connection URL for further actions.
  editorDiv.dataset.connectionUrl = connection["URL"];

  document.getElementById('sendMessageBtn').onclick = () => {
    sendMessage(messageText.value, connection);
  };
  document.getElementById('cancelEditBtn').onclick = () => {
    editorDiv.style.display = 'none';
  };
}

/**
 * Automatically sends a referral message to the connection on LinkedIn.
 * Instead of showing an alert, this function opens the connection's LinkedIn URL
 * and injects a script to click the "Message" button, fill in the message, and click send.
 */
function sendMessage(message, connection) {
  chrome.tabs.create({ url: connection["URL"] }, (tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: autoSendLinkedInMessage,
      args: [message]
    });
  });
}

function autoSendLinkedInMessage(message) {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function run() {
    // Wait for the page to fully load.
    if (document.readyState !== 'complete') {
      await sleep(2000);
    }
    // Find and click the "Message" button (adjust selector as needed).
    const messageButton = document.querySelector('button[aria-label*="Message"]');
    if (!messageButton) {
      console.error("Message button not found");
      return;
    }
    messageButton.click();
    
    // Wait for the messaging modal to appear.
    await sleep(2000);
    
    // Locate the message input (LinkedIn often uses a contenteditable div).
    let messageBox = document.querySelector('div.msg-form__contenteditable');
    if (!messageBox) {
      // Fallback to a textarea if available.
      messageBox = document.querySelector('textarea');
    }
    if (!messageBox) {
      console.error("Message input not found");
      return;
    }
    
    messageBox.focus();
    
    // Use execCommand to simulate user typing.
    if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, message);
    } else {
      messageBox.innerText = message;
      messageBox.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Dispatch a keyup event to trigger any LinkedIn handlers.
    messageBox.dispatchEvent(new Event('keyup', { bubbles: true }));
    
    await sleep(1000);
    
    // Find and click the send button (selector may need adjustment).
    const sendButton = document.querySelector('button.msg-form__send-button');
    if (!sendButton) {
      console.error("Send button not found");
      return;
    }
    sendButton.click();
    
    // Wait a moment and then ask the background script to close this tab.
    await sleep(1000);
    chrome.runtime.sendMessage({ action: "closeTab" });
  }
  run();
}

