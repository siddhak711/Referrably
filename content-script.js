(function() {
  const url = window.location.href;
  const isJobListing = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('glassdoor.com');

  if (isJobListing) {
    // Store the current company name
    let currentCompanyName = getCompanyName();
    updateCompany(currentCompanyName);

    // Use MutationObserver to watch for changes in the document.
    const observer = new MutationObserver(mutations => {
      const newCompanyName = getCompanyName();
      if (newCompanyName !== currentCompanyName) {
        currentCompanyName = newCompanyName;
        updateCompany(currentCompanyName);
      }
    });

    // Observe changes to the entire document body. Adjust options if needed.
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Helper function to extract the company name
  function getCompanyName() {
    let companyName = 'Unknown Company';
    if (window.location.href.includes('indeed.com')) {
      // Look for an anchor tag whose href contains "/cmp/"
      const indeedCompanyElement = document.querySelector('a[href*="/cmp/"]');
      if (indeedCompanyElement) {
        companyName = indeedCompanyElement.innerText.trim();
      }
    } else {
      // For LinkedIn or Glassdoor, use the original selectors.
      const companyElement = document.querySelector('.jobs-details-top-card__company-name') || document.querySelector('.jobCompany');
      if (companyElement) {
        companyName = companyElement.innerText.trim();
      }
    }
    return companyName;
  }

  // Update chrome storage and the tooltip display
  function updateCompany(company) {
    chrome.storage.local.set({ currentJobCompany: company });

    let tooltip = document.getElementById('referrably-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'referrably-tooltip';
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
      tooltip.addEventListener('click', () => {
        alert('Open the extension popup to see your referral options.');
      });
      document.body.appendChild(tooltip);
    }
    tooltip.innerText = `Referrably: Found referral options for ${company}!`;
  }
})();
