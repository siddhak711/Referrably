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
  // 1. Get the user’s highlighted text from the current tab
  const highlightedText = await getHighlightedText();

  // 2. Fetch stored CSV data (connectionsData) and the current job company (if any)
  chrome.storage.local.get(['connectionsData', 'currentJobCompany'], (result) => {
    const connections = result.connectionsData || [];
    const currentJobCompany = result.currentJobCompany || '';

    // 3. If the user highlighted something, use that as the "company" name;
    //    otherwise, fall back to the content-script's detected company.
    const finalCompany = highlightedText.trim() || currentJobCompany;

    // Filter the connections by that company name
    const relevantConnections = getRelevantConnections(connections, finalCompany);

    // 4. Display the results in the popup
    displayResults(finalCompany, relevantConnections);
  });
});

/**
 * Uses chrome.scripting.executeScript to run a small function in the active tab
 * that returns the currently highlighted text (if any).
 */
async function getHighlightedText() {
  // Find the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Execute a function in that tab’s context to get the selection
  const [injectionResult] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString() // returns the highlighted text
  });
  
  // injectionResult.result will be whatever our inline func() returned
  return injectionResult?.result || '';
}

/**
 * Filters the connections array for entries whose "Company" matches the target string (case-insensitive).
 */
function getRelevantConnections(connectionsArray, targetCompany) {
  if (!targetCompany) return [];
  return connectionsArray.filter(conn => {
    if (!conn["Company"]) return false;
    return isMatchingCompany(conn["Company"], targetCompany);
  });
}


/**
 * Displays the results in the popup:
 * - If no finalCompany is found, show a "no company" message.
 * - If there are relevant connections, list them.
 * - If there are none, show a "no connections found" message.
 */
function displayResults(finalCompany, relevantConnections) {
  const connectionsList = document.getElementById('connections');
  const jobInfoDiv = document.getElementById('jobInfo');
  
  // Clear old content
  connectionsList.innerHTML = '';
  jobInfoDiv.textContent = '';

  if (!finalCompany) {
    // If there's no highlighted text and no detected job company, show a default message
    jobInfoDiv.textContent = 'No company name was detected or highlighted.';
    return;
  }

  // Show which company name we’re using
  jobInfoDiv.textContent = `Company: ${finalCompany}`;

  if (relevantConnections.length === 0) {
    // No matching connections
    connectionsList.innerHTML = `No connections found at ${finalCompany}.`;
    return;
  }

  // Otherwise, list each relevant connection
  relevantConnections.forEach(conn => {
    // Combine first and last name from the CSV
    const fullName = conn["First Name"] + " " + conn["Last Name"];

    // Create a container for each connection
    const li = document.createElement('li');
    li.className = 'connection';
    li.innerHTML = `<strong>${fullName}</strong> - ${conn["Company"]}<br>`;

    // "View Profile" button
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

    // "Edit Message" button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit Message';
    editBtn.addEventListener('click', () => {
      openMessageEditor(conn);
    });

    // Append buttons
    li.appendChild(viewBtn);
    li.appendChild(editBtn);
    connectionsList.appendChild(li);
  });
}

/**
 * Shows a simple "message editor" in the popup to let the user customize a note.
 */
function openMessageEditor(connection) {
  const editorDiv = document.getElementById('messageEditor');
  const messageText = document.getElementById('messageText');
  editorDiv.style.display = 'block';
  
  const fullName = connection["First Name"] + " " + connection["Last Name"];
  messageText.value = `Hi ${fullName},\n\nI'm interested in a referral at ${connection["Company"]}. Would you be open to connecting or providing some advice?\n\nThanks,\n[Your Name]`;

  // Store connection info to use when sending (using the URL as an identifier)
  editorDiv.dataset.connectionUrl = connection["URL"];

  document.getElementById('sendMessageBtn').onclick = () => {
    sendMessage(messageText.value, connection);
  };
  document.getElementById('cancelEditBtn').onclick = () => {
    editorDiv.style.display = 'none';
  };
}

// Simulated send message function
function sendMessage(message, connection) {
  const fullName = connection["First Name"] + " " + connection["Last Name"];
  alert(`Message to ${fullName}:\n\n${message}`);
  document.getElementById('messageEditor').style.display = 'none';
}
