document.getElementById('uploadBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('csvFileInput');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please choose a file first.');
    return;
  }
  
  const text = await file.text();
  
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    // Skip the first 3 rows so that row 4 becomes the header row
    beforeFirstChunk: function(chunk) {
      const rows = chunk.split("\n");
      rows.splice(0, 3); // Remove first 3 rows
      return rows.join("\n");
    },
    complete: function(results) {
      const connectionsArray = results.data;
      console.log("Parsed Connections:", connectionsArray);
      chrome.storage.local.set({ connectionsData: connectionsArray }, () => {
        alert('Connections CSV uploaded and saved successfully!');
      });
    },
    error: function(err) {
      console.error("Error parsing CSV: ", err);
      alert('Error parsing CSV file.');
    }
  });
});

document.getElementById('saveNameBtn').addEventListener('click', () => {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  
  if (!firstName || !lastName) {
    alert('Please enter both your first and last name.');
    return;
  }
  
  const fullName = firstName + " " + lastName;
  
  chrome.storage.local.set({ userFullName: fullName }, () => {
    alert('Name saved successfully!');
  });
});
