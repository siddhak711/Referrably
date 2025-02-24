(function() {
  const url = window.location.href;
  const isJobListing = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('glassdoor.com');

  if (isJobListing) {
    // Store the current company name and update the tooltip
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

    // Observe changes to the entire document body.
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Helper function to extract the company name
  function getCompanyName() {
    let companyName = 'Unknown Company';
    if (window.location.href.includes('indeed.com')) {
      // First try to find the outbound link version
      const indeedLinkElement = document.querySelector('a[href*="/cmp/"]');
      if (indeedLinkElement && indeedLinkElement.innerText.trim().length > 0) {
        companyName = indeedLinkElement.innerText.trim();
      } else {
        // Fallback: try to find static text version
        let staticCompanyElement = document.querySelector('span.css-1u7c3eu.e1wnkr790');
        if (!staticCompanyElement) {
          staticCompanyElement = document.querySelector('span.css-1u7c3eu');
        }
        if (staticCompanyElement && staticCompanyElement.innerText.trim().length > 0) {
          companyName = staticCompanyElement.innerText.trim();
        }
      }
    } else {
      // For LinkedIn or Glassdoor, use the original selectors.
      const companyElement = document.querySelector('.jobs-details-top-card__company-name') ||
                             document.querySelector('.jobCompany');
      if (companyElement) {
        companyName = companyElement.innerText.trim();
      }
    }
    return companyName;
  }

  // Update chrome storage and the tooltip display based on matching connections
  function updateCompany(company) {
    chrome.storage.local.set({ currentJobCompany: company });

    // Retrieve connections from storage and filter them based on the company name.
    chrome.storage.local.get(['connectionsData'], (result) => {
      const connections = result.connectionsData || [];
      const target = company.trim().toLowerCase();
      const relevant = connections.filter(conn => {
        if (!conn["Company"]) return false;
        return conn["Company"].trim().toLowerCase().includes(target);
      });

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
      // Update tooltip text based on whether any matching connections were found.
      if (relevant.length > 0) {
        tooltip.innerText = `Referrably: Found ${relevant.length} referral option(s) for ${company}!`;
      } else {
        tooltip.innerText = `Referrably: No referral options found for ${company}.`;
      }
    });
  }
})();
