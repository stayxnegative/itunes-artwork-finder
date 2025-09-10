// Custom JavaScript moved from index.html
'use strict'

function buildUrl(term, entity, country) {
  const urlSearchParams = new URLSearchParams()
  urlSearchParams.set('country', country)
  urlSearchParams.set('limit', 50)
  urlSearchParams.set('entity', entity);
  if (typeof window !== 'undefined' && window.attribute && window.attribute.length > 0) {
    urlSearchParams.set('attribute', window.attribute);
  }
  let baseUrl = 'https://itunes.apple.com/search';
  urlSearchParams.set('term', term);
  return `${baseUrl}?${urlSearchParams}`;
}

async function fetchResults(term, entity, country) {
  const url = buildUrl(term, entity, country)
  const response = await fetch(url)
  if (!response.ok) {
    console.log(response)
    return null
  }
  return response.json()
}

// ...existing code for onload, result rendering, etc. should be moved here...
