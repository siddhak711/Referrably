document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) {
      alert('Please choose a file first.');
      return;
    }
  
    const text = await file.text(); // Reads CSV as text
    // Parse CSV text here. You can use a simple library like Papa Parse or do it manually
  
    // Example with Papa Parse
    // Papa.parse(text, {
    //   complete: function(results) {
    //     const data = results.data; // array of rows
    //     // Store data in chrome.storage
    //   }
    // });
  
    // For simplicity, let's assume text now has your CSV text
    // Next, store it to local storage:
    chrome.storage.local.set({ connectionsCSV: text }, () => {
      alert('Connections CSV uploaded and saved successfully!');
    });
  });
  