// Update file status on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check connections file status
  chrome.storage.local.get('connectionsData', (result) => {
    const fileStatus = document.getElementById('fileStatus');
    if (result.connectionsData && result.connectionsData.length > 0) {
      fileStatus.textContent = "Connections file already uploaded. Upload a new file to replace it.";
    } else {
      fileStatus.textContent = "No connections file uploaded yet.";
    }
  });

  // Check resume/profile status
  chrome.storage.local.get(['resumeData', 'linkedinProfileUrl'], (result) => {
    const resumeStatus = document.getElementById('resumeStatus');
    if (result.resumeData || result.linkedinProfileUrl) {
      resumeStatus.textContent = "Resume/profile already uploaded. Upload new files to replace them.";
    } else {
      resumeStatus.textContent = "No resume/profile uploaded yet.";
    }
  });
});

// Existing file upload code with an update to the status message after a successful upload.
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
        document.getElementById('fileStatus').textContent = "Connections file already uploaded. Upload a new file to replace it.";
      });
    },
    error: function(err) {
      console.error("Error parsing CSV: ", err);
      alert('Error parsing CSV file.');
    }
  });
});

// Existing code for saving the user name.
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

// Handle resume and LinkedIn profile upload
document.getElementById('saveResumeBtn').addEventListener('click', async () => {
  const resumeFile = document.getElementById('resumeFileInput').files[0];
  const linkedinUrl = document.getElementById('linkedinUrlInput').value.trim();
  
  if (!resumeFile && !linkedinUrl) {
    alert('Please upload a resume or provide a LinkedIn profile URL.');
    return;
  }

  // Validate LinkedIn URL if provided
  if (linkedinUrl && !linkedinUrl.match(/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/)) {
    alert('Please enter a valid LinkedIn profile URL.');
    return;
  }

  try {
    let resumeExperiences = [];
    let linkedinExperiences = [];

    // Handle resume file if provided
    if (resumeFile) {
      if (resumeFile.type !== 'application/pdf') {
        alert('Please upload a PDF file for your resume.');
        return;
      }

      try {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Parse the resume
        resumeExperiences = await window.parsers.parseResume(base64Data);
        
        // Store the raw PDF data
        chrome.storage.local.set({ 
          resumeData: base64Data,
          resumeFileName: resumeFile.name
        });
      } catch (error) {
        console.error('Error processing resume:', error);
        alert('Error processing resume file.');
        return;
      }
    }

    // Handle LinkedIn profile if provided
    if (linkedinUrl) {
      try {
        const linkedinData = await window.parsers.scrapeLinkedInProfile(linkedinUrl);
        linkedinExperiences = linkedinData.experiences;
        
        // Store the LinkedIn URL
        chrome.storage.local.set({ linkedinProfileUrl: linkedinUrl });
      } catch (error) {
        console.error('Error processing LinkedIn profile:', error);
        alert('Error processing LinkedIn profile.');
        return;
      }
    }

    // Merge and deduplicate experiences
    const allExperiences = window.parsers.mergeExperiences(resumeExperiences, linkedinExperiences);

    // Store the parsed experiences
    chrome.storage.local.set({ 
      userExperiences: allExperiences,
      lastUpdated: new Date().toISOString()
    }, () => {
      // Update status message
      const resumeStatus = document.getElementById('resumeStatus');
      resumeStatus.textContent = `Resume/profile saved successfully! Found ${allExperiences.length} experiences.`;
      
      // Clear inputs
      document.getElementById('resumeFileInput').value = '';
      document.getElementById('linkedinUrlInput').value = '';
    });

  } catch (error) {
    console.error('Error saving profile data:', error);
    alert('Error saving profile data. Please try again.');
  }
});
