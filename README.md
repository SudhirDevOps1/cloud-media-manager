# Cloud Media Manager & Viewer (PrivMITLab Expert Edition)

An offline-first, client-side, glassmorphic cloud media catalog, viewer, and player built specifically for static hosting on GitHub Pages. It allows you to organize, search, and play files from 30+ cloud providers (and direct links) through a clean, unified tree interface.

## 🚀 Key Features

*   **Offline-First & PWA**: Service worker caches all code and data locally. Operates fully offline once loaded.
*   **0% Tracking & Cookies**: Absolute user privacy. No analytics, tracking codes, or external dependencies (except the YouTube IFrame API).
*   **Glassmorphism UI**: Beautiful, fully responsive side-by-side layout with dark and light modes.
*   **Tree Navigation**: Collapsible directories with automatic media type count tags and custom SVG icons.
*   **Universal Media Player**:
    *   *Video*: Custom-skinned HTML5 player with speed, volume, seeking, and fullscreen.
    *   *Audio*: Built-in player featuring a Web Audio API waveform visualizer.
    *   *PDF*: Embedded viewer with fallback mechanisms.
    *   *Images*: Lightbox previewer.
    *   *YouTube*: Seamless integration using the native YouTube IFrame Player API.
    *   *Cloud Embeds*: Automatic iframe encapsulation for proprietary cloud viewers.
*   **Live Search & Filtering**: Real-time name, description, or language querying with checkboxes for specific asset types.
*   **Catalog Stats**: Immediate analytical breakdown of total assets by category, type, and language.
*   **JSON Editor**: Modify the catalog structure right in the browser, apply changes instantly (saved to `localStorage`), and copy the structure to commit back to your repository.

---

## 📂 File Structure

```text
/
├── index.html        # Main app structure, view panels, sidebar, and modals
├── styles.css        # Vanilla glassmorphic styling, animations, and dark/light modes
├── script.js         # Cloud parser, custom players, PWA control, and UI interactions
├── data.json         # The catalog data (folders, subfolders, files, URLs)
├── manifest.json     # PWA app parameters and high-res embedded base64 icons
├── sw.js             # Service Worker - Cache-first strategy for offline support
├── privacy.html      # Zero-tracking compliance notice
├── robots.txt        # Crawler configuration (Allows all)
├── sitemap.xml       # SEO index for index.html and privacy.html
└── README.md         # Deployment and usage instructions
```

---

## 🛠️ Deployment on GitHub Pages

Hosting this app is extremely simple because it contains zero build steps and no server backend.

1.  **Create a New Repository**: Go to GitHub and create a new public or private repository (e.g., `my-cloud-media`).
2.  **Upload the Files**: Push or upload all files listed in the File Structure directly to the `main` or `master` branch.
3.  **Enable GitHub Pages**:
    *   Go to your repository **Settings** tab.
    *   In the left sidebar, click **Pages**.
    *   Under **Build and deployment**, select **Deploy from a branch**.
    *   Choose your branch (e.g., `main`) and the folder `/ (root)`. Click **Save**.
4.  **Access Your App**: Within a few minutes, GitHub will provide a link, typically: `https://<your-username>.github.io/<repository-name>/`.

---

## ✍️ Customizing Your Catalog (`data.json`)

To customize what media is displayed, you only need to edit `data.json`. You can do this directly in the GitHub web editor or locally before pushing.

### Format Structure

The JSON expects an object with a `"folders"` array. Each folder can have `"items"` (files) and/or `"children"` (sub-folders).

```json
{
  "folders": [
    {
      "name": "Course Title",
      "children": [
        {
          "name": "Unit 1: Foundations",
          "items": [
            {
              "name": "Introduction Document",
              "type": "pdf",
              "url": "https://example.com/syllabus.pdf",
              "description": "The overview of this semester.",
              "lang": "en"
            },
            {
              "name": "Welcome Video",
              "type": "youtube",
              "url": "https://youtu.be/dQw4w9WgXcQ",
              "description": "Short video greeting.",
              "lang": "en"
            }
          ]
        }
      ]
    }
  ]
}
```

### Supported Item Types

Set the `"type"` field to one of these:
*   `"pdf"`: PDF documents.
*   `"video"`: Direct link to video files (`.mp4`, `.mkv`, `.webm`).
*   `"audio"`: Direct link to audio files (`.mp3`, `.wav`, `.ogg`).
*   `"image"`: Direct link to image files (`.jpg`, `.png`, `.webp`, `.gif`).
*   `"youtube"`: YouTube video links or embed links.

### Cloud Providers Support

The app has an intelligent `detectCloudProvider(url)` parser that supports **30+ cloud providers**. It automatically converts standard sharing links into embeddable stream links!

1.  **Google Drive**: Use the standard view link: `https://drive.google.com/file/d/FILE_ID/view`. The app converts it for iframe previews or direct embedding.
2.  **Dropbox**: Use share links ending in `?dl=0` or `?dl=1`. The app handles conversion to raw assets (`?raw=1`) for images/audio or embeds.
3.  **OneDrive**: Use the standard shared file link (e.g., `https://1drv.ms/b/s!AhuL2...`).
4.  **Mega.nz**: Provide the embed link `https://mega.nz/embed/FILE_ID#KEY` or standard share link.
5.  **Nextcloud / ownCloud**: Use standard shared URLs or download URLs.
6.  **Direct Cloud Links**: Compatible with any S3-compatible bucket, Backblaze B2, Wasabi, Cloudinary, or private servers (WebDAV, Seafile). Just provide the direct URL to the media file!

---

## 🔧 Live JSON Editing & Saving

1.  Click the **JSON Editor** button in the bottom left sidebar.
2.  The text area will automatically load your current active catalog.
3.  Modify the JSON structure (e.g., add a new item or folder).
4.  Click **Apply Changes**. The tree view and stats will re-render immediately.
5.  *Note:* To make your changes permanent so they appear when you reload, you must copy the modified JSON text and commit it into your `data.json` file in your GitHub repository. The browser saves it to `localStorage` as a temporary backup, but GitHub is your permanent database.

---

## ⌨️ Keyboard Shortcuts (Viewer Modal)

When a media preview or custom player is open, you can use the following shortcuts:
*   `Space`: Play / Pause (Video and Audio)
*   `Left Arrow`: Seek backward 5 seconds (Video and Audio)
*   `Right Arrow`: Seek forward 5 seconds (Video and Audio)
*   `Up Arrow`: Increase volume 10%
*   `Down Arrow`: Decrease volume 10%
*   `F`: Toggle Fullscreen (Video)
*   `M`: Toggle Mute (Video and Audio)
*   `Escape`: Close viewer modal

---

## ⚖️ License & Credits

Developed by **PrivMITLab Experts**. Built for total transparency, offline robustness, and privacy excellence. This project is free to fork, modify, and host for personal or educational use.
