// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.min.js';

/**
 * Parses a PDF resume and extracts experience information
 */
async function parseResume(pdfData) {
  try {
    // Convert base64 to Uint8Array
    const pdfBytes = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0));
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    
    let fullText = '';
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Extract experience information using regex patterns
    const experiences = extractExperiencesFromText(fullText);
    return experiences;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Extracts experience information from text using regex patterns
 */
function extractExperiencesFromText(text) {
  const experiences = [];
  
  // Common section headers for experience
  const experienceHeaders = [
    /(?:work\s+)?experience/i,
    /professional\s+experience/i,
    /employment\s+history/i,
    /career\s+history/i
  ];

  // Split text into sections
  const sections = text.split(/\n{2,}/);
  
  let currentSection = '';
  let inExperienceSection = false;

  for (const section of sections) {
    // Check if this is an experience section
    if (experienceHeaders.some(header => header.test(section))) {
      inExperienceSection = true;
      currentSection = section;
      continue;
    }

    if (inExperienceSection) {
      // Look for job entries
      const jobEntries = section.split(/\n+/);
      
      for (const entry of jobEntries) {
        // Skip empty lines
        if (!entry.trim()) continue;

        // Try to extract job information
        const jobInfo = extractJobInfo(entry);
        if (jobInfo) {
          experiences.push(jobInfo);
        }
      }
    }
  }

  return experiences;
}

/**
 * Extracts job information from a text entry
 */
function extractJobInfo(entry) {
  // Common patterns for job titles and dates
  const titlePattern = /([A-Za-z\s]+(?:Developer|Engineer|Manager|Director|Consultant|Analyst|Designer|Architect|Lead|Head|Chief|Officer|President|Founder|CEO|CTO|CFO|COO))/;
  const datePattern = /(\d{4}\s*-\s*(?:\d{4}|present|current))/i;
  const companyPattern = /at\s+([A-Za-z0-9\s&]+)/i;

  const titleMatch = entry.match(titlePattern);
  const dateMatch = entry.match(datePattern);
  const companyMatch = entry.match(companyPattern);

  if (titleMatch || companyMatch) {
    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      company: companyMatch ? companyMatch[1].trim() : '',
      date: dateMatch ? dateMatch[1].trim() : '',
      description: entry.trim()
    };
  }

  return null;
}

/**
 * Scrapes experience information from a LinkedIn profile
 */
async function scrapeLinkedInProfile(profileUrl) {
  try {
    // Note: This is a placeholder. In a real implementation, you would need to:
    // 1. Handle LinkedIn authentication
    // 2. Use LinkedIn's API or scrape the profile page
    // 3. Handle rate limiting and respect LinkedIn's terms of service
    
    // For now, we'll return a mock response
    return {
      experiences: [
        {
          title: "Software Engineer",
          company: "Example Corp",
          date: "2020 - Present",
          description: "Working on web applications"
        }
      ]
    };
  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    throw error;
  }
}

/**
 * Merges and deduplicates experiences from different sources
 */
function mergeExperiences(resumeExperiences, linkedinExperiences) {
  const allExperiences = [...resumeExperiences, ...linkedinExperiences];
  
  // Remove duplicates based on company and title
  const uniqueExperiences = allExperiences.filter((exp, index, self) =>
    index === self.findIndex((e) => 
      e.company.toLowerCase() === exp.company.toLowerCase() &&
      e.title.toLowerCase() === exp.title.toLowerCase()
    )
  );

  // Sort by date (most recent first)
  return uniqueExperiences.sort((a, b) => {
    const dateA = a.date.toLowerCase().includes('present') ? '9999' : a.date.split('-')[0];
    const dateB = b.date.toLowerCase().includes('present') ? '9999' : b.date.split('-')[0];
    return dateB.localeCompare(dateA);
  });
}

// Export functions
window.parsers = {
  parseResume,
  scrapeLinkedInProfile,
  mergeExperiences
}; 