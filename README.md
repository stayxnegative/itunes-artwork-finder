# 🎵 iTunes Artwork Finder

A modern, responsive web application for discovering and downloading high-resolution artwork from Apple's iTunes/Apple Music catalog. Search for albums, movies, apps, audiobooks, and more.

---

## 🚀 Live Demo

> **Access the app here:**
> [https://art.tyrrtechinc.com](https://art.tyrrtechinc.com)

---

**Features**

- 🎯 **Advanced Search** — Search by artist, title, content, or Apple ID using prefix commands
- 🌍 **Multi-Country Support** — Search across different iTunes Store regions
- 📦 **Multiple Media Types** — Albums, movies, apps, audiobooks, eBooks, and more
- 🖼️ **Multiple Formats** — Download artwork in JPG or PNG
- 📱 **Responsive Design** — Optimized for desktop, tablet, and mobile
- 🖼️ **High-Resolution Artwork** — Up to 3000x3000px
- ⚡ **Fast & Modern** — Vanilla JavaScript, glass morphism UI

---

## 🎯 Search Features

### How Search Works

- **Default Search**: Enter any search term to find albums (US store by default)
- **ID Search**: Enter an Apple ID (e.g., `284882215`) for direct lookup (albums only, US store). For other media, use a prefix (e.g., `app:284882215`).
- **URL Parsing**: Paste full iTunes/App Store URLs for automatic extraction and search.
- **Prefix Combinations**: Combine country, media type, and attribute prefixes for precise results. All prefixes are case-insensitive.
- **Format Modifier**: Add `.png` to any search for PNG artwork.

### Prefix Reference

#### Attribute Prefixes
- `artist:` – Search by artist or band name (maps to albums by default)
- `title:` – Search by album, movie, or book title (maps to albums unless media type specified)
- `author:` – Search by audiobook or eBook author (maps to audiobooks or eBooks)
- `director:` – Search by movie director (maps to movies)
- `actor:` – Search by movie or TV show cast/actor (maps to movies or TV shows)
- `composer:` – Search by composer (maps to albums or soundtracks)

#### Media Type Prefixes
- `album:` – Music albums and compilations (entity: album, media: music)
- `song:` – Individual music tracks and singles (entity: song, media: music)
- `movie:` – Films and cinema content (entity: movie, media: movie)
- `tv:` – TV shows and series (entity: tvSeason, media: tvShow)
- `app:` – iOS, iPadOS, and macOS applications (entity: software, media: app)
- `audiobook:` – Audiobooks (entity: audiobook, media: audiobook)
- `ebook:` – Digital books and publications (entity: ebook, media: ebook)

#### Country Prefixes
- `ar:` Argentina
- `at:` Austria
- `au:` Australia
- `be:` Belgium
- `bg:` Bulgaria
- `br:` Brazil
- `ca:` Canada
- `ch:` Switzerland
- `cl:` Chile
- `cn:` China
- `co:` Colombia
- `cy:` Cyprus
- `cz:` Czech Republic
- `de:` Germany
- `dk:` Denmark
- `ee:` Estonia
- `eg:` Egypt
- `es:` Spain
- `fi:` Finland
- `fr:` France
- `gr:` Greece
- `hr:` Croatia
- `hk:` Hong Kong
- `hu:` Hungary
- `id:` Indonesia
- `ie:` Ireland
- `in:` India
- `is:` Iceland
- `it:` Italy
- `jp:` Japan
- `kr:` South Korea
- `lt:` Lithuania
- `lu:` Luxembourg
- `lv:` Latvia
- `mt:` Malta
- `mx:` Mexico
- `my:` Malaysia
- `nl:` Netherlands
- `no:` Norway
- `nz:` New Zealand
- `pe:` Peru
- `ph:` Philippines
- `pl:` Poland
- `pt:` Portugal
- `ro:` Romania
- `ru:` Russia
- `se:` Sweden
- `sg:` Singapore
- `si:` Slovenia
- `sk:` Slovakia
- `th:` Thailand
- `tr:` Turkey
- `tw:` Taiwan
- `uk:` United Kingdom
- `us:` United States
- `vn:` Vietnam
- `za:` South Africa

#### Format Modifier
- `.png` – Return PNG format instead of JPG

### Example Searches

```text
# Basic
Taylor Swift                    # Default: albums by Taylor Swift (US store)
artist: The Beatles              # Albums by The Beatles
movie: The Dark Knight           # Movies matching "The Dark Knight"
uk: artist: Adele                 # Albums by Adele from UK store
app: Instagram .png               # Instagram app artwork in PNG
jp: author: Haruki Murakami .png   # Japanese audiobooks by author, PNG format

# Attribute + Media Type
song: Bohemian Rhapsody          # Song search for "Bohemian Rhapsody"
album: Abbey Road                # Album search for "Abbey Road"
tv: Breaking Bad                 # TV show search for "Breaking Bad"
ebook: Harry Potter              # eBook search for "Harry Potter"

# Country + Media Type + Attribute
fr: movie: Amélie                 # French movies titled "Amélie"
de: artist: Rammstein             # German albums by Rammstein
ca: app: Spotify                  # Canadian App Store for Spotify app
it: author: Elena Ferrante        # Italian audiobooks by Elena Ferrante

# ID and Format
app: 284882215                   # Instagram app by ID
movie: 123456789                 # Specific movie by Apple ID
uk: artist: Coldplay .png          # UK store, artist search, PNG format

# Advanced Multi-Prefix
jp: tv: director: Shinji Higuchi   # Japanese TV shows directed by Shinji Higuchi
kr: movie: actor: Song Kang-ho     # Korean movies starring Song Kang-ho
fr: ebook: author: Victor Hugo     # French eBooks by Victor Hugo
us: tv: actor: Bryan Cranston      # US TV shows starring Bryan Cranston
de: album: composer: Hans Zimmer   # German albums composed by Hans Zimmer

# Extremely Complex Examples
uk: movie: director: Christopher Nolan.png   # UK movies directed by Christopher Nolan, PNG format
au: tv: actor: Hugo Weaving        # Australian TV shows starring Hugo Weaving
jp: app: author: Shigesato Itoi     # Japanese apps by author Shigesato Itoi
fr: ebook: title: Le Petit Prince .png # French eBook titled "Le Petit Prince", PNG format
ca: tv: actor: Eugene Levy         # Canadian TV shows starring Eugene Levy
it: album: composer: Ennio Morricone # Italian albums composed by Ennio Morricone
nl: movie: actor: Rutger Hauer     # Dutch movies starring Rutger Hauer
us: app: 284882215 .png            # US App Store, Instagram app by ID, PNG format
kr: tv: director: Bong Joon-ho     # Korean TV shows directed by Bong Joon-ho
es: ebook: author: Carlos Ruiz Zafón # Spanish eBooks by Carlos Ruiz Zafón
```

### Media Types Supported
- 🎵 **Albums**
- 🎶 **Songs**
- 🎬 **Movies**
- 📱 **Apps**
- 📚 **Audiobooks**
- 📖 **eBooks**
- 📺 **TV Shows**

### Artwork Resolution Guide
- **Albums/Music**: Up to 3000x3000px (most releases; some singles may be lower)
- **Songs**: Up to 3000x3000px (matches album art)
- **Movies**: Typically 2000x3000px (portrait posters); some may be 1200x1800px or lower
- **TV Shows**: Usually 1200x1200px to 2000x2000px (season art)
- **Apps**: 1024x1024px (official icon size)
- **Audiobooks**: Up to 3000x3000px (square format)
- **eBooks**: Variable, typically 400–1200px width (depends on publisher)

## 💡 Tips & Tricks

> - **Use specific prefixes** for precise results
> - **Try different country codes** for region-specific content
> - **Use original titles** for international content
> - **Combine prefixes** for advanced searches

---

## 🔍 Troubleshooting

### No Results Found
- **Check spelling**
- **Try different countries**
- **Use broader terms**
- **Remove special characters**

### Wrong Results Showing
- **Use specific prefixes**
- **Try exact titles**
- **Specify media type**

### App/Movie ID Not Working
- **Always use media type prefix** for non-albums
- **Verify ID number** from iTunes/App Store URL
- **Try different country**

### Image Quality Issues
- **Add `.png`** for PNG format
- **Some content has limited resolution**

---

## 🛠️ Technical Details

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend:** Vercel Serverless Functions (Node.js)
- **API:** iTunes Search API with CORS proxy
- **Styling:** Glass morphism, CSS Grid/Flexbox
- **Deployment:** Vercel

### Project Structure
```text
📁 js/app.js     # Main application logic
📁 css/          # Stylesheets
index.html       # Entry point
```

---

## 🔧 Development

### Prerequisites
- **Node.js 16+**
- **Modern browser**
- **Code editor (VS Code recommended)**

### Local Setup
```sh
git clone https://github.com/stayxnegative/itunes-artwork-finder.git
cd itunes-artwork-finder
npm install -g vercel  # optional
python -m http.server 8050  # or npx serve .
vercel dev  # for API proxy
```

---

## 🌐 Deployment

- **Vercel (recommended)**
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**
- **Any static hosting provider**

*API proxy (`/api/itunes`) requires serverless function support*

---

## ❓ FAQ

- **TV shows?** Use `tv:` prefix
- **Missing content?** Try different country prefix
- **Bulk download?** Not supported
- **Max resolution?** Up to 3000x3000px
- **Commercial use?** Personal/educational only
- **Language?** Depends on country prefix
- **Podcasts?** Not supported
- **Find Apple ID?** Check iTunes/App Store URL

---

## 🎨 Customization

- **Modify CSS** in `css/base.css`
- **Add media types** in `js/app.js`
- **Customize prefixes and country codes**

---

## 📱 Browser Support

- **Chrome 88+**
- **Firefox 85+**
- **Safari 14+**
- **Edge 88+**
- **iOS Safari 14+**
- **Chrome Mobile 88+**
- Uses CSS Grid, Flexbox, Backdrop Filters, ES6+

---

## 🙏 Acknowledgments

- Forked from [tzahola/itunes-artwork-finder](https://github.com/tzahola/itunes-artwork-finder)
- Inspired by [Ben Dodson's iTunes Artwork Finder](https://github.com/bendodson/itunes-artwork-finder)
- Uses Apple's iTunes Search API
- Glass morphism design

---

## ⚠️ Disclaimer

>This application uses Apple's public iTunes Search API for educational and personal use. All artwork and metadata belong to their respective copyright holders. Please respect intellectual property rights when using downloaded content.

---

<div align="center">
<strong>Made with 💀 by stayxnegative</strong>
</div>

---

## 🚀 Live Demo

> **Access the app here:**
> [https://art.tyrrtechinc.com](https://art.tyrrtechinc.com)

---
