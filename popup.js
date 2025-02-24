document.addEventListener('DOMContentLoaded', async () => {
  chrome.storage.local.get(['connectionsData', 'currentJobCompany'], (result) => {
    const connections = result.connectionsData || [];
    const jobCompany = result.currentJobCompany || '';
    
    // Filter connections whose "Company" field includes the current job company (case-insensitive)
    const relevantConnections = getRelevantConnections(connections, jobCompany);

    // Display the connections in the popup.
    const connectionsList = document.getElementById('connections');
    connectionsList.innerHTML = ''; // Clear any previous content

    if (relevantConnections.length === 0) {
      connectionsList.innerHTML = '<li>No matching connections found.</li>';
    } else {
      relevantConnections.forEach(conn => {
        // Combine first and last name from the CSV
        const fullName = conn["First Name"] + " " + conn["Last Name"];
        const li = document.createElement('li');
        li.className = 'connection';
        li.innerHTML = `<strong>${fullName}</strong> - ${conn["Company"]}<br>`;

        // Create a "View Profile" button using the "URL" field
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

        // Create an "Edit Message" button to allow message customization
        const editBtn = document.createElement('button');
        editBtn.className = 'btn';
        editBtn.textContent = 'Edit Message';
        editBtn.addEventListener('click', () => {
          openMessageEditor(conn);
        });

        li.appendChild(viewBtn);
        li.appendChild(editBtn);
        connectionsList.appendChild(li);
      });
    }
  });
});

// Filtering function: returns only connections whose "Company" field includes the jobCompany
function getRelevantConnections(connectionsArray, jobCompany) {
  if (!jobCompany) return [];
  return connectionsArray.filter(conn => {
    return conn["Company"] && conn["Company"].toLowerCase().includes(jobCompany.toLowerCase());
  });
}

// Opens the message editor with a pre-created cold message template
function openMessageEditor(connection) {
  const editorDiv = document.getElementById('messageEditor');
  const messageText = document.getElementById('messageText');
  editorDiv.style.display = 'block';
  
  const fullName = connection["First Name"] + " " + connection["Last Name"];
  // Pre-created cold message template; adjust as needed.
  messageText.value = `Hi ${fullName},\n\nI'm interested in a referral at ${connection["Company"]}. Would you be open to connecting or providing some advice?\n\nThanks,\n[Your Name]`;

  // Save connection info to use when sending (using the URL as an identifier)
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
