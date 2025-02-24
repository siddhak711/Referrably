document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
  
    chrome.storage.local.get(['connectionsCSV'], (result) => {
      const connectionsCSV = result.connectionsCSV || '';
  
      // parse the CSV to find any relevant connections for the domain
      // e.g., if the user is on a job listing at Company X, find if any connections are at Company X
      const relevantConnections = getRelevantConnections(connectionsCSV, url);
  
      // Display them in the popup
      const connectionsList = document.getElementById('connections');
      relevantConnections.forEach(conn => {
        const li = document.createElement('li');
        li.innerText = conn.name + ' - ' + conn.company;
        connectionsList.appendChild(li);
      });
    });
  });
  
  function getRelevantConnections(csvText, url) {
    // parse CSV, filter for relevant connections
    // return an array of matches
    // This is a placeholder
    return [];
  }
  