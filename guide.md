# Cloud Media Manager - Technical Guide

Welcome to the Cloud Media Manager Technical Guide. This guide explains how the live data fetching mechanism works under the hood and provides instructions on how to scale your app infinitely by adding more content to `data.json`.

---

## 1. How Live Data Fetching Works

The application uses a robust combination of **Service Worker Strategies** and **Cache-Busting** to ensure you always see the live, updated `data.json`, even in a Progressive Web App (PWA) environment.

### A. The Service Worker Bypass
In standard PWAs, all assets are cached during the `install` phase (Cache-First strategy) to make the app work offline. However, caching `data.json` means new content added by the admin won't show up. 

To fix this, we modified `sw.js` to intercept requests to `data.json` and force a **Network-First Strategy**:
- It first tries to download the live `data.json` from your server.
- If it successfully downloads, it updates the offline cache with the fresh file.
- If your internet is down, it falls back to the old cached version.

### B. The Timestamp Cache-Buster
Browsers and servers (like Vercel, GitHub Pages, or NGINX) have aggressive HTTP caching. To completely bypass server-side caching, the JavaScript `fetch` in `script.js` was modified:
```javascript
const response = await fetch('./data.json?t=' + new Date().getTime());
```
The `?t=16900...` adds a unique timestamp to every request. This tricks the browser into treating it as a brand-new file every single time the page loads, guaranteeing a 100% live fetch.

> [!WARNING]
> **Local Editor Override**
> If you edit the JSON using the app's built-in **Code Editor UI**, the app saves your changes to your browser's memory (`localStorage`). When this happens, the app stops fetching from the live `data.json`. 
> 
> **To fix this and restore live fetching:** Click the **"Reload JSON"** (or refresh icon) button in the sidebar of your app. This clears the local memory and reconnects you to the live file.

---

## 2. The Universal JSON Structure

Your `data.json` is now structured using a modern **"Technology → Language → Category"** hierarchy. The `script.js` engine uses a recursive `traverse()` function, which means the app automatically handles **infinite levels of nested folders**.

### Adding Content: The Correct Format
Whenever you want to add a new course (like CSS or Node.js) or a new language (like Spanish), simply copy and paste the block below into your `data.json` array:

```json
{
  "name": "Node.js",
  "children": [
    {
      "name": "Hindi",
      "children": [
        {
          "name": "PDFs",
          "items": [
            {
              "name": "Node.js Hindi Handbook",
              "type": "pdf",
              "url": "https://example.com/node.pdf",
              "description": "Complete beginner guide to Backend.",
              "lang": "hi"
            }
          ]
        },
        {
          "name": "Images",
          "items": []
        },
        {
          "name": "Resources",
          "items": [
            {
              "name": "NPM Official Docs",
              "type": "link",
              "url": "https://npmjs.com",
              "description": "Package manager docs."
            }
          ]
        },
        {
          "name": "Videos",
          "items": []
        }
      ]
    },
    {
      "name": "English",
      "children": [
        { "name": "PDFs", "items": [] },
        { "name": "Images", "items": [] },
        { "name": "Resources", "items": [] },
        { "name": "Videos", "items": [] }
      ]
    }
  ]
}
```

### Supported Item Types:
When adding an item inside the `"items"` array, the `"type"` field tells the app which internal media player to use:
- `"pdf"`: Opens in the built-in PDF reader.
- `"youtube"`: Embeds the YouTube iframe API.
- `"video"`: Uses the custom HTML5 video player (for `.mp4`, Google Drive links).
- `"audio"`: Opens the custom audio player with the waveform visualizer.
- `"image"`: Opens the full-screen image previewer.
- `"link"` / `"embed"`: Opens external websites or iframes.

---

## 3. How to Scale the App

1. **Jitna man utna add karein:** You do not need to modify any HTML or JavaScript when adding new sections. As soon as you add a new nested `"children"` array in `data.json`, the app will automatically draw the folder icon, calculate the file counts, and build the breadcrumb navigation.
2. **Push to Server:** After editing `data.json`, simply push the file to your Git repository or upload it to your host. 
3. **Instant Sync:** Because of the Cache-Busting features discussed in Section 1, your users will see the new "Node.js" or "CSS" folders the next time they refresh their browser.
