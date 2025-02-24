// content-script.js
(function() {
    const url = window.location.href;
  
    // Check if the URL suggests we are on a job listing (very naive approach)
    const isJobListing = url.includes('indeed.com') || url.includes('linkedin.com/jobs') || url.includes('glassdoor.com');
  
    if (isJobListing) {
      // We can do something like create a small floating tooltip on the page
      // or send a message to the background or popup to notify the extension
      createReferrablyTooltip();
    }
  
    function createReferrablyTooltip() {
      const tooltip = document.createElement('div');
      tooltip.innerText = 'Referrably: We found potential connections for referrals!';
      tooltip.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #FFEB3B;
        padding: 10px;
        border-radius: 5px;
        z-index: 999999;
        cursor: pointer;
      `;
      document.body.appendChild(tooltip);
  
      tooltip.addEventListener('click', () => {
        // Show more detailed info, or open your extension's popup
        alert('Connections: ... (You will parse your CSV data here)');
      });
    }
  })();
  