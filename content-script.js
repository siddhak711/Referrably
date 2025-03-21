(function() {
  const url = window.location.href;
  const isJobListing = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('glassdoor.com');

  if (isJobListing) {
    let currentCompanyName = getCompanyName();
    updateCompany(currentCompanyName);

    // Watch for changes to the DOM in case the job listing updates dynamically
    const observer = new MutationObserver(() => {
      const newCompanyName = getCompanyName();
      if (newCompanyName !== currentCompanyName) {
        currentCompanyName = newCompanyName;
        updateCompany(currentCompanyName);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Clean a company name by lowercasing and removing non-alphanumeric characters
  function cleanCompanyName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Returns true if the cleaned versions of company1 and company2 appear to match
  function isMatchingCompany(company1, company2) {
    const cleaned1 = cleanCompanyName(company1);
    const cleaned2 = cleanCompanyName(company2);
    // Check if either string is contained in the other
    return cleaned1.includes(cleaned2) || cleaned2.includes(cleaned1);
  }

  // ------------------------------------------------------------
  //                DETECT COMPANY NAME PER SITE
  // ------------------------------------------------------------
  function getCompanyName() {
    let companyName = '';

    // ------------------ Indeed ------------------ //
    if (window.location.href.includes('indeed.com')) {
      // Existing method 1: Check for .jobsearch-InlineCompanyRating
      const companyContainer = document.querySelector('.jobsearch-InlineCompanyRating');
      if (companyContainer) {
        const spanEl = companyContainer.querySelector('span');
        if (spanEl) {
          companyName = spanEl.innerText.trim();
        }
      }
      // Existing method 2: Check for a link containing "/cmp/"
      if (!companyName) {
        const cmpLink = document.querySelector('a[href*="/cmp/"]');
        if (cmpLink) {
          let label = cmpLink.getAttribute('aria-label') || '';
          label = label.replace(/\s*\(opens in a new tab\)/i, '').trim();
          companyName = label || cmpLink.innerText.trim();
        }
      }
      // Additional method: Use XPath for the new Indeed company page layout.
      if (!companyName && document.getElementById('jobsearch-ViewjobPaneWrapper')) {
        const xpath = '//*[@id="jobsearch-ViewjobPaneWrapper"]/div/div[2]/div[2]/div[1]/div/div[1]/div[2]/div[2]/div/div/div[1]/div[1]/span/a';
        const xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (xpathResult.singleNodeValue) {
          companyName = xpathResult.singleNodeValue.textContent.trim();
        }
      }
    }
    // ------------------ LinkedIn ------------------ //
    else if (window.location.href.includes('linkedin.com/jobs')) {
      /**
       * We try multiple LinkedIn job-page selectors in order.
       * If we find "Google logo", we remove the word "logo" to avoid "Google logo".
       */
      let compEl =
        document.querySelector('.jobs-details-jobs-unified-top-card__company-name a') ||
        document.querySelector('.jobs-details-jobs-unified-top-card__company-name') ||
        document.querySelector('.jobs-unified-top-card__company-name a') ||
        document.querySelector('.jobs-unified-top-card__company-name') ||
        document.querySelector('.jobs-unified-top-card__subtitle a') ||
        document.querySelector('a[href*="/company/"]') ||
        document.querySelector('.topcard__org-name-link') ||
        document.querySelector('[data-test-about-company-name-link]');

      if (compEl) {
        // Check aria-label first
        let ariaLabel = compEl.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) {
          // Remove "logo" if it appears
          let label = ariaLabel.trim().replace(/\blogo\b/i, '').trim();
          if (label) {
            companyName = label;
          } else {
            // Fallback to the text if label becomes empty
            let text = compEl.innerText.trim().replace(/\blogo\b/i, '').trim();
            companyName = text;
          }
        } else {
          // If no aria-label, just use the text content
          let text = compEl.innerText.trim().replace(/\blogo\b/i, '').trim();
          companyName = text;
        }
      }
    }
    // ------------------ Glassdoor ------------------ //
    else if (window.location.href.includes('glassdoor.com')) {
      // Example placeholder; update the selector if needed.
      const compEl = document.querySelector('.css-xx');
      if (compEl) {
        companyName = compEl.innerText.trim();
      }
    }

    return companyName || 'Unknown Company';
  }

  // ------------------------------------------------------------
  //    UPDATE STORAGE & SHOW TOOLTIP BASED ON CONNECTIONS
  // ------------------------------------------------------------
  function updateCompany(company) {
    chrome.storage.local.set({ currentJobCompany: company });

    chrome.storage.local.get(['connectionsData'], (result) => {
      const connections = result.connectionsData || [];
      const target = company.trim().toLowerCase();

      const relevant = connections.filter(conn => {
        if (!conn["Company"]) return false;
        return isMatchingCompany(conn["Company"], company);
      });

      let tooltip = document.getElementById('referrably-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'referrably-tooltip';
        tooltip.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #1B5E20;
          color: #FFFFFF;
          padding: 12px 16px;
          border: 2px solid #1B5E20;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          z-index: 999999;
          font-family: 'Montserrat', "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 14px;
          cursor: pointer;
          max-width: 300px;
          transition: transform 0.2s ease, background-color 0.2s ease;
        `;
        
        // Add hover effects to create a subtle pop effect
        tooltip.addEventListener('mouseover', () => {
          tooltip.style.transform = 'scale(1.05)';
          tooltip.style.backgroundColor = '#2E7D32'; // slightly lighter green on hover
        });
        tooltip.addEventListener('mouseout', () => {
          tooltip.style.transform = 'scale(1)';
          tooltip.style.backgroundColor = '#1B5E20';
        });
        
        tooltip.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: "openPopup" });
        });
        
        document.body.appendChild(tooltip);
      }

      if (relevant.length > 0) {
        tooltip.innerText = `Referrably: Found ${relevant.length} referral option(s) for ${company}!`;
      } else {
        tooltip.innerText = `Referrably: No referral options found for ${company}.`;
      }
    });
  }
})();
