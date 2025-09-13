/* iTunes Artwork Finder   // Map entities to their corresponding media types
  const entityToMediaMap = {
    'audiobook': { media: 'audiobook', entity: 'audiobook' },
    'ebook': { media: 'ebook', entity: 'ebook' },
    'movie': { media: 'movie', entity: 'movie' },
    'song': { media: 'music', entity: 'song' },
    'album': { media: 'music', entity: 'album' },
    'software': { media: 'software', entity: 'software' }
  };pplication Logic
   - iTunes API calls and search functionality
   - Movie search with custom URL generation
   - Modal popup and Save As dialog handling
   - Form management and user interface
*/

'use strict';

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
  return `${baseUrl}?${urlSearchParams}`;
}

/**
 * Fetches search results from iTunes API
 * @param {string} term - Search term
 * @param {string} entity - iTunes entity type
 * @param {string} country - Country code
 * @returns {Object|null} Search results or null on error
 */
async function fetchResults(term, entity, country) {
  const url = buildUrl(term, entity, country);
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

/**
 * Main application initialization function
 * Parses search parameters, sets up UI, and performs search
 */
async function onload() {
  const searchParams = new URLSearchParams(window.location.search);
  const term = searchParams.get('term');
  let entity = 'album';
  let attribute = '';
  let countryCode = 'us';
  const country = searchParams.get('country');
  if (country) countryCode = country;
  
  // Detect .png anywhere in the original term
  let usePng = false;
  let rawTerm = term || "";
  if (rawTerm.toLowerCase().includes('.png')) {
    usePng = true;
    rawTerm = rawTerm.replace(/\.png/gi, '').trim();
  }
  window.usePng = usePng; // Store globally for modal use
  
  let searchTerm = rawTerm;
  // After country/entity/attribute prefix parsing, remove .png again if present
  if (searchTerm && searchTerm.toLowerCase().includes('.png')) {
    searchTerm = searchTerm.replace(/\.png/gi, '').trim();
  }
  
  // Map attribute prefixes to iTunes API attributes and their default entities
  const attributeEntityMap = {
    'artist:': { entity: 'album', attribute: 'artistTerm' },
    'title:': { entity: 'album', attribute: 'titleTerm' },
    'author:': { entity: 'audiobook', attribute: 'authorTerm' }
  };
  
  // Map entity prefixes to iTunes API entities
  const entityMap = {
    'album:': 'album',
    'song:': 'song',
    'audiobook:': 'audiobook',
    'ebook:': 'ebook',
    'movie:': 'movie',
    'app:': 'software'
  };
  
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
    'za:': 'za'
  };
  
  // Parse prefixes from search term
  if (searchTerm) {
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

  // Build the page HTML structure
  document.body.innerHTML = `
    <header class="site-header"></header>
    <div class="site-logo"></div>
    <form id="searchForm" method="GET">
      <div id="searchField">
        <h1 id="title" style="text-align:center;cursor:pointer;">iTunes Artwork Finder</h1>
        <div class="input-row">
          <div id="inputWrapper">
            <input id="searchInput" type="text" name="term" value="${term || ""}" placeholder="Enter search term here" style="width:100%;padding-right:2em;" />
          </div>
          <button id="submitBtn" type="submit"></button>
        </div>
      </div>
      <div id="options"></div>
    </form>
    <div id="results"></div>
    <div id="artworkModal" style="display:none;"></div>
    <footer class="site-footer">
      © <span id="footer-year"></span> Tyrrtech, Inc. All Rights Reserved.
    </footer>
  `;
  
  // Set current year in footer
  const footerYearEl = document.getElementById('footer-year');
  if (footerYearEl) {
    footerYearEl.textContent = new Date().getFullYear();
  }

  // Initialize form controls
  initializeFormControls();

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
  
  // Create clear button
  let clearBtn = document.createElement('button');
  clearBtn.id = 'clearBtn';
  clearBtn.type = 'button';
  clearBtn.innerHTML = '&#10006;';
  inputWrapper.appendChild(clearBtn);
  clearBtn.style.display = searchInput.value ? "block" : "none";
  
  clearBtn.addEventListener('click', function() {
    searchInput.value = "";
    searchInput.focus();
    clearBtn.style.display = "none";
  });
  
  function toggleClearBtn() {
    clearBtn.style.display = searchInput.value ? "block" : "none";
  }
  searchInput.addEventListener('input', toggleClearBtn);

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
    
    // Ensure button has loader and text
    if (!submitBtn.querySelector('.submit-loader')) {
      const loaderSpan = document.createElement('span');
      loaderSpan.className = 'submit-loader';
      loaderSpan.style.display = 'none';
      submitBtn.appendChild(loaderSpan);
    }
    if (!submitBtn.querySelector('.submit-text')) {
      const textSpan = document.createElement('span');
      textSpan.className = 'submit-text';
      textSpan.textContent = 'Search';
      submitBtn.appendChild(textSpan);
    }
    
    // Reset button to default state
    submitBtn.querySelector('.submit-text').style.display = 'inline';
    submitBtn.querySelector('.submit-loader').style.display = 'none';
    
    // Add submit handler
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show loading state
      const btnParent = submitBtn.parentNode;
      submitBtn.style.display = 'none';
      
      // Create loader button
      let loaderBtn = document.getElementById('main-loader-btn');
      if (!loaderBtn) {
        loaderBtn = document.createElement('button');
        loaderBtn.id = 'main-loader-btn';
        loaderBtn.type = 'button';
        loaderBtn.style.display = 'inline-flex';
        loaderBtn.style.alignItems = 'center';
        loaderBtn.style.justifyContent = 'center';
        loaderBtn.style.background = 'none';
        loaderBtn.style.border = 'none';
        loaderBtn.style.padding = submitBtn.style.padding;
        loaderBtn.innerHTML = '<span class="submit-loader"></span>';
      }
      btnParent.replaceChild(loaderBtn, submitBtn);
      
      setTimeout(function() {
        btnParent.replaceChild(submitBtn, document.getElementById('main-loader-btn'));
        submitBtn.style.display = '';
        submitBtn.classList.remove('submit-checkmark');
        submitBtn.disabled = false;
        form.submit();
      }, 700);
    });
  }
}

/**
 * Performs the iTunes search and displays results
 * @param {string} searchTerm - Processed search term
 * @param {string} entity - Entity type
 * @param {string} countryCode - Country code
 * @param {boolean} usePng - Whether to use PNG format
 */
async function performSearch(searchTerm, entity, countryCode, usePng) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `<div id="progress">Loading results...</div>`;

  let error;
  let results;
  window.attribute = window.attribute || '';
  
  try {
    results = await fetchResults(searchTerm, entity, countryCode);
  } catch(e) {
    error = e.message;
  }

  if (results == null) {
    resultsDiv.innerHTML = `<div id="error"><p>Sorry, some error occurred while loading the results...</p>${error !== null ? `<p>(${error})</p>` : ""}</div>`;
  } else {
    const resultItems = results["results"];
    if (resultItems === null || !Array.isArray(resultItems) || resultItems.length === 0) {
      resultsDiv.innerHTML = `<div id="error">Sorry, no results...</div>`;
    } else {
      displayResults(resultItems, entity, usePng);
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
    
    return `<div class="result${entity === 'audiobook' ? ' audiobook' : (entity === 'ebook' ? ' ebook' : (entity === 'movie' ? ' movie' : (entity === 'software' ? ' app' : '')))}">
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
      
      // Check if this is a movie or app card
      const isMovie = card.classList.contains('movie');
      const isApp = card.classList.contains('app');
      
      // Get the original artworkUrl100 from the card's image src
      let artworkUrl100 = img.src.replace(/(\d+)x\1(-999)?.*$/, '100x100');
      
      // Generate large image URL - use special format for movies and apps
      let largeSrc = '';
      if (isMovie) {
        // For movies, use the special 10000x10000-999.jpg format
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
        }
      };
      
      // Add Save As dialog logic to modal artwork size buttons
      modal.querySelectorAll('.modal-links a').forEach(function(link) {
        link.addEventListener('click', function(e) {
          if (window.matchMedia('(max-width: 600px)').matches) {
            // On small screens, open in new tab
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
 * Add Save As dialog functionality to download links
 */
function addSaveAsDialogLogic() {
  document.querySelectorAll('.result .links a[download]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (window.matchMedia('(max-width: 600px)').matches) {
        // On small screens, open in new tab
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