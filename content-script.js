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
      const companyContainer = document.querySelector('.jobsearch-InlineCompanyRating');
      if (companyContainer) {
        const spanEl = companyContainer.querySelector('span');
        if (spanEl) {
          companyName = spanEl.innerText.trim();
        }
      }
      if (!companyName) {
        const cmpLink = document.querySelector('a[href*="/cmp/"]');
        if (cmpLink) {
          let label = cmpLink.getAttribute('aria-label') || '';
          label = label.replace(/\s*\(opens in a new tab\)/i, '').trim();
          companyName = label || cmpLink.innerText.trim();
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
          background-color: #FFEB3B;
          padding: 10px;
          border-radius: 5px;
          z-index: 999999;
          cursor: pointer;
        `;
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
