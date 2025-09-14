/* iTunes Artwork Finder Application Logic
   - iTunes API calls and search functionality
   - Movie search with custom URL generation
   - Modal popup and Save As dialog handling
   - Form management and user interface
*/

// Global variables
window.usePng = false;
window.attribute = '';

/**
 * Builds the iTunes API search URL with parameters
 * @param {string} term - Search term
 * @param {string} entity - iTunes entity type (album, song, movie, etc.)
 * @param {string} country - Country code
 * @returns {string} Complete iTunes API URL
 */
function buildUrl(term, entity, country) {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set('country', country);
  urlSearchParams.set('limit', 60);
  
  // Map entities to their corresponding media types
  const entityToMediaMap = {
    'audiobook': { media: 'audiobook', entity: 'audiobook' },
    'ebook': { media: 'ebook', entity: 'ebook' },
    'movie': { media: 'movie', entity: 'movie' },
    'tvSeason': { media: 'tvShow', entity: 'tvSeason' },
    'song': { media: 'music', entity: 'song' },
    'album': { media: 'music', entity: 'album' },
    'software': { media: 'software', entity: 'software' }
  };
  
  // Set media and entity parameters correctly
  const mediaConfig = entityToMediaMap[entity];
  if (mediaConfig) {
    urlSearchParams.set('media', mediaConfig.media);
    urlSearchParams.set('entity', mediaConfig.entity);
  } else {
    // Default to music/album for backward compatibility
    urlSearchParams.set('media', 'music');
    urlSearchParams.set('entity', entity);
  }
  
  if (typeof window !== 'undefined' && window.attribute && window.attribute.length > 0) {
    urlSearchParams.set('attribute', window.attribute);
  }
  let baseUrl = 'https://itunes.apple.com/search';
  urlSearchParams.set('term', term);
  urlSearchParams.set('callback', 'handleApiResponse'); // Add JSONP callback
  return `${baseUrl}?${urlSearchParams}`;
}

/**
 * Fetches search results from iTunes API using proxy
 * @param {string} term - Search term
 * @param {string} entity - iTunes entity type
 * @param {string} country - Country code
 * @returns {Promise<Object|null>} Search results or null on error
 */
async function fetchResults(term, entity, country) {
  // Always use proxy approach (works for both Vercel and localhost with proper setup)
  return fetchResultsProxy(term, entity, country);
}

/**
 * Fetches search results using proxy with fallback to direct iTunes API
 */
async function fetchResultsProxy(term, entity, country) {
  try {
    // Map entities to their corresponding media types (keeping all your existing mapping)
    const entityToMediaMap = {
      'audiobook': { media: 'audiobook', entity: 'audiobook' },
      'ebook': { media: 'ebook', entity: 'ebook' },
      'movie': { media: 'movie', entity: 'movie' },
      'song': { media: 'music', entity: 'song' },
      'album': { media: 'music', entity: 'album' },
      'software': { media: 'software', entity: 'software' }
    };
    
    // Build proxy URL parameters (preserving all your parameter logic)
    const params = new URLSearchParams();
    params.set('term', term);
    params.set('country', country);
    params.set('limit', '60');
    
    const mediaConfig = entityToMediaMap[entity];
    if (mediaConfig) {
      params.set('media', mediaConfig.media);
      params.set('entity', mediaConfig.entity);
    } else {
      params.set('media', 'music');
      params.set('entity', entity);
    }
    
    if (typeof window !== 'undefined' && window.attribute && window.attribute.length > 0) {
      params.set('attribute', window.attribute);
    }
    
    // Try proxy first, fallback to direct API on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isLocalhost) {
      // Use Vercel proxy for production
      const proxyUrl = `/api/itunes?${params}`;
      console.log('Fetching from Vercel proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Proxy response received:', data);
      return data;
      
    } else {
      // Direct iTunes API call for localhost (using CORS proxy service)
      const directUrl = `https://cors-anywhere.herokuapp.com/https://itunes.apple.com/search?${params}`;
      console.log('Fetching via CORS proxy for localhost:', directUrl);
      
      const response = await fetch(directUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        // Fallback to direct API call (may fail due to CORS but worth trying)
        console.log('CORS proxy failed, trying direct API call');
        const fallbackUrl = `https://itunes.apple.com/search?${params}`;
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (!fallbackResponse.ok) {
          throw new Error(`iTunes API returned ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
        }
        
        return await fallbackResponse.json();
      }
      
      const data = await response.json();
      console.log('Direct API response received:', data);
      return data;
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Fetches search results using JSONP (for localhost development)
 */
async function fetchResultsJSONP(term, entity, country) {
  const url = buildUrl(term, entity, country);
  
  return new Promise((resolve, reject) => {
    // Create a unique callback name
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Create script element
    const script = document.createElement('script');
    script.src = url.replace('callback=handleApiResponse', `callback=${callbackName}`);
    
    // Set up callback
    window[callbackName] = function(data) {
      cleanup();
      resolve(data);
    };
    
    // Handle errors
    script.onerror = function(event) {
      console.error('JSONP script load failed:', event);
      console.error('Script URL:', script.src);
      cleanup();
      reject(new Error('JSONP request failed - script load error'));
    };
    
    // Cleanup function
    function cleanup() {
      if (window[callbackName]) {
        delete window[callbackName];
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }
    
    // Add script to DOM to trigger request
    console.log('Adding JSONP script:', script.src);
    document.body.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (window[callbackName]) {
        cleanup();
        reject(new Error('Request timeout'));
      }
    }, 10000);
  });
}

/**
 * Parse search term for prefixes and return parsed components
 * @param {string} rawTerm - Raw search term with potential prefixes
 * @returns {Object} Parsed search components
 */
function parseSearchTerm(rawTerm) {
  let entity = 'album';
  let attribute = '';
  let countryCode = 'us';
  
  // Detect .png anywhere in the original term
  let usePng = false;
  if (rawTerm && rawTerm.toLowerCase().includes('.png')) {
    usePng = true;
    rawTerm = rawTerm.replace(/\.png/gi, '').trim();
  }
  
  let searchTerm = rawTerm;
  // After country/entity/attribute prefix parsing, remove .png again if present
  if (searchTerm && searchTerm.toLowerCase().includes('.png')) {
    searchTerm = searchTerm.replace(/\.png/gi, '').trim();
  }
  
  // Map attribute prefixes to iTunes API attributes and their default entities
  const attributeEntityMap = {
    'artist:': { entity: 'album', attribute: 'artistTerm' },
    'title:': { entity: 'album', attribute: 'titleTerm' },
    'author:': { entity: 'audiobook', attribute: 'authorTerm' },
    'director:': { entity: 'movie', attribute: 'directorTerm' },
    'actor:': { entity: 'movie', attribute: 'actorTerm' },
    'composer:': { entity: 'album', attribute: 'composerTerm' }
  };

  // Map entity prefixes to iTunes API entities
  const entityMap = {
    'album:': 'album',
    'song:': 'song',
    'audiobook:': 'audiobook',
    'ebook:': 'ebook',
    'movie:': 'movie',
    'tv:': 'tvSeason',
    'app:': 'software'
  };

  // Detect and parse iTunes/App Store/Books URLs for all supported media types
  const urlPattern = /(https?:\/\/(itunes|apps|books)\.apple\.com\/[^\s]+\/id(\d+))/i;
  const urlMatch = rawTerm.match(urlPattern);
  let urlParsed = false;
  let lookupMode = false;
  if (urlMatch) {
    // Extract ID from URL
    const id = urlMatch[3];
    // Determine entity by URL path
    let urlEntity = 'album';
    const urlLower = urlMatch[1].toLowerCase();
    if (urlLower.includes('/app/')) urlEntity = 'software';
    else if (urlLower.includes('/movie/')) urlEntity = 'movie';
    else if (urlLower.includes('/tv-season/') || urlLower.includes('/tvshow/')) urlEntity = 'tvSeason';
    else if (urlLower.includes('/audiobook/')) urlEntity = 'audiobook';
    else if (urlLower.includes('/book/') || urlLower.includes('/books/')) urlEntity = 'ebook';
    // Replace searchTerm with just the ID
    searchTerm = id;
    entity = urlEntity;
    attribute = '';
    lookupMode = true;
    // Remove the URL from the term
    rawTerm = id;
    urlParsed = true;
  }
  
  // Map country code prefixes
  const countryMap = {
    'uk:': 'gb',
    'us:': 'us',
    'ca:': 'ca',
    'au:': 'au',
    'fr:': 'fr',
    'de:': 'de',
    'jp:': 'jp',
    'it:': 'it',
    'es:': 'es',
    'nl:': 'nl',
    'br:': 'br',
    'mx:': 'mx',
    'ru:': 'ru',
    'se:': 'se',
    'cn:': 'cn',
    'kr:': 'kr',
    'in:': 'in',
    'za:': 'za',
    'no:': 'no',
    'dk:': 'dk',
    'fi:': 'fi',
    'pl:': 'pl',
    'at:': 'at',
    'ch:': 'ch',
    'be:': 'be',
    'pt:': 'pt',
    'gr:': 'gr',
    'tr:': 'tr',
    'ar:': 'ar',
    'cl:': 'cl',
    'co:': 'co',
    'pe:': 'pe',
    'eg:': 'eg',
    'th:': 'th',
    'id:': 'id',
    'my:': 'my',
    'sg:': 'sg',
    'ph:': 'ph',
    'vn:': 'vn',
    'tw:': 'tw',
    'hk:': 'hk',
    'nz:': 'nz',
    'ie:': 'ie',
    'cz:': 'cz',
    'sk:': 'sk',
    'hu:': 'hu',
    'ro:': 'ro',
    'bg:': 'bg',
    'hr:': 'hr',
    'si:': 'si',
    'lt:': 'lt',
    'lv:': 'lv',
    'ee:': 'ee',
    'is:': 'is',
    'lu:': 'lu',
    'mt:': 'mt',
    'cy:': 'cy'
  };
  
  // Parse prefixes from search term only if not parsed from URL
  if (searchTerm && !urlParsed) {
    let lowerTerm = searchTerm.toLowerCase();
    let entityFound = false;
    // Check for country prefix
    for (const countryPrefix in countryMap) {
      if (lowerTerm.startsWith(countryPrefix)) {
        countryCode = countryMap[countryPrefix];
        searchTerm = searchTerm.replace(new RegExp('^' + countryPrefix, 'i'), '').trim();
        lowerTerm = searchTerm.toLowerCase();
        break;
      }
    }
    // Check for entity prefix
    for (const entityPrefix in entityMap) {
      if (lowerTerm.startsWith(entityPrefix)) {
        entity = entityMap[entityPrefix];
        searchTerm = searchTerm.replace(new RegExp('^' + entityPrefix, 'i'), '').trim();
        lowerTerm = searchTerm.toLowerCase();
        entityFound = true;
        break;
      }
    }
    // Check for attribute prefix (independent of entity prefix)
    for (const attrPrefix in attributeEntityMap) {
      if (lowerTerm.startsWith(attrPrefix)) {
        // If no entity was explicitly set, use the attribute's default entity
        if (!entityFound) {
          entity = attributeEntityMap[attrPrefix].entity;
        }
        attribute = attributeEntityMap[attrPrefix].attribute;
        searchTerm = searchTerm.replace(new RegExp('^' + attrPrefix, 'i'), '').trim();
        break;
      }
    }
  }
  
  // Store attribute globally for use in iTunes API calls
  window.attribute = attribute;
  
  return { searchTerm, entity, countryCode, usePng, attribute, lookupMode };
}

/**
 * Main application initialization function
 * Parses search parameters, sets up UI, and performs search
 */
async function onload() {
  const searchParams = new URLSearchParams(window.location.search);
  const term = searchParams.get('term');
  const country = searchParams.get('country');
  
  // Parse search term for prefixes
  let searchTerm, entity, countryCode, usePng, attribute;
  if (term) {
    const parsed = parseSearchTerm(term);
    searchTerm = parsed.searchTerm;
    entity = parsed.entity;
    countryCode = country || parsed.countryCode; // URL param takes precedence
    usePng = parsed.usePng;
    attribute = parsed.attribute;
  } else {
    searchTerm = '';
    entity = 'album';
    countryCode = country || 'us';
    usePng = false;
    attribute = '';
  }
  
  window.usePng = usePng; // Store globally for modal use

  // Use existing HTML structure - just update the search input if there's a term
  const searchInput = document.getElementById('searchInput');
  if (searchInput && term) {
    searchInput.value = term;
  }
  
  // Set current year in footer
  const footerYearEl = document.getElementById('footer-year');
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  // Initialize form controls
  initializeFormControls();
  
  // Add form submit handler directly here
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const searchInput = document.getElementById('searchInput');
      const rawSearchTerm = searchInput.value.trim();
      
      if (rawSearchTerm) {
        const submitBtn = document.getElementById('submitBtn');
        
        // Show loader immediately and track start time
        const loaderStartTime = Date.now();
        if (submitBtn) {
          // Capture original button dimensions before loading
          const computedStyle = window.getComputedStyle(submitBtn);
          const originalWidth = submitBtn.offsetWidth + 'px';
          const originalHeight = submitBtn.offsetHeight + 'px';
          
          // Set CSS variables for original dimensions
          submitBtn.style.setProperty('--original-width', originalWidth);
          submitBtn.style.setProperty('--original-height', originalHeight);
          
          const textSpan = submitBtn.querySelector('.submit-text');
          const loaderSpan = submitBtn.querySelector('.submit-loader');
          
          if (textSpan) textSpan.style.display = 'none';
          if (loaderSpan) loaderSpan.style.display = 'inline-block';
          submitBtn.classList.add('loading'); // Add loading class to make button transparent
          submitBtn.disabled = true;
        }
        
        // Wait 700ms then perform search
        setTimeout(async () => {
          // Parse the search term
          const parsedSearch = parseSearchTerm(rawSearchTerm);
          
          // Add URL parameter
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('term', rawSearchTerm);
          window.history.pushState({}, '', newUrl);
          // Pass all parsed values, including lookupMode, to performSearch
          await performSearch(
            parsedSearch.searchTerm,
            parsedSearch.entity,
            parsedSearch.countryCode,
            parsedSearch.usePng,
            parsedSearch // Pass the whole object for lookupMode
          );
        }, 900);
      }
    });
  }

  // Add click event to title to reload and clear form
  const titleEl = document.getElementById('title');
  if (titleEl) {
    titleEl.addEventListener('click', function() {
      window.location.href = window.location.pathname;
    });
  }

  // If no search term, just show the form
  if (term == null || term.length == 0) {
    return;
  }

  // Perform search and display results
  await performSearch(searchTerm, entity, countryCode, usePng);
}

/**
 * Initialize form controls (clear button, submit button)
 */
function initializeFormControls() {
  const searchInput = document.getElementById('searchInput');
  const inputWrapper = document.getElementById('inputWrapper');
  const submitBtn = document.getElementById('submitBtn');
  // Use existing clear button from HTML
  let clearBtn = document.getElementById('clearBtn');
  if (searchInput && clearBtn) {
    if (typeof searchInput.value !== 'undefined' && clearBtn.style) {
      clearBtn.style.display = searchInput.value ? "block" : "none";
    }
    clearBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = "";
      if (searchInput) searchInput.focus();
      if (clearBtn && clearBtn.style) clearBtn.style.display = "none";
    });
    function toggleClearBtn() {
      if (searchInput && clearBtn && clearBtn.style) {
        clearBtn.style.display = searchInput.value ? "block" : "none";
      }
    }
    searchInput.addEventListener('input', toggleClearBtn);
  }

  // Initialize submit button
  if (submitBtn) {
    const form = document.getElementById('searchForm');
    
    // Remove any duplicate spans
    Array.from(submitBtn.querySelectorAll('.submit-text')).forEach((el, idx) => {
      if (idx > 0) el.remove();
    });
    Array.from(submitBtn.querySelectorAll('.submit-loader')).forEach((el, idx) => {
      if (idx > 0) el.remove();
    });
    
    // Ensure button has loader and text spans
    if (!submitBtn.querySelector('.submit-loader')) {
      const loaderSpan = document.createElement('span');
      loaderSpan.className = 'submit-loader';
      loaderSpan.style.display = 'none';
      submitBtn.appendChild(loaderSpan);
    }
    if (!submitBtn.querySelector('.submit-text')) {
      // Wrap existing text content in a span
      const existingText = submitBtn.textContent.trim();
      submitBtn.textContent = ''; // Clear existing text
      
      const textSpan = document.createElement('span');
      textSpan.className = 'submit-text';
      textSpan.textContent = existingText || 'Search';
      submitBtn.appendChild(textSpan);
    }
    
    // Reset button to default state
  const textSpan = submitBtn.querySelector('.submit-text');
  const loaderSpan = submitBtn.querySelector('.submit-loader');
  if (textSpan) textSpan.style.display = 'inline';
  if (loaderSpan) loaderSpan.style.display = 'none';
    
    // Form handler is now in onload() function to avoid conflicts
  }
}

/**
 * Performs the iTunes search and displays results
 * @param {string} searchTerm - Processed search term
 * @param {string} entity - Entity type
 * @param {string} countryCode - Country code
 * @param {boolean} usePng - Whether to use PNG format
 */
async function performSearch(searchTerm, entity, countryCode, usePng, loaderStartTime) {
  const resultsDiv = document.getElementById('results');
  const submitBtn = document.getElementById('submitBtn');
  
  // Only show loader progress if this is not an initial page load
  if (loaderStartTime) {
    resultsDiv.innerHTML = `<div id="progress">Loading results...</div>`;
  }

  let error;
  let results;
  window.attribute = window.attribute || '';
  
  // Helper function to ensure minimum loader duration (only if we have a start time)
  const ensureMinimumLoaderDuration = async (startTime) => {
    if (!startTime) return; // Skip if no loader timing needed
    const elapsed = Date.now() - startTime;
    const minDuration = 1000; // 1000ms minimum
    if (elapsed < minDuration) {
      await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
    }
  };
  
  // Helper function to reset button state (only if we're in a loading state)
  const resetButtonState = () => {
    if (submitBtn && loaderStartTime) {
      const textSpan = submitBtn.querySelector('.submit-text');
      const loaderSpan = submitBtn.querySelector('.submit-loader');
      if (textSpan) textSpan.style.display = 'inline';
      if (loaderSpan) loaderSpan.style.display = 'none';
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  };
  
  try {
    // If lookupMode is true, use lookup API
    let lookupMode = false;
    if (typeof arguments[4] === 'object' && arguments[4] !== null && arguments[4].lookupMode) {
      lookupMode = arguments[4].lookupMode;
    }
    results = lookupMode ? await fetchResultsLookup(searchTerm, countryCode) : await fetchResults(searchTerm, entity, countryCode);
  } catch(e) {
    error = e.message;
  }
/**
 * Fetches search results using iTunes Lookup API for direct ID searches
 * @param {string} id - The Apple ID to look up
 * @param {string} country - Country code
 * @returns {Promise<Object|null>} Lookup results or null on error
 */
async function fetchResultsLookup(id, country) {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set('id', id);
  urlSearchParams.set('country', country);
  let baseUrl = 'https://itunes.apple.com/lookup';
  // Only add callback for localhost/JSONP
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    urlSearchParams.set('callback', 'handleApiResponse');
    const url = `${baseUrl}?${urlSearchParams}`;
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');
      script.src = url.replace('callback=handleApiResponse', `callback=${callbackName}`);
      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };
      script.onerror = function(event) {
        console.error('JSONP script load failed:', event);
        cleanup();
        reject(new Error('JSONP request failed - script load error'));
      };
      function cleanup() {
        if (window[callbackName]) {
          delete window[callbackName];
        }
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }
      document.body.appendChild(script);
      setTimeout(() => {
        if (window[callbackName]) {
          cleanup();
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  } else {
    // No callback for production fetch
    const url = `${baseUrl}?${urlSearchParams}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lookup API returned ${response.status}: ${response.statusText}`);
    }
    const jsonResult = await response.json();
    return jsonResult;
  }
}

  // Ensure loader shows for at least 1000ms before hiding it
  await ensureMinimumLoaderDuration(loaderStartTime);
  
  if (results == null) {
    resultsDiv.innerHTML = `<div id="error"><p>Sorry, some error occurred while loading the results...</p>${error !== null ? `<p>(${error})</p>` : ""}</div>`;
    // Hide loader for error case
    resetButtonState();
  } else {
    const resultItems = results["results"];
    if (resultItems === null || !Array.isArray(resultItems) || resultItems.length === 0) {
      resultsDiv.innerHTML = `<div id="error">Sorry, no results...</div>`;
      // Hide loader for no results case
      resetButtonState();
    } else {
      displayResults(resultItems, entity, usePng);
      // Reset button after successful results display
      resetButtonState();
    }
  }
}

/**
 * Displays search results in the results container
 * @param {Array} resultItems - Array of iTunes search results
 * @param {string} entity - Entity type
 * @param {boolean} usePng - Whether to use PNG format
 */
function displayResults(resultItems, entity, usePng) {
  const resultsDiv = document.getElementById('results');
  
  resultsDiv.innerHTML = `${resultItems.map(result => {
    const artworkUrl100 = result["artworkUrl100"];
    
    // Helper to replace and clean up the URL
    function fixArtworkUrl(url, size) {
      // Replace dimension and ensure -999
      let newUrl = url.replace(/(\/)\d+x\d+(bb)?/, `$1${size}x${size}-999`);
      // Ensure it ends with .jpg
      if (!newUrl.endsWith('.jpg')) {
        newUrl += '.jpg';
      }
      // If .png search parameter is used, convert .jpg to .png
      if (usePng) {
        newUrl = newUrl.replace(/\.jpg$/, '.png');
      }
      return newUrl;
    }
    
    const artworkUrl300 = fixArtworkUrl(artworkUrl100, 300);
    const artworkUrl600 = fixArtworkUrl(artworkUrl100, 600);
    const artworkUrl1500 = fixArtworkUrl(artworkUrl100, 1500);
    const artworkUrl3000 = fixArtworkUrl(artworkUrl100, 3000);
    
    // Generate high-resolution URL
    let artworkUrl5000 = fixArtworkUrl(artworkUrl100, 10000);
    artworkUrl5000 = artworkUrl5000.replace(
      /^https:\/\/.*?\.mzstatic\.com\/image\/thumb\/(.*)\/.*\.(jpg|png)$/,
      "https://a1.mzstatic.com/us/r1000/063/$1"
    );
    // Remove 'bb' only if it appears after the last / and before .jpg/.png
    artworkUrl5000 = artworkUrl5000.replace(/\/([^\/]*?)bb(\.(jpg|png|webp|tif))$/, '/$1$2');
    
    // For ebooks, create special 1467x2200 format
    let artworkUrl1467x2200 = '';
    if (entity === 'ebook') {
      artworkUrl1467x2200 = artworkUrl100.replace('100x100', '1467x2200');
      artworkUrl1467x2200 = artworkUrl1467x2200.replace(/bb(?=\.jpg)/, '');
      // Ensure -999 before .jpg
      artworkUrl1467x2200 = artworkUrl1467x2200.replace(/(1467x2200)(?!-999)(?=\.jpg)/, '$1-999');
      // If .jpg is missing, add -999.jpg
      if (!artworkUrl1467x2200.endsWith('.jpg')) {
        if (!/-999$/.test(artworkUrl1467x2200)) {
          artworkUrl1467x2200 += '-999';
        }
        artworkUrl1467x2200 += '.jpg';
      }
      // Convert to .png if requested
      if (usePng) {
        artworkUrl1467x2200 = artworkUrl1467x2200.replace(/\.jpg$/, '.png');
      }
    }
    
    // Get release year
    let year = '';
    if (result['releaseDate']) {
      const d = new Date(result['releaseDate']);
      if (!isNaN(d.getFullYear())) {
        year = ` (${d.getFullYear()})`;
      }
    }
    
    // Format display title
    let displayTitle = result['collectionName'];
    if (entity === 'album') {
      if (/\bEP\b/i.test(result['collectionName'])) {
        displayTitle = displayTitle.replace(/\s*-?\s*EP\b/i, '').trim();
        displayTitle += ' [EP]';
      } else if (/\bSingle\b/i.test(result['collectionName'])) {
        displayTitle = displayTitle.replace(/\s*-?\s*Single\b/i, '').trim();
        displayTitle += ' [Single]';
      }
    }
    
    const title = entity === 'album' ? `${result['artistName']} - ${displayTitle}${year}` : (result['collectionName'] || result['trackName']);
    let viewUrl = result['collectionViewUrl'] || result['trackViewUrl'] || result['artistViewUrl'] || result['viewUrl'] || '#';
    
    // Generate download links based on entity type
    let linksHtml = '';
    if (entity === 'audiobook') {
      let artworkUrl3000Audiobook = artworkUrl3000;
      if (usePng) {
        artworkUrl3000Audiobook = artworkUrl3000Audiobook.replace(/\.jpg$/, '.png');
      }
      linksHtml = `
        <a href="${artworkUrl3000Audiobook}" download><span>3000</span></a>
        <a href="${artworkUrl5000}" download><span>HD</span></a>
      `;
    } else if (entity === 'ebook') {
      let artworkUrl1467x2200Ebook = artworkUrl1467x2200;
      if (usePng) {
        artworkUrl1467x2200Ebook = artworkUrl1467x2200Ebook.replace(/\.jpg$/, '.png');
      }
      linksHtml = `
        <a href="${artworkUrl1467x2200Ebook}" download><span>2200</span></a>
        <a href="${artworkUrl5000}" download><span>HD</span></a>
      `;
    } else if (entity === 'movie') {
      // For movies, generate special 10000x10000-999.jpg URL format
      let movieHdUrl = artworkUrl100.replace(/100x100/, '10000x10000-999');
      // Remove 'bb' only if it appears before the file extension
      movieHdUrl = movieHdUrl.replace(/bb(\.(jpg|png|webp|tif))$/, '$1');
      // Ensure .jpg extension for movies - add it if missing
      if (!movieHdUrl.endsWith('.jpg')) {
        // First remove any existing extension, then add .jpg
        movieHdUrl = movieHdUrl.replace(/\.(png|webp|tif)$/, '');
        if (!movieHdUrl.endsWith('.jpg')) {
          movieHdUrl += '.jpg';
        }
      }
      // Convert to .png if requested
      if (usePng) {
        movieHdUrl = movieHdUrl.replace(/\.jpg$/, '.png');
      }
      linksHtml = `
        <a href="${movieHdUrl}" download><span>HD</span></a>
      `;
    } else if (entity === 'tvSeason') {
      // For TV shows, use the same HD URL generation as movies
      let tvHdUrl = artworkUrl100.replace(/100x100/, '10000x10000-999');
      // Remove 'bb' only if it appears before the file extension
      tvHdUrl = tvHdUrl.replace(/bb(\.(jpg|png|webp|tif))$/, '$1');
      // Ensure .jpg extension for TV shows - add it if missing
      if (!tvHdUrl.endsWith('.jpg')) {
        // First remove any existing extension, then add .jpg
        tvHdUrl = tvHdUrl.replace(/\.(png|webp|tif)$/, '');
        if (!tvHdUrl.endsWith('.jpg')) {
          tvHdUrl += '.jpg';
        }
      }
      // Convert to .png if requested
      if (usePng) {
        tvHdUrl = tvHdUrl.replace(/\.jpg$/, '.png');
      }
      linksHtml = `
        <a href="${tvHdUrl}" download><span>HD</span></a>
      `;
    } else if (entity === 'software') {
      // For iOS apps, use the same HD URL generation as music
      let appHdUrl = fixArtworkUrl(artworkUrl100, 10000);
      appHdUrl = appHdUrl.replace(
        /^https:\/\/.*?\.mzstatic\.com\/image\/thumb\/(.*)\/.*\.(jpg|png)$/,
        "https://a1.mzstatic.com/us/r1000/063/$1"
      );
      // Remove 'bb' only if it appears after the last / and before .jpg/.png
      appHdUrl = appHdUrl.replace(/\/([^\/]*?)bb(\.(jpg|png|webp|tif))$/, '/$1$2');
      // Convert to .png if requested
      if (usePng) {
        appHdUrl = appHdUrl.replace(/\.jpg$/, '.png');
      }
      linksHtml = `
        <a href="${appHdUrl}" download><span>HD</span></a>
      `;
    } else {
      linksHtml = `
        <a href="${artworkUrl600}" download><span>600</span></a>
        <a href="${artworkUrl1500}" download><span>1500</span></a>
        <a href="${artworkUrl3000}" download><span>3000</span></a>
        <a href="${artworkUrl5000}" download><span>HD</span></a>
      `;
    }
    
    // Determine CSS class - TV shows use same layout as movies but different styling
    let cssClass = '';
    if (entity === 'audiobook') cssClass = ' audiobook';
    else if (entity === 'ebook') cssClass = ' ebook';
    else if (entity === 'movie') cssClass = ' movie';
    else if (entity === 'tvSeason') cssClass = ' tv';
    else if (entity === 'software') cssClass = ' app';
    
    return `<div class="result${cssClass}">
      <div class="artwork">
        <img src="${artworkUrl300}" />
      </div>
      <div class="links">
        ${linksHtml}
      </div>
      <h2><a href="${viewUrl}" target="_blank">${title}</a></h2>
    </div>`;
  }).join('')}`;
  
  // Initialize post-render functionality
  handleCardSelection();
  initializeArtworkModal();
  addSaveAsDialogLogic();
  
  // Hide loader in button after everything is rendered
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    const textSpan = submitBtn.querySelector('.submit-text');
    const loaderSpan = submitBtn.querySelector('.submit-loader');
    if (textSpan) textSpan.style.display = 'inline';
    if (loaderSpan) loaderSpan.style.display = 'none';
    submitBtn.disabled = false;
  }
}

/**
 * Initialize artwork modal functionality
 */
function initializeArtworkModal() {
  document.querySelectorAll('.result .artwork img').forEach(function(img) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Find parent card and extract info
      const card = img.closest('.result');
      const titleLink = card.querySelector('h2 a');
      const title = titleLink ? titleLink.textContent : '';
      const viewUrl = titleLink ? titleLink.getAttribute('href') : '#';
      
      // Check if this is a movie, TV, or app card
      const isMovie = card.classList.contains('movie');
      const isTv = card.classList.contains('tv');
      const isApp = card.classList.contains('app');
      
      // Get the original artworkUrl100 from the card's image src
      let artworkUrl100 = img.src.replace(/(\d+)x\1(-999)?.*$/, '100x100');
      
      // Generate large image URL - use special format for movies, TV, and apps
      let largeSrc = '';
      if (isMovie || isTv) {
        // For movies and TV shows, use the special 10000x10000-999.jpg format
        largeSrc = artworkUrl100.replace(/100x100/, '10000x10000-999');
        // Remove 'bb' only if it appears before the file extension
        largeSrc = largeSrc.replace(/bb(\.(jpg|png|webp|tif))$/, '$1');
        // Ensure .jpg extension for movies - add it if missing
        if (!largeSrc.endsWith('.jpg')) {
          // First remove any existing extension, then add .jpg
          largeSrc = largeSrc.replace(/\.(png|webp|tif)$/, '');
          if (!largeSrc.endsWith('.jpg')) {
            largeSrc += '.jpg';
          }
        }
        // Convert to .png if requested
        if (window.usePng) {
          largeSrc = largeSrc.replace(/\.jpg$/, '.png');
        }
      } else if (isApp) {
        // For iOS apps, use the same HD URL generation as music
        largeSrc = artworkUrl100.replace(/100x100/, '10000x10000-999.jpg');
        largeSrc = largeSrc.replace(
          /^https:\/\/.*?\.mzstatic\.com\/image\/thumb\/(.*)\/.*\.(jpg|png)$/,
          "https://a1.mzstatic.com/us/r1000/063/$1"
        );
        // Remove 'bb' only if it appears after the last / and before .jpg/.png
        largeSrc = largeSrc.replace(/\/([^\/]*?)bb(\.(jpg|png|webp|tif))$/, '/$1$2');
        // Convert to .png if requested
        if (window.usePng) {
          largeSrc = largeSrc.replace(/\.jpg$/, '.png');
        }
      } else {
        // For non-movies, use the existing logic
        largeSrc = img.src.replace(/300x300|300x300-999|300x300\.jpg|300x300\.png/, '10000x10000-999.jpg');
        // Remove any duplicate -999.jpg at the end
        largeSrc = largeSrc.replace(/(-999\.jpg)+$/, '-999.jpg');
        // If .png search parameter is used, ensure .png extension
        if (window.usePng) {
          largeSrc = largeSrc.replace(/\.jpg(-999)?\.png$/, '.png').replace(/\.jpg$/, '.png');
        }
      }
      
      // Get artwork size buttons HTML from card
      const linksDiv = card.querySelector('.links');
      const linksHtml = linksDiv ? linksDiv.innerHTML : '';
      
      const modal = document.getElementById('artworkModal');
      
      // Add content type classes to modal container for styling
      modal.classList.remove('is-tv', 'is-movie', 'is-app');
      if (isTv) {
        modal.classList.add('is-tv');
      } else if (isMovie) {
        modal.classList.add('is-movie');
      } else if (isApp) {
        modal.classList.add('is-app');
      }
      
      modal.innerHTML = `<div class="modal-content">
        <button class="modal-close" title="Close">&#10006;</button>
        <img class="modal-artwork" src="${largeSrc}" alt="Album Art" />
        <div class="modal-links">${linksHtml}</div>
        <h2 class="modal-title"><a href="${viewUrl}" target="_blank">${title}</a></h2>
      </div>`;
      modal.style.display = 'flex';
      
      // Close modal on click outside or close button
      modal.onclick = function(ev) {
        if (ev.target === modal || ev.target.classList.contains('modal-close')) {
          modal.style.display = 'none';
          modal.innerHTML = '';
          modal.classList.remove('is-tv', 'is-movie', 'is-app'); // Clear all content type classes
        }
      };
      
      // Add Save As dialog logic to modal artwork size buttons
      modal.querySelectorAll('.modal-links a').forEach(function(link) {
        // Content-specific hover styles are now handled by CSS classes
        
        link.addEventListener('click', function(e) {
          if (shouldOpenInNewTab()) {
            // On mobile/tablet devices, open in new tab
            link.setAttribute('target', '_blank');
            return;
          }
          e.preventDefault();
          downloadFile(link.getAttribute('href'), link.textContent);
        });
      });
    });
  });
}

/**
 * Check if device should use "open in new tab" instead of Save As dialog
 * @returns {boolean} True if device should open in new tab
 */
function shouldOpenInNewTab() {
  // Check for small screens (phones)
  if (window.matchMedia('(max-width: 600px)').matches) {
    return true;
  }
  
  // Check for iPads and tablets
  if (window.matchMedia('(max-width: 1024px) and (orientation: portrait)').matches ||
      window.matchMedia('(max-width: 1366px) and (orientation: landscape)').matches) {
    // Additional iPad detection via user agent
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('ipad') || 
        (userAgent.includes('macintosh') && 'ontouchend' in document)) {
      return true;
    }
    
    // Generic tablet detection
    if (userAgent.includes('tablet') || 
        userAgent.includes('android') && !userAgent.includes('mobile')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Add Save As dialog functionality to download links
 */
function addSaveAsDialogLogic() {
  document.querySelectorAll('.result .links a[download]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (shouldOpenInNewTab()) {
        // On mobile/tablet devices, open in new tab
        link.setAttribute('target', '_blank');
        return;
      }
      e.preventDefault();
      downloadFile(link.getAttribute('href'), link.textContent);
    });
  });
}

/**
 * Handle file download with Save As dialog
 * @param {string} url - File URL to download
 * @param {string} linkText - Text content of the link (for fallback filename)
 */
function downloadFile(url, linkText) {
  // Extract filename from URL
  let filename = url.split('/').pop().split('?')[0];
  // Fallback: use link text if filename is empty
  if (!filename || filename.length < 5) {
    filename = linkText + (url.endsWith('.png') ? '.png' : '.jpg');
  }
  
  fetch(url, {mode: 'cors'})
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    })
    .catch(() => {
      window.open(url, '_blank');
    });
}

/**
 * Handle album card selection highlighting
 */
function handleCardSelection() {
  document.querySelectorAll('.result').forEach(card => {
    card.addEventListener('click', function() {
      document.querySelectorAll('.result.selected').forEach(sel => sel.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onload);
} else {
  onload();
}