export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract query parameters
    const { term, entity, country, media, attribute, limit } = req.query;
    
    // Build iTunes API URL
    const params = new URLSearchParams();
    if (term) params.set('term', term);
    if (entity) params.set('entity', entity);
    if (country) params.set('country', country);
    if (media) params.set('media', media);
    if (attribute) params.set('attribute', attribute);
    params.set('limit', limit || '60');
    
    const itunesUrl = `https://itunes.apple.com/search?${params}`;
    console.log('Fetching from iTunes API:', itunesUrl);
    
    // Fetch from iTunes API
    const response = await fetch(itunesUrl);
    
    if (!response.ok) {
      throw new Error(`iTunes API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return JSON response
    res.status(200).json(data);
    
  } catch (error) {
    console.error('iTunes API proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from iTunes API',
      message: error.message 
    });
  }
}