document.getElementById('uploadBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('csvFileInput');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please choose a file first.');
    return;
  }

  const text = await file.text(); // Reads CSV as text

  // Parse CSV using Papa Parse
  Papa.parse(text, {
    header: true,          // Assumes the CSV file has headers like "Name", "Company", "LinkedInURL", etc.
    skipEmptyLines: true,  // Ignores any empty lines in the CSV
    complete: function(results) {
      const connectionsArray = results.data; // Array of connection objects
      console.log("Parsed Connections:", connectionsArray);

      // Save the parsed data to chrome.storage
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
