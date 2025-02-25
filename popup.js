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
 *  - Two buttons: "View Profile" and "Edit Message".
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
    // Pass the current <li> element to openMessageEditor so it can be appended there.
    editBtn.addEventListener('click', () => {
      openMessageEditor(conn, li);
    });

    li.appendChild(viewBtn);
    li.appendChild(editBtn);
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
 * Simulates sending a referral message.
 */
function sendMessage(message, connection) {
  const fullName = connection["First Name"] + " " + connection["Last Name"];
  alert(`Message to ${fullName}:\n\n${message}`);
  document.getElementById('messageEditor').style.display = 'none';
}
