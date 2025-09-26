# Usenet Search & Download Application

A complete usenet search and download solution built with Next.js and SABnzbd, featuring Eweka provider integration.

## Features

- 🔍 Search multiple usenet indexers
- 📥 Download NZB files directly to SABnzbd
- 🐳 Docker-based SABnzbd integration
- 🎯 Eweka provider support
- 📱 Web-based interface for searching and managing downloads
- 🎬 Built-in media viewer for videos, audio, images, and PDFs
- 📁 Download management with file browsing

## 1. How to Install

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ 
- Eweka usenet provider account
- NZBFinder API key

### Step 1: Get Your Credentials

Before starting, you'll need:

1. **Eweka Usenet Provider Account**
   - Sign up at [Eweka](https://www.eweka.nl/)
   - Note your username, password, and server details

2. **NZBFinder API Key**
   - Sign up at [NZBFinder](https://nzbfinder.ws/)
   - Go to your account settings and generate an API key

### Step 2: Configure Environment

Edit the `.env` file with your credentials:

```env
# Usenet Providers (Replace with your Eweka credentials)
USENET_PROVIDER_HOST="news.eweka.nl"
USENET_PROVIDER_PORT=563
USENET_PROVIDER_USERNAME="your_eweka_username"
USENET_PROVIDER_PASSWORD="your_eweka_password"
USENET_PROVIDER_SSL=true
USENET_PROVIDER_CONNECTIONS=50

# Indexer API Keys (Replace with your NZBFinder API key)
NZBFINDER_API_KEY="your_nzbfinder_api_key"

# SABnzbd Configuration
SABNZBD_URL="http://localhost:8080"
SABNZBD_API_KEY="" # Will be set after SABnzbd setup
```

### Step 3: Start the Application

```bash
# Install dependencies and start everything
npm install
npm run start:full
```

This will:
- Start SABnzbd in Docker
- Install all dependencies
- Start the Next.js web application

### Step 4: Initialize SABnzbd with Eweka

1. **Open SABnzbd Setup**
   - Visit http://localhost:8080
   - Complete the initial setup wizard

2. **Configure Eweka Server**
   - Go to **Config** → **Servers**
   - Click **Add Server**
   - Fill in your Eweka details:
     - **Server**: `news.eweka.nl`
     - **Port**: `563`
     - **Username**: Your Eweka username
     - **Password**: Your Eweka password
     - **SSL**: Enable SSL/TLS
     - **Connections**: `50` (or your account limit)
   - Click **Test Server** to verify connection
   - Click **Save**

3. **Get SABnzbd API Key**
   - Go to **Config** → **General**
   - Copy the **API Key**
   - Update your `.env` file:
     ```env
     SABNZBD_API_KEY="your_api_key_here"
     ```
   - Restart the application: `npm run start:full`

## 2. How to Use

### Searching for Content

1. **Open the Web Interface**
   - Visit http://localhost:3000
   - You'll see the search interface

2. **Search for Content**
   - Enter your search terms (movies, TV shows, music, etc.)
   - Select a category (optional)
   - Click **Search**

3. **View Results**
   - Browse through search results
   - Each result shows file size, category, and posting date

### Downloading Content

1. **Start Download**
   - Click **Download** on any search result
   - The NZB file will be sent directly to SABnzbd
   - You'll see a success message

2. **Monitor Downloads**
   - Go to the **Downloads** page (click "Downloads" in the header)
   - View all your completed downloads
   - Click **View Files** to see downloaded content

### Viewing Downloaded Content

1. **Browse Downloads**
   - On the Downloads page, click **View Files** on any download
   - A modal will open showing all supported files

2. **Open Files**
   - **Videos**: Click to open in full-screen video player
   - **Audio**: Click to open in audio player
   - **Images**: Click to view in image viewer
   - **PDFs/Books**: Click to read in browser
   - **Software**: Click to download/open

### Managing Downloads

- **Completed Downloads**: All finished downloads appear in the Downloads page
- **File Types**: Only supported file types are shown (videos, audio, images, books, software)
- **Failed Downloads**: Downloads that failed are automatically excluded from the list

## Troubleshooting

### Common Issues

**SABnzbd Not Starting**
- Check Docker is running: `docker info`
- Check logs: `npm run docker:logs`
- Ensure port 8080 is available

**Downloads Not Working**
- Verify SABnzbd API key in `.env`
- Check SABnzbd server configuration
- Ensure Eweka credentials are correct

**Search Issues**
- Verify NZBFinder API key
- Check indexer configuration

**Files Not Opening**
- Ensure file types are supported (video, audio, image, book, software)
- Check browser console for errors

### Useful Commands

```bash
# Start everything (SABnzbd + Next.js)
npm run start:full

# Start only SABnzbd
npm run docker:up

# Stop SABnzbd
npm run docker:down

# View SABnzbd logs
npm run docker:logs

# Development only
npm run dev
```

## File Types Supported

- **Videos**: MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V
- **Audio**: MP3, WAV, FLAC, AAC, OGG, WMA, M4A
- **Images**: JPG, PNG, GIF, BMP, WebP, SVG
- **Books**: PDF, EPUB, MOBI, AZW, TXT, RTF
- **Software**: EXE, MSI, DMG, PKG, ZIP, TAR, 7Z, ISO

## Security Notes

- Keep your `.env` file secure and never commit it
- Use strong passwords for usenet providers
- Consider using reverse proxy for production
- Regularly update dependencies

## Support

For issues or questions:
1. Check the logs: `npm run docker:logs`
2. Verify configuration in `.env`
3. Ensure all services are running properly