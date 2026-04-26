/* ==========================================================================
   CLOUD MEDIA MANAGER - CORE SCRIPT (PrivMITLab Expert Edition)
   ========================================================================== */

// --- Global State ---
let catalogData = { folders: [] };
let currentFolderId = null; // null means 'root' (all items)
let activeFilters = ['pdf', 'video', 'audio', 'image', 'youtube'];
let searchQuery = '';
let currentOpenItem = null; // Track item currently in player

// Player State
let ytPlayer = null;
let activeAudioElement = null;
let activeVideoElement = null;
let audioContext = null;
let audioAnalyser = null;
let audioAnimationId = null;
let isVideoSeeking = false;
let currentPlayerMode = 'embed'; // 'embed' or 'direct'

const CLOUD_PROVIDERS_REFERENCE = [
  { name: 'Google Drive', storage: '15 GB', maxFile: '5 TB', direct: true, embed: true, notes: 'Limited embed (iframe viewer)' },
  { name: 'Mega', storage: '15-20 GB', maxFile: 'No strict limit', direct: true, embed: true, notes: 'Proprietary encryption' },
  { name: 'Dropbox', storage: '2 GB', maxFile: '50 GB', direct: true, embed: true, notes: 'Add ?raw=1 for direct links' },
  { name: 'OneDrive', storage: '5 GB', maxFile: '250 GB', direct: true, embed: true, notes: 'Microsoft account required' },
  { name: 'pCloud', storage: '10 GB', maxFile: '100 MB+', direct: true, embed: true, notes: 'App install bonus' },
  { name: 'Cloudinary', storage: '25 credits/mo', maxFile: '100 MB (video)', direct: true, embed: true, notes: 'Media delivery optimized' },
  { name: 'Backblaze B2', storage: '10 GB', maxFile: '10 TB', direct: true, embed: true, notes: 'Free egress via Cloudflare' },
  { name: 'Wasabi', storage: '1 TB (trial)', maxFile: '—', direct: true, embed: true, notes: 'S3-compatible API' },
  { name: 'Box', storage: '10 GB', maxFile: '250 MB', direct: false, embed: true, notes: 'Embed code available' },
  { name: 'MediaFire', storage: '10 GB', maxFile: '200 MB - 4 GB', direct: false, embed: false, notes: 'Pro required for direct' },
  { name: '4shared', storage: '15 GB', maxFile: '2 GB', direct: false, embed: false, notes: 'Premium required' },
  { name: 'WeTransfer', storage: '—', maxFile: '2 GB', direct: false, embed: false, notes: 'Links expire in 3-7 days' },
  { name: 'Send Anywhere', storage: 'Unlimited', maxFile: 'No limit', direct: true, embed: true, notes: 'No account needed' },
  { name: 'Vimeo', storage: '25 videos', maxFile: '500 MB/week', direct: true, embed: true, notes: 'Watermark on free embeds' },
  { name: 'Dailymotion', storage: 'Unlimited', maxFile: '2 GB', direct: true, embed: true, notes: 'Free video hosting' },
  { name: 'SoundCloud', storage: '3 hours', maxFile: '—', direct: true, embed: true, notes: 'Public tracks only' },
  { name: 'Spotify', storage: '170M+ tracks', maxFile: '—', direct: false, embed: true, notes: 'Track embed codes' },
  { name: 'Imgur', storage: 'Unlimited', maxFile: '20 MB', direct: true, embed: true, notes: 'Direct image links' },
  { name: 'Pastebin', storage: 'Unlimited', maxFile: '100/day', direct: true, embed: true, notes: 'Raw URL available' },
  { name: 'GitHub', storage: '1 GB', maxFile: '—', direct: true, embed: true, notes: 'Raw domain for files' },
  { name: 'YouTube', storage: 'Unlimited', maxFile: '256 GB', direct: false, embed: true, notes: 'Standard embed' },
  { name: 'Nextcloud', storage: 'Self-hosted', maxFile: 'Unlimited', direct: true, embed: true, notes: 'Self-hosted solution' },
  { name: 'ownCloud', storage: 'Self-hosted', maxFile: 'Unlimited', direct: true, embed: true, notes: 'Self-hosted solution' },
  { name: 'Yandex Disk', storage: '5 GB', maxFile: '50 GB', direct: true, embed: true, notes: 'Yandex account' },
  { name: 'Koofr', storage: '10 GB', maxFile: '1 GB', direct: true, embed: true, notes: 'Multi-cloud manager' },
  { name: 'Seafile', storage: 'Self-hosted', maxFile: 'Unlimited', direct: true, embed: true, notes: 'Self-hosted solution' },
  { name: 'iCloud', storage: '5 GB', maxFile: '50 GB', direct: false, embed: true, notes: 'Apple ecosystem' },
  { name: 'Sync.com', storage: '5 GB', maxFile: 'Unlimited', direct: true, embed: true, notes: 'Privacy-focused' },
  { name: 'Internxt', storage: '2 GB', maxFile: '1 GB', direct: true, embed: true, notes: 'Decentralized storage' },
  { name: 'HiDrive', storage: '5 GB', maxFile: '2 GB', direct: true, embed: true, notes: 'IONOS service' },
  { name: 'WebDAV', storage: 'Self-hosted', maxFile: 'Unlimited', direct: true, embed: false, notes: 'Protocol-based' },
  { name: 'S3 Bucket', storage: '5 GB', maxFile: '5 TB', direct: true, embed: true, notes: 'AWS or compatible' }
];

// --- DOM References ---
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const menuTrigger = document.getElementById('menuTrigger');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const networkIndicator = document.getElementById('networkIndicator');
const networkText = document.getElementById('networkText');

const searchInput = document.getElementById('searchInput');
const typeFiltersContainer = document.getElementById('typeFilters');
const treeContainer = document.getElementById('treeContainer');
const breadcrumbs = document.getElementById('breadcrumbs');
const statsDashboard = document.getElementById('statsDashboard');
const mediaGrid = document.getElementById('mediaGrid');
const emptyState = document.getElementById('emptyState');
const emptyStateMessage = document.getElementById('emptyStateMessage');

const openEditorBtn = document.getElementById('openEditorBtn');
const reloadJsonBtn = document.getElementById('reloadJsonBtn');
const toastContainer = document.getElementById('toastContainer');

// Editor DOM
const editorModal = document.getElementById('editorModal');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const jsonTextarea = document.getElementById('jsonTextarea');
const editorFormatBtn = document.getElementById('editorFormatBtn');
const editorCopyBtn = document.getElementById('editorCopyBtn');
const editorApplyBtn = document.getElementById('editorApplyBtn');

// Player DOM
const playerModal = document.getElementById('playerModal');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const playerContainer = document.getElementById('playerContainer');
const customVideoControls = document.getElementById('customVideoControls');
const playerMetaTitle = document.getElementById('playerMetaTitle');
const playerMetaDesc = document.getElementById('playerMetaDesc');

// Custom Video Controls DOM
const videoProgressBar = document.getElementById('videoProgressBar');
const videoProgressContainer = document.getElementById('videoProgressContainer');
const videoPlayPauseBtn = document.getElementById('videoPlayPauseBtn');
const videoPlayIcon = document.getElementById('videoPlayIcon');
const videoPauseIcon = document.getElementById('videoPauseIcon');
const videoRewindBtn = document.getElementById('videoRewindBtn');
const videoForwardBtn = document.getElementById('videoForwardBtn');
const videoTimeDisplay = document.getElementById('videoTimeDisplay');
const videoMuteBtn = document.getElementById('videoMuteBtn');
const videoVolumeIcon = document.getElementById('videoVolumeIcon');
const videoMuteIcon = document.getElementById('videoMuteIcon');
const videoVolumeSlider = document.getElementById('videoVolumeSlider');
const videoSpeedSelect = document.getElementById('videoSpeedSelect');
const videoFullscreenBtn = document.getElementById('videoFullscreenBtn');


// ==========================================================================
// 1. PWA SERVICE WORKER & NETWORK TRACKING
// ==========================================================================
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch(err => console.error('[PWA] Service Worker registration failed:', err));
    });
  }

  function updateNetworkStatus() {
    if (navigator.onLine) {
      networkIndicator.className = 'pwa-indicator';
      networkText.textContent = 'Online Mode';
      showToast('You are online. Ready to stream cloud media!', 'success');
    } else {
      networkIndicator.className = 'pwa-indicator offline';
      networkText.textContent = 'Offline Mode';
      showToast('You are offline. Accessing cached catalog and local assets.', 'info');
    }
    // Re-render grid so broken external links handle offline gracefully
    renderMediaGrid();
  }

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Set initial status without a toast
  if (!navigator.onLine) {
    networkIndicator.className = 'pwa-indicator offline';
    networkText.textContent = 'Offline Mode';
  }
}


// ==========================================================================
// 2. THEME MANAGEMENT
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('cmm-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = savedTheme === 'light' || (savedTheme === null && prefersLight);
  
  if (isLight) {
    document.body.classList.add('light-theme');
    sunIcon.style.display = 'inline-block';
    moonIcon.style.display = 'none';
  } else {
    document.body.classList.remove('light-theme');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline-block';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('cmm-theme', isLight ? 'light' : 'dark');
  
  if (isLight) {
    sunIcon.style.display = 'inline-block';
    moonIcon.style.display = 'none';
    showToast('Switched to Light Mode', 'info');
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline-block';
    showToast('Switched to Dark Mode', 'info');
  }
}


// ==========================================================================
// 3. CORE DATA LOADING & STATE
// ==========================================================================
async function loadCatalog() {
  const localData = localStorage.getItem('cmm-custom-catalog');
  
  if (localData) {
    try {
      catalogData = JSON.parse(localData);
      showToast('Loaded catalog from browser memory.', 'info');
      processAndRender();
      return;
    } catch (e) {
      console.error('Error parsing catalog from localStorage. Reverting to data.json', e);
      localStorage.removeItem('cmm-custom-catalog');
    }
  }

  try {
    const response = await fetch('./data.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch data.json');
    catalogData = await response.json();
    showToast('Loaded media catalog successfully.', 'success');
  } catch (err) {
    console.error('Failed to load data.json:', err);
    showToast('Failed to load data.json from server. Check console.', 'error');
    // Fallback empty catalog so app doesn't crash
    catalogData = { folders: [] };
  }
  
  processAndRender();
}

function processAndRender() {
  assignUniqueIds();
  renderTypeFilters();
  renderTreeView();
  renderBreadcrumbs();
  renderStatsDashboard();
  renderMediaGrid();
}

// Gives every item and folder a unique ID to manage state selection
function assignUniqueIds() {
  let folderCounter = 0;
  let itemCounter = 0;

  function traverse(node, pathName) {
    node.id = `folder_${folderCounter++}`;
    node.path = pathName ? `${pathName} / ${node.name}` : node.name;
    
    if (node.items) {
      node.items.forEach(item => {
        item.id = `item_${itemCounter++}`;
        item.parentFolderId = node.id;
        item.parentFolderName = node.name;
      });
    }
    if (node.children) {
      node.children.forEach(child => traverse(child, node.path));
    }
  }

  catalogData.folders.forEach(rootFolder => traverse(rootFolder, ''));
}


// ==========================================================================
// 4. METRICS & STATISTICS BREAKDOWN
// ==========================================================================
function getMetrics() {
  let totalFiles = 0;
  const typeCounts = { pdf: 0, video: 0, audio: 0, image: 0, youtube: 0 };
  const langCounts = {};

  function countNode(node) {
    if (node.items) {
      node.items.forEach(item => {
        totalFiles++;
        
        // Count Types
        const t = item.type.toLowerCase();
        if (typeCounts.hasOwnProperty(t)) {
          typeCounts[t]++;
        }
        
        // Count Languages
        if (item.lang) {
          const l = item.lang.toLowerCase();
          langCounts[l] = (langCounts[l] || 0) + 1;
        }
      });
    }
    if (node.children) {
      node.children.forEach(countNode);
    }
  }

  catalogData.folders.forEach(countNode);
  return { totalFiles, typeCounts, langCounts };
}

function renderStatsDashboard() {
  const metrics = getMetrics();
  
  // Find top language
  let topLang = 'N/A';
  let topLangCount = 0;
  for (const [lang, count] of Object.entries(metrics.langCounts)) {
    if (count > topLangCount) {
      topLang = lang.toUpperCase();
      topLangCount = count;
    }
  }

  statsDashboard.innerHTML = `
    <div class="stat-card glass-panel clickable" onclick="selectFolder(null)" style="--card-accent: var(--accent-color)">
      <div class="stat-label">All Media Assets</div>
      <div class="stat-value">${metrics.totalFiles}</div>
      <div class="stat-subtext">Click to view all</div>
    </div>
    <div class="stat-card glass-panel" style="--card-accent: var(--pdf-color)">
      <div class="stat-label">PDF Documents</div>
      <div class="stat-value">${metrics.typeCounts.pdf}</div>
      <div class="stat-subtext">Files hosted in cloud</div>
    </div>
    <div class="stat-card glass-panel" style="--card-accent: var(--video-color)">
      <div class="stat-label">Direct Videos</div>
      <div class="stat-value">${metrics.typeCounts.video}</div>
      <div class="stat-subtext">HTML5 streaming ready</div>
    </div>
    <div class="stat-card glass-panel" style="--card-accent: var(--youtube-color)">
      <div class="stat-label">YouTube Videos</div>
      <div class="stat-value">${metrics.typeCounts.youtube}</div>
      <div class="stat-subtext">Embedded lectures</div>
    </div>
    <div class="stat-card glass-panel" style="--card-accent: var(--audio-color)">
      <div class="stat-label">Audio & Voice</div>
      <div class="stat-value">${metrics.typeCounts.audio}</div>
      <div class="stat-subtext">Waveform visualizer active</div>
    </div>
    <div class="stat-card glass-panel" style="--card-accent: var(--accent-color)">
      <div class="stat-label">Primary Language</div>
      <div class="stat-value">${topLang}</div>
      <div class="stat-subtext">${topLangCount} items categorized</div>
    </div>
  `;
}


// ==========================================================================
// 5. SIDEBAR FILTER CONTROLS
// ==========================================================================
function renderTypeFilters() {
  const metrics = getMetrics();
  const types = [
    { key: 'pdf', label: 'PDF Documents', color: 'var(--pdf-color)' },
    { key: 'video', label: 'Direct Videos', color: 'var(--video-color)' },
    { key: 'audio', label: 'Audio Tracks', color: 'var(--audio-color)' },
    { key: 'image', label: 'Images', color: 'var(--image-color)' },
    { key: 'youtube', label: 'YouTube Embeds', color: 'var(--youtube-color)' }
  ];

  typeFiltersContainer.innerHTML = types.map(t => {
    const isChecked = activeFilters.includes(t.key);
    return `
      <div class="filter-item glass-panel">
        <label class="filter-label">
          <input type="checkbox" class="filter-checkbox" value="${t.key}" ${isChecked ? 'checked' : ''} onchange="toggleFilter('${t.key}')">
          <span style="color: ${t.color}; font-weight: 500;">●</span> ${t.label}
        </label>
        <span class="type-count">${metrics.typeCounts[t.key] || 0}</span>
      </div>
    `;
  }).join('');
}

function toggleFilter(type) {
  const idx = activeFilters.indexOf(type);
  if (idx > -1) {
    if (activeFilters.length === 1) {
      showToast('At least one filter must be selected.', 'error');
      renderTypeFilters(); // Redraw to re-check the box
      return;
    }
    activeFilters.splice(idx, 1);
  } else {
    activeFilters.push(type);
  }
  renderMediaGrid();
}


// ==========================================================================
// 6. TREE NAVIGATION RENDERER
// ==========================================================================
function renderTreeView() {
  function getNodeCounts(node) {
    let totals = { total: 0, pdf: 0, video: 0, audio: 0, image: 0, youtube: 0 };
    
    if (node.items) {
      node.items.forEach(item => {
        totals.total++;
        const t = item.type.toLowerCase();
        if (totals.hasOwnProperty(t)) totals[t]++;
      });
    }
    
    if (node.children) {
      node.children.forEach(child => {
        const cTotals = getNodeCounts(child);
        totals.total += cTotals.total;
        totals.pdf += cTotals.pdf;
        totals.video += cTotals.video;
        totals.audio += cTotals.audio;
        totals.image += cTotals.image;
        totals.youtube += cTotals.youtube;
      });
    }
    return totals;
  }

  function buildTreeHTML(node) {
    const isSelected = currentFolderId === node.id;
    const counts = getNodeCounts(node);
    const hasChildren = (node.children && node.children.length > 0);
    const folderStateKey = `cmm-folder-expanded-${node.id}`;
    
    // Check if user previously expanded this folder
    const isExpanded = localStorage.getItem(folderStateKey) === 'true';

    let html = `
      <div class="tree-node">
        <div class="tree-row clickable ${isSelected ? 'active' : ''}" onclick="selectFolder('${node.id}', event)">
          ${hasChildren ? `
            <span class="folder-toggle ${isExpanded ? 'expanded' : ''}" onclick="toggleFolderCollapse('${node.id}', event)">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </span>
          ` : '<span style="width:16px"></span>'}
          <svg class="svg-icon" style="color: var(--folder-color);" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <span style="flex:1; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${node.name}">${node.name}</span>
          <span class="type-count" style="font-size: 0.75rem;">${counts.total}</span>
        </div>
        
        ${hasChildren ? `
          <div class="tree-children ${isExpanded ? '' : 'collapsed'}" id="children_${node.id}">
            ${node.children.map(child => buildTreeHTML(child)).join('')}
          </div>
        ` : ''}
      </div>
    `;
    return html;
  }

  treeContainer.innerHTML = catalogData.folders.map(root => buildTreeHTML(root)).join('');
}

function selectFolder(folderId, event) {
  if (event) event.stopPropagation();
  
  currentFolderId = folderId;
  
  // Re-render components
  renderTreeView();
  renderBreadcrumbs();
  renderMediaGrid();
  
  // On mobile, close sidebar when folder is selected
  if (window.innerWidth <= 768) {
    toggleSidebar(false);
  }
}

function toggleFolderCollapse(folderId, event) {
  if (event) event.stopPropagation();
  
  const childrenContainer = document.getElementById(`children_${folderId}`);
  if (!childrenContainer) return;
  
  const treeNode = childrenContainer.closest('.tree-node');
  const toggleIcon = treeNode ? treeNode.querySelector('.folder-toggle') : null;
  
  const isCollapsed = childrenContainer.classList.toggle('collapsed');
  if (toggleIcon) toggleIcon.classList.toggle('expanded', !isCollapsed);
  
  // Save expansion state
  localStorage.setItem(`cmm-folder-expanded-${folderId}`, !isCollapsed);
}


// ==========================================================================
// 7. BREADCRUMB BUILDER
// ==========================================================================
function renderBreadcrumbs() {
  if (currentFolderId === null) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item active">Catalog Overview (All Items)</span>`;
    return;
  }

  function findFolder(folders, id) {
    for (const f of folders) {
      if (f.id === id) return f;
      if (f.children) {
        const found = findFolder(f.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const activeFolder = findFolder(catalogData.folders, currentFolderId);
  if (!activeFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item active">Catalog Overview</span>`;
    return;
  }

  // Split path
  const pathParts = activeFolder.path.split(' / ');
  let runningIdPath = [];
  
  // A helper to trace folder IDs by names
  function getFolderIdByName(folders, name) {
    for (const f of folders) {
      if (f.name === name) return f.id;
      if (f.children) {
        const childId = getFolderIdByName(f.children, name);
        if (childId) return childId;
      }
    }
    return null;
  }

  let html = `<span class="breadcrumb-item clickable" onclick="selectFolder(null)">Catalog</span>`;
  
  pathParts.forEach((part, index) => {
    html += `<span class="breadcrumb-separator">/</span>`;
    const fId = getFolderIdByName(catalogData.folders, part);
    
    if (index === pathParts.length - 1) {
      html += `<span class="breadcrumb-item active">${part}</span>`;
    } else {
      html += `<span class="breadcrumb-item clickable" onclick="selectFolder('${fId}')">${part}</span>`;
    }
  });

  breadcrumbs.innerHTML = html;
}


// ==========================================================================
// 8. CLOUD PROVIDER DETECTOR & PARSER (30+ providers)
// Returns: { provider, type, embedUrl, directUrl, supportsEmbed, supportsDirect }
// ==========================================================================
function detectCloudProvider(url) {
  if (!url) return { provider: 'Unknown', type: 'link', embedUrl: '', directUrl: '', supportsEmbed: false, supportsDirect: false };

  const lowUrl = url.toLowerCase();
  
  // 1. YouTube
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
    let videoId = '';
    if (lowUrl.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (lowUrl.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (lowUrl.includes('embed/')) {
      videoId = url.split('embed/')[1].split(/[?#]/)[0];
    }
    return {
      provider: 'YouTube',
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: false
    };
  }

  // 2. Vimeo
  if (lowUrl.includes('vimeo.com')) {
    let videoId = '';
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) videoId = match[1];
    return {
      provider: 'Vimeo',
      type: 'embed',
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 3. Dailymotion
  if (lowUrl.includes('dailymotion.com') || lowUrl.includes('dai.ly')) {
    let videoId = '';
    if (lowUrl.includes('dai.ly/')) {
      videoId = url.split('dai.ly/')[1].split(/[?#]/)[0];
    } else {
      const match = url.match(/video\/([a-zA-Z0-9]+)/);
      if (match) videoId = match[1];
    }
    return {
      provider: 'Dailymotion',
      type: 'embed',
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 4. SoundCloud
  if (lowUrl.includes('soundcloud.com')) {
    return {
      provider: 'SoundCloud',
      type: 'embed',
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: false
    };
  }

  // 5. Spotify
  if (lowUrl.includes('spotify.com') || lowUrl.includes('open.spotify.com')) {
    let embedUrl = url;
    if (lowUrl.includes('open.spotify.com')) {
      embedUrl = url.replace('open.spotify.com', 'open.spotify.com/embed');
    }
    return {
      provider: 'Spotify',
      type: 'embed',
      embedUrl: embedUrl,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: false
    };
  }

  // 6. Google Drive
  if (lowUrl.includes('drive.google.com')) {
    let fileId = '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) fileId = match[1];
    return {
      provider: 'Google Drive',
      type: 'embed',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 7. Dropbox
  if (lowUrl.includes('dropbox.com')) {
    let directUrl = url.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');
    if (!directUrl.includes('?raw=1')) {
      directUrl += (directUrl.includes('?') ? '&' : '?') + 'raw=1';
    }
    return {
      provider: 'Dropbox',
      type: 'direct',
      embedUrl: directUrl,
      directUrl: directUrl,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 8. OneDrive
  if (lowUrl.includes('1drv.ms') || lowUrl.includes('onedrive.live.com')) {
    return {
      provider: 'OneDrive',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 9. Mega.nz
  if (lowUrl.includes('mega.nz')) {
    let embedUrl = url;
    if (lowUrl.includes('mega.nz/file/')) {
      embedUrl = url.replace('mega.nz/file/', 'mega.nz/embed/');
    } else if (lowUrl.includes('mega.nz/#!')) {
      embedUrl = url.replace('mega.nz/#!', 'mega.nz/embed/#');
    }
    return {
      provider: 'Mega',
      type: 'embed',
      embedUrl: embedUrl,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 10. pCloud
  if (lowUrl.includes('pcloud.link') || lowUrl.includes('pcloud.com')) {
    return {
      provider: 'pCloud',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 11. Box.com
  if (lowUrl.includes('box.com/s/') || lowUrl.includes('app.box.com')) {
    let embedUrl = url;
    if (url.includes('/s/')) {
      const parts = url.split('/s/');
      embedUrl = `https://app.box.com/embed/s/${parts[1]}`;
    }
    return {
      provider: 'Box',
      type: 'embed',
      embedUrl: embedUrl,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: false
    };
  }

  // 12. MediaFire
  if (lowUrl.includes('mediafire.com')) {
    return {
      provider: 'MediaFire',
      type: 'link',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: false,
      supportsDirect: false
    };
  }

  // 13. 4shared
  if (lowUrl.includes('4shared.com')) {
    return {
      provider: '4shared',
      type: 'link',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: false,
      supportsDirect: false
    };
  }

  // 14. WeTransfer
  if (lowUrl.includes('wetransfer.com')) {
    return {
      provider: 'WeTransfer',
      type: 'link',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: false,
      supportsDirect: false
    };
  }

  // 15. Send Anywhere
  if (lowUrl.includes('send-anywhere.com')) {
    return {
      provider: 'Send Anywhere',
      type: 'link',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 16. Imgur
  if (lowUrl.includes('imgur.com')) {
    let directUrl = url;
    if (!url.includes('/a/')) {
      const imgMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
      if (imgMatch) {
        directUrl = `https://i.imgur.com/${imgMatch[1]}.jpg`;
      }
    }
    return {
      provider: 'Imgur',
      type: 'direct',
      embedUrl: url,
      directUrl: directUrl,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 17. Pastebin
  if (lowUrl.includes('pastebin.com')) {
    let rawUrl = url;
    const pasteMatch = url.match(/pastebin\.com\/([a-zA-Z0-9]+)/);
    if (pasteMatch) {
      rawUrl = `https://pastebin.com/raw/${pasteMatch[1]}`;
    }
    return {
      provider: 'Pastebin',
      type: 'embed',
      embedUrl: url,
      directUrl: rawUrl,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 18. GitHub
  if (lowUrl.includes('github.com')) {
    let rawUrl = url;
    if (lowUrl.includes('/blob/')) {
      rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return {
      provider: 'GitHub',
      type: 'direct',
      embedUrl: url,
      directUrl: rawUrl,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 19. Cloudinary
  if (lowUrl.includes('cloudinary.com') || lowUrl.includes('res.cloudinary.com')) {
    return {
      provider: 'Cloudinary',
      type: 'direct',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 20. Backblaze B2
  if (lowUrl.includes('backblazeb2.com') || lowUrl.includes('backblaze')) {
    return {
      provider: 'Backblaze B2',
      type: 'direct',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 21. Wasabi
  if (lowUrl.includes('wasabisys.com')) {
    return {
      provider: 'Wasabi',
      type: 'direct',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 22. Yandex Disk
  if (lowUrl.includes('yadi.sk') || lowUrl.includes('yandex.ru/disk') || lowUrl.includes('yandex.com/disk')) {
    return {
      provider: 'Yandex Disk',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 23. Koofr
  if (lowUrl.includes('koofr.net') || lowUrl.includes('koofr.eu')) {
    return {
      provider: 'Koofr',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 24. Seafile
  if (lowUrl.includes('seafile')) {
    return {
      provider: 'Seafile',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 25. Nextcloud / ownCloud
  if (lowUrl.includes('/s/') && (lowUrl.includes('cloud') || lowUrl.includes('nextcloud') || lowUrl.includes('owncloud'))) {
    const directUrl = url.endsWith('/') ? url + 'download' : url + '/download';
    return {
      provider: 'Nextcloud',
      type: 'direct',
      embedUrl: url,
      directUrl: directUrl,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 26. S3 / Generic direct
  if (lowUrl.includes('amazonaws.com') || lowUrl.includes('s3.')) {
    return {
      provider: 'S3 Bucket',
      type: 'direct',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 27. iCloud
  if (lowUrl.includes('icloud.com')) {
    return {
      provider: 'iCloud',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: false
    };
  }

  // 28. Sync.com
  if (lowUrl.includes('sync.com')) {
    return {
      provider: 'Sync.com',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 29. Internxt
  if (lowUrl.includes('internxt.com')) {
    return {
      provider: 'Internxt',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 30. HiDrive
  if (lowUrl.includes('hidrive')) {
    return {
      provider: 'HiDrive',
      type: 'embed',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: true,
      supportsDirect: true
    };
  }

  // 31. WebDAV
  if (lowUrl.includes('dav') || lowUrl.includes('webdav')) {
    return {
      provider: 'WebDAV',
      type: 'direct',
      embedUrl: url,
      directUrl: url,
      supportsEmbed: false,
      supportsDirect: true
    };
  }

  // 32. Default: Guess by file extension
  const isDirect = /\.(mp4|webm|mkv|mp3|wav|ogg|pdf|png|jpg|jpeg|webp|gif|txt|md)$/i.test(lowUrl);
  return {
    provider: isDirect ? 'Direct Link' : 'External Link',
    type: isDirect ? 'direct' : 'embed',
    embedUrl: url,
    directUrl: url,
    supportsEmbed: isDirect,
    supportsDirect: isDirect
  };
}


// ==========================================================================
// 9. MEDIA GRID RENDERER & SEARCH
// ==========================================================================
function renderMediaGrid() {
  mediaGrid.innerHTML = '';
  
  let itemsToRender = [];

  function collectItems(node) {
    if (currentFolderId === null || node.id === currentFolderId) {
      if (node.items) {
        itemsToRender = itemsToRender.concat(node.items);
      }
      // If we are looking at a specific folder, we DO NOT automatically include child folders' items
      // unless we want a flat recursive view. The user prompt suggests a standard directory view.
      // So if currentFolderId is met, we don't traverse children for items.
      if (currentFolderId !== null) return;
    }
    
    if (node.children) {
      node.children.forEach(collectItems);
    }
  }

  catalogData.folders.forEach(collectItems);

  // Apply filters
  let filteredItems = itemsToRender.filter(item => {
    // 1. Type filter
    const typeMatch = activeFilters.includes(item.type.toLowerCase());
    
    // 2. Search fuzzy filter
    let searchMatch = true;
    if (searchQuery.trim() !== '') {
      const s = searchQuery.toLowerCase().trim();
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const lang = (item.lang || '').toLowerCase();
      const folder = (item.parentFolderName || '').toLowerCase();
      
      searchMatch = name.includes(s) || desc.includes(s) || lang.includes(s) || folder.includes(s);
    }

    return typeMatch && searchMatch;
  });

  // Render Grid
  if (filteredItems.length === 0) {
    mediaGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    
    if (searchQuery.trim() !== '') {
      emptyStateMessage.innerHTML = `No results matching "<strong>${searchQuery}</strong>" inside the active filter parameters.`;
    } else {
      emptyStateMessage.textContent = `This directory contains no items matching the active checkboxes (${activeFilters.join(', ')}).`;
    }
    return;
  }

  mediaGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  const typeData = {
    pdf: { color: 'var(--pdf-color)', label: 'PDF', icon: `<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v1.25c0 .41-.34.75-.75.75s-.75-.34-.75-.75V8c0-.55.45-1 1-1H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5c-.28 0-.5-.22-.5-.5V7.5c0-.28.22-.5.5-.5h2.5c.83 0 1.5.67 1.5 1.5v3zm4-3.75c0 .41-.34.75-.75.75H19v1h.75c.41 0 .75.34.75.75s-.34.75-.75.75H19v1.25c0 .41-.34.75-.75.75s-.75-.34-.75-.75V8c0-.55.45-1 1-1h1.25c.41 0 .75.34.75.75zM9 10h1V8H9v2zm5 2h1V8h-1v4zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>` },
    video: { color: 'var(--video-color)', label: 'Video', icon: `<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>` },
    audio: { color: 'var(--audio-color)', label: 'Audio', icon: `<path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>` },
    image: { color: 'var(--image-color)', label: 'Image', icon: `<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>` },
    youtube: { color: 'var(--youtube-color)', label: 'YouTube', icon: `<path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.19zM10 15V9l5.2 3-5.2 3z"/>` }
  };

  mediaGrid.innerHTML = filteredItems.map(item => {
    const cloudInfo = detectCloudProvider(item.url);
    const t = item.type.toLowerCase();
    const styleData = typeData[t] || { color: 'var(--text-muted)', label: 'File', icon: '' };

    return `
      <div class="media-card glass-panel clickable" onclick="openMediaViewer('${item.id}')" style="--icon-color: ${styleData.color};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="media-card-icon">
            <svg class="svg-icon" style="font-size: 1.5rem;" viewBox="0 0 24 24">${styleData.icon}</svg>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span class="media-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">${cloudInfo.provider}</span>
            ${cloudInfo.supportsDirect ? `<span class="media-badge link-badge-direct" title="Direct Link Supported">🔗 Direct</span>` : ''}
            ${cloudInfo.supportsEmbed ? `<span class="media-badge link-badge-embed" title="Embed/Stream Supported">📺 Embed</span>` : ''}
            ${item.lang ? `<span class="media-badge lang-badge">${item.lang}</span>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 8px;">
          <h4 class="media-card-title" title="${item.name}">${item.name}</h4>
          <p class="media-card-desc" title="${item.description || 'No description available.'}">${item.description || 'No description available.'}</p>
        </div>
        
        <div class="media-card-meta">
          <span style="font-size:0.75rem;">📁 ${item.parentFolderName}</span>
          <span style="font-weight: bold; color: ${styleData.color};">${styleData.label}</span>
        </div>
      </div>
    `;
  }).join('');
}


// ==========================================================================
// 10. MEDIA VIEWER & PLAYERS (Custom Skinning & YouTube API)
// ==========================================================================
function openMediaViewer(itemId) {
  // Find item
  let activeItem = null;
  function traverse(node) {
    if (node.items) {
      const found = node.items.find(i => i.id === itemId);
      if (found) { activeItem = found; return; }
    }
    if (node.children) node.children.forEach(traverse);
  }
  catalogData.folders.forEach(traverse);

  if (!activeItem) {
    showToast('Media asset not found.', 'error');
    return;
  }

  currentOpenItem = activeItem;
  currentPlayerMode = 'embed'; // Default to embed mode
  
  // Setup Metadata
  playerMetaTitle.textContent = activeItem.name;
  playerMetaDesc.textContent = activeItem.description || 'No description available.';
  
  // Show/hide mode toggle based on provider capabilities
  const cloudInfo = detectCloudProvider(activeItem.url);
  const modeToggle = document.getElementById('playerModeToggle');
  if (cloudInfo.supportsEmbed && cloudInfo.supportsDirect) {
    modeToggle.style.display = 'flex';
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === 'embed');
    });
  } else {
    modeToggle.style.display = 'none';
  }
  
  // Clean old players
  destroyPlayers();
  
  // Open modal UI
  playerModal.classList.add('active');
  playerContainer.className = 'player-container'; // Reset classes
  customVideoControls.style.display = 'none';

  renderPlayerContent(activeItem);

  showToast(`Streaming from ${cloudInfo.provider}`, 'info');
}

function renderPlayerContent(item) {
  const cloudInfo = detectCloudProvider(item.url);
  const type = item.type.toLowerCase();
  
  // Determine which URL to use based on player mode
  let targetUrl = cloudInfo.embedUrl;
  if (currentPlayerMode === 'direct' && cloudInfo.supportsDirect) {
    targetUrl = cloudInfo.directUrl;
  }

  // Route Player Render
  if (type === 'youtube' || cloudInfo.type === 'youtube') {
    // Extract video ID from embed URL for YouTube IFrame API
    const ytId = cloudInfo.embedUrl.split('/embed/')[1] || '';
    renderYouTubePlayer(ytId);
  } else if (type === 'video') {
    renderCustomVideoPlayer(targetUrl);
  } else if (type === 'audio') {
    renderCustomAudioPlayer(targetUrl, item);
  } else if (type === 'pdf') {
    renderPdfViewer(targetUrl);
  } else if (type === 'image') {
    renderImageViewer(targetUrl);
  } else {
    // Treat everything else as generic iframe/cloud embed
    renderIframeEmbed(targetUrl);
  }
}

function switchPlayerMode(mode) {
  if (!currentOpenItem) return;
  currentPlayerMode = mode;
  
  // Update button states
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // Re-render player with new mode
  destroyPlayers();
  playerContainer.className = 'player-container';
  customVideoControls.style.display = 'none';
  renderPlayerContent(currentOpenItem);
  
  showToast(`Switched to ${mode === 'embed' ? '📺 Embed/Stream' : '🔗 Direct Link'} mode`, 'info');
}

function destroyPlayers() {
  // 1. YouTube
  if (ytPlayer) {
    try { ytPlayer.destroy(); } catch(e){}
    ytPlayer = null;
  }
  
  // 2. Audio
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.src = '';
    activeAudioElement = null;
  }
  if (audioAnimationId) {
    cancelAnimationFrame(audioAnimationId);
    audioAnimationId = null;
  }
  
  // 3. Video
  if (activeVideoElement) {
    activeVideoElement.pause();
    activeVideoElement.src = '';
    activeVideoElement = null;
  }

  playerContainer.innerHTML = '';
}

function closeMediaViewer() {
  playerModal.classList.remove('active');
  destroyPlayers();
  currentOpenItem = null;
}

// 10a. YouTube IFrame API Handler
function renderYouTubePlayer(videoId) {
  playerContainer.innerHTML = `<div id="ytPlayerContainer" class="media-embed"></div>`;
  
  const setupYT = () => {
    if (typeof YT === 'undefined' || !YT.Player) return;
    ytPlayer = new YT.Player('ytPlayerContainer', {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        controls: 1
      },
      events: {
        'onReady': () => console.log('[YouTube API] Player ready.'),
        'onError': (e) => showToast('YouTube API Error. Playback restricted.', 'error')
      }
    });
  };

  // Check if API loaded
  if (typeof YT !== 'undefined' && YT.Player) {
    setupYT();
  } else {
    // Fallback if script loading delayed - preserve any existing callback
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (oldReady) oldReady();
      setupYT();
    };
  }
}

// 10b. Custom Skin HTML5 Video Player
function renderCustomVideoPlayer(srcUrl) {
  playerContainer.innerHTML = `
    <video id="customVideoElement" class="video-element" src="${srcUrl}" playsinline autoplay></video>
  `;
  
  activeVideoElement = document.getElementById('customVideoElement');
  customVideoControls.style.display = 'flex';
  
  // Bind Controls & Listeners
  videoPlayIcon.style.display = 'none';
  videoPauseIcon.style.display = 'inline-block';
  
  activeVideoElement.addEventListener('timeupdate', updateVideoProgress);
  activeVideoElement.addEventListener('loadedmetadata', () => {
    videoTimeDisplay.textContent = `${formatTime(0)} / ${formatTime(activeVideoElement.duration)}`;
    videoVolumeSlider.value = activeVideoElement.volume;
    videoSpeedSelect.value = "1";
  });
  
  activeVideoElement.addEventListener('play', () => {
    videoPlayIcon.style.display = 'none';
    videoPauseIcon.style.display = 'inline-block';
  });
  
  activeVideoElement.addEventListener('pause', () => {
    videoPlayIcon.style.display = 'inline-block';
    videoPauseIcon.style.display = 'none';
  });

  activeVideoElement.addEventListener('ended', () => {
    videoPlayIcon.style.display = 'inline-block';
    videoPauseIcon.style.display = 'none';
    showToast('Video playback completed.', 'info');
  });

  activeVideoElement.addEventListener('error', () => {
    showToast('Error streaming direct video. Falling back to generic iframe...', 'error');
    renderIframeEmbed(srcUrl);
  });
}

function updateVideoProgress() {
  if (isVideoSeeking || !activeVideoElement) return;
  const current = activeVideoElement.currentTime;
  const duration = activeVideoElement.duration || 1;
  const pct = (current / duration) * 100;
  
  videoProgressBar.style.width = `${pct}%`;
  videoTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

// 10c. Custom HTML5 Audio & Canvas Waveform Visualizer
function renderCustomAudioPlayer(srcUrl, item) {
  playerContainer.classList.add('audio-mode');
  
  playerContainer.innerHTML = `
    <div class="audio-track-info">
      <div class="audio-track-title">${item.name}</div>
      <div class="audio-track-desc">📁 ${item.parentFolderName} ${item.lang ? `• 🌐 ${item.lang.toUpperCase()}` : ''}</div>
    </div>
    <canvas class="audio-waveform" id="audioWaveformCanvas"></canvas>
    
    <div class="audio-controls">
      <div class="progress-bar-container" id="audioProgressContainer">
        <div class="progress-bar-fill" id="audioProgressBar"></div>
      </div>
      <div class="controls-row">
        <div class="controls-left">
          <button class="control-btn" id="audioPlayPauseBtn">
            <svg class="svg-icon" id="audioPlayIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="svg-icon" id="audioPauseIcon" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <span class="time-display" id="audioTimeDisplay">0:00 / 0:00</span>
        </div>
        <div class="controls-right">
          <div class="volume-container">
            <button class="control-btn" id="audioMuteBtn">
              <svg class="svg-icon" id="audioVolumeIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.03z"/></svg>
              <svg class="svg-icon" id="audioMuteIcon" viewBox="0 0 24 24" style="display:none;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.84 21 13.46 21 12c0-4.55-3.2-8.36-7.5-9.28v2.04c3.2.85 5.5 3.73 5.5 7.24zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03a8.99 8.99 0 003.44-1.79l2.29 2.29L21 21.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            </button>
            <input type="range" class="volume-slider" id="audioVolumeSlider" min="0" max="1" step="0.05" value="1">
          </div>
          <select class="speed-select" id="audioSpeedSelect">
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1" selected>1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Hidden Audio Node -->
    <audio id="customAudioNode" src="${srcUrl}" crossorigin="anonymous" autoplay></audio>
  `;

  activeAudioElement = document.getElementById('customAudioNode');
  
  const canvas = document.getElementById('audioWaveformCanvas');
  const ctx = canvas.getContext('2d');
  
  const playBtn = document.getElementById('audioPlayPauseBtn');
  const playIcon = document.getElementById('audioPlayIcon');
  const pauseIcon = document.getElementById('audioPauseIcon');
  const muteBtn = document.getElementById('audioMuteBtn');
  const volIcon = document.getElementById('audioVolumeIcon');
  const muteIcon = document.getElementById('audioMuteIcon');
  const volSlider = document.getElementById('audioVolumeSlider');
  const speedSelect = document.getElementById('audioSpeedSelect');
  const progressCont = document.getElementById('audioProgressContainer');
  const progressFill = document.getElementById('audioProgressBar');
  const timeDisplay = document.getElementById('audioTimeDisplay');

  // Listeners
  activeAudioElement.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `${formatTime(0)} / ${formatTime(activeAudioElement.duration)}`;
  });
  
  activeAudioElement.addEventListener('timeupdate', () => {
    const current = activeAudioElement.currentTime;
    const duration = activeAudioElement.duration || 1;
    progressFill.style.width = `${(current/duration)*100}%`;
    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  });

  const toggleAudioPlay = () => {
    if (activeAudioElement.paused) {
      activeAudioElement.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline-block';
    } else {
      activeAudioElement.pause();
      playIcon.style.display = 'inline-block';
      pauseIcon.style.display = 'none';
    }
  };

  playBtn.addEventListener('click', toggleAudioPlay);
  
  activeAudioElement.addEventListener('play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'inline-block';
  });
  activeAudioElement.addEventListener('pause', () => {
    playIcon.style.display = 'inline-block';
    pauseIcon.style.display = 'none';
  });

  progressCont.addEventListener('click', (e) => {
    const width = progressCont.clientWidth;
    const clickX = e.offsetX;
    const duration = activeAudioElement.duration;
    if (duration) {
      activeAudioElement.currentTime = (clickX / width) * duration;
    }
  });

  volSlider.addEventListener('input', (e) => {
    activeAudioElement.volume = e.target.value;
    activeAudioElement.muted = (e.target.value === "0");
    muteIcon.style.display = activeAudioElement.muted ? 'inline-block' : 'none';
    volIcon.style.display = activeAudioElement.muted ? 'none' : 'inline-block';
  });

  muteBtn.addEventListener('click', () => {
    activeAudioElement.muted = !activeAudioElement.muted;
    muteIcon.style.display = activeAudioElement.muted ? 'inline-block' : 'none';
    volIcon.style.display = activeAudioElement.muted ? 'none' : 'inline-block';
    volSlider.value = activeAudioElement.muted ? 0 : activeAudioElement.volume;
  });

  speedSelect.addEventListener('change', (e) => {
    activeAudioElement.playbackRate = parseFloat(e.target.value);
  });

  activeAudioElement.addEventListener('error', () => {
    showToast('Failed to stream audio file directly. Retrying in embed mode.', 'error');
    renderIframeEmbed(srcUrl);
  });

  // Setup Web Audio API Waveform Visualizer with CORS Safety
  function setupVisualizer() {
    try {
      // Create new context if needed or if closed
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume if suspended (Chrome autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // If element already connected, use synthetic fallback to avoid DOMException
      if (activeAudioElement._connectedToAudioContext) {
        console.warn('[Web Audio API] Element already connected. Using synthetic fallback.');
        drawSyntheticWaveform();
        return;
      }
      
      // If CORS blocks us, connecting the media element throws or creates silent data.
      // We try standard connection:
      const source = audioContext.createMediaElementSource(activeAudioElement);
      activeAudioElement._connectedToAudioContext = true;
      audioAnalyser = audioContext.createAnalyser();
      audioAnalyser.fftSize = 256;
      source.connect(audioAnalyser);
      audioAnalyser.connect(audioContext.destination);
      
      drawAnalyserWaveform();
      console.log('[Web Audio API] Visualizer connected successfully.');
    } catch (err) {
      console.warn('[Web Audio API] CORS restrictions blocked frequency analysis. Using synthetic fallback visualizer.', err);
      drawSyntheticWaveform();
    }
  }

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 120;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mode 1: Real Waveform via AnalyserNode
  function drawAnalyserWaveform() {
    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
      if (!activeAudioElement || activeAudioElement.src === '') return;
      audioAnimationId = requestAnimationFrame(draw);
      
      audioAnalyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;
      
      // Center vertical line
      const centerY = canvas.height / 2;
      
      const isDark = !document.body.classList.contains('light-theme');
      ctx.fillStyle = isDark ? '#10b981' : '#059669';
      
      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        if (barHeight < 3) barHeight = 3; // minimal line
        
        // Mirror bars top and bottom from center
        ctx.fillRect(x, centerY - barHeight/2, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
    draw();
  }

  // Mode 2: CORS Fallback (Mathematical wavy animation tied to playback)
  function drawSyntheticWaveform() {
    let phase = 0;
    
    function draw() {
      if (!activeAudioElement || activeAudioElement.src === '') return;
      audioAnimationId = requestAnimationFrame(draw);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isPlaying = !activeAudioElement.paused;
      if (isPlaying) phase += 0.15;
      
      const centerY = canvas.height / 2;
      const count = 40;
      const barWidth = canvas.width / count;
      
      const isDark = !document.body.classList.contains('light-theme');
      ctx.fillStyle = isDark ? '#10b981' : '#059669';
      
      for (let i = 0; i < count; i++) {
        // Create a sine wave pattern that scales with volume and current speed
        let barHeight = 6;
        if (isPlaying) {
          const sineValue = Math.sin((i / 5) + phase) * Math.cos((i / 3) - phase);
          barHeight = Math.abs(sineValue) * 60 + 6;
        } else {
          // Flatten when paused
          barHeight = 4 + (Math.sin(i * 0.5) * 2);
        }
        
        ctx.fillRect(i * barWidth + 2, centerY - barHeight / 2, barWidth - 4, barHeight);
      }
    }
    draw();
  }

  // Brief delay to allow AudioContext to boot (Chrome requirement on user interaction)
  canvas.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  });

  setupVisualizer();
}

// 10d. PDF Viewer (With fallback)
function renderPdfViewer(srcUrl) {
  // Try embedding directly first
  playerContainer.innerHTML = `
    <iframe class="media-embed" src="${srcUrl}" id="pdfIframe"></iframe>
  `;
  
  // Set fallback timeout: if PDF doesn't load or is a restricted Drive link, suggest Google Docs Viewer
  const iframe = document.getElementById('pdfIframe');
  let fallbackTriggered = false;
  
  iframe.onerror = () => {
    triggerPdfFallback();
  };
  
  function triggerPdfFallback() {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    showToast('Direct PDF restricted by cloud provider. Loading via Google Docs Viewer fallback.', 'info');
    const gViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(srcUrl)}&embedded=true`;
    playerContainer.innerHTML = `<iframe class="media-embed" src="${gViewerUrl}"></iframe>`;
  }

  // Some cloud providers block standard embedding via CSP.
  // We can proactively check if it's a known URL that usually requires viewer
  if (srcUrl.includes('drive.google.com') && srcUrl.includes('/view')) {
    // Keep standard preview. That works fine in iframe.
  } else if (!srcUrl.endsWith('.pdf') && !srcUrl.includes('?dl=1')) {
    // If it's a generic page sharing link, let it embed.
  }
}

// 10e. Image Preview
function renderImageViewer(srcUrl) {
  playerContainer.innerHTML = `
    <img src="${srcUrl}" class="image-preview" alt="Image catalog preview">
  `;
}

// 10f. Fallback Iframe/Cloud Embed
function renderIframeEmbed(srcUrl) {
  playerContainer.innerHTML = `
    <iframe class="media-embed" src="${srcUrl}" allowfullscreen 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
    </iframe>
  `;
}

// Helper: Format seconds to M:SS
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}


// ==========================================================================
// 11. CUSTOM VIDEO CONTROL BINDINGS
// ==========================================================================
function bindVideoControlListeners() {
  const togglePlay = () => {
    if (!activeVideoElement) return;
    if (activeVideoElement.paused) {
      activeVideoElement.play();
    } else {
      activeVideoElement.pause();
    }
  };

  videoPlayPauseBtn.addEventListener('click', togglePlay);
  
  videoRewindBtn.addEventListener('click', () => {
    if (activeVideoElement) activeVideoElement.currentTime = Math.max(0, activeVideoElement.currentTime - 5);
  });
  
  videoForwardBtn.addEventListener('click', () => {
    if (activeVideoElement) activeVideoElement.currentTime = Math.min(activeVideoElement.duration, activeVideoElement.currentTime + 5);
  });

  videoMuteBtn.addEventListener('click', () => {
    if (!activeVideoElement) return;
    activeVideoElement.muted = !activeVideoElement.muted;
    videoMuteIcon.style.display = activeVideoElement.muted ? 'inline-block' : 'none';
    videoVolumeIcon.style.display = activeVideoElement.muted ? 'none' : 'inline-block';
    videoVolumeSlider.value = activeVideoElement.muted ? 0 : activeVideoElement.volume;
  });

  videoVolumeSlider.addEventListener('input', (e) => {
    if (!activeVideoElement) return;
    const val = parseFloat(e.target.value);
    activeVideoElement.volume = val;
    activeVideoElement.muted = (val === 0);
    videoMuteIcon.style.display = activeVideoElement.muted ? 'inline-block' : 'none';
    videoVolumeIcon.style.display = activeVideoElement.muted ? 'none' : 'inline-block';
  });

  videoSpeedSelect.addEventListener('change', (e) => {
    if (activeVideoElement) activeVideoElement.playbackRate = parseFloat(e.target.value);
  });

  videoFullscreenBtn.addEventListener('click', () => {
    if (!activeVideoElement) return;
    
    const container = playerContainer;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen(); // Safari
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });

  // Progress Bar Seek
  videoProgressContainer.addEventListener('mousedown', (e) => {
    if (!activeVideoElement) return;
    isVideoSeeking = true;
    seekVideo(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isVideoSeeking) seekVideo(e);
  });

  window.addEventListener('mouseup', () => {
    isVideoSeeking = false;
  });

  function seekVideo(e) {
    const rect = videoProgressContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    
    const duration = activeVideoElement.duration || 1;
    const clickPct = x / rect.width;
    
    activeVideoElement.currentTime = clickPct * duration;
    videoProgressBar.style.width = `${clickPct * 100}%`;
  }
}


// ==========================================================================
// 12. KEYBOARD SHORTCUTS
// ==========================================================================
function bindKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Check if player modal is active
    if (!playerModal.classList.contains('active')) return;
    
    // Ignore if user typing in a search bar, textarea, etc.
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const vElement = activeVideoElement;
    const aElement = activeAudioElement;
    const media = vElement || aElement; // Combined reference

    switch(e.code) {
      case 'Space':
        e.preventDefault();
        if (media) {
          if (media.paused) media.play();
          else media.pause();
        } else if (ytPlayer && ytPlayer.getPlayerState) {
          const state = ytPlayer.getPlayerState();
          if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
          else ytPlayer.playVideo();
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (media) media.currentTime = Math.max(0, media.currentTime - 5);
        else if (ytPlayer && ytPlayer.getCurrentTime) ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 5), true);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (media) media.currentTime = Math.min(media.duration, media.currentTime + 5);
        else if (ytPlayer && ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() + 5, true);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (media) {
          media.volume = Math.min(1, media.volume + 0.1);
          if (vElement) videoVolumeSlider.value = media.volume;
          if (aElement) document.getElementById('audioVolumeSlider').value = media.volume;
          showToast(`Volume: ${Math.round(media.volume * 100)}%`, 'info');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (media) {
          media.volume = Math.max(0, media.volume - 0.1);
          if (vElement) videoVolumeSlider.value = media.volume;
          if (aElement) document.getElementById('audioVolumeSlider').value = media.volume;
          showToast(`Volume: ${Math.round(media.volume * 100)}%`, 'info');
        }
        break;
        
      case 'KeyM':
        e.preventDefault();
        if (media) {
          media.muted = !media.muted;
          showToast(media.muted ? 'Muted' : 'Unmuted', 'info');
          // Update visual states
          if (vElement) {
            videoMuteIcon.style.display = media.muted ? 'inline-block' : 'none';
            videoVolumeIcon.style.display = media.muted ? 'none' : 'inline-block';
            videoVolumeSlider.value = media.muted ? 0 : media.volume;
          }
          if (aElement) {
            document.getElementById('audioMuteIcon').style.display = media.muted ? 'inline-block' : 'none';
            document.getElementById('audioVolumeIcon').style.display = media.muted ? 'none' : 'inline-block';
            document.getElementById('audioVolumeSlider').value = media.muted ? 0 : media.volume;
          }
        }
        break;
        
      case 'KeyF':
        e.preventDefault();
        if (vElement) {
          videoFullscreenBtn.click();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        closeMediaViewer();
        break;
    }
  });
}


// ==========================================================================
// 13. JSON EDITOR CONTROLS
// ==========================================================================
function openJsonEditor() {
  editorModal.classList.add('active');
  jsonTextarea.value = JSON.stringify(catalogData, null, 2);
  showToast('JSON Editor Opened', 'info');
}

function closeJsonEditor() {
  editorModal.classList.remove('active');
}

function formatJson() {
  try {
    const obj = JSON.parse(jsonTextarea.value);
    jsonTextarea.value = JSON.stringify(obj, null, 2);
    showToast('JSON formatted successfully', 'success');
  } catch (err) {
    showToast('Syntax Error: Cannot format invalid JSON.', 'error');
  }
}

function copyJson() {
  jsonTextarea.select();
  navigator.clipboard.writeText(jsonTextarea.value)
    .then(() => showToast('Copied to clipboard! Commit this to your data.json file on GitHub.', 'success'))
    .catch(() => showToast('Clipboard copy failed.', 'error'));
}

function applyJsonChanges() {
  try {
    const editedObj = JSON.parse(jsonTextarea.value);
    
    // Quick schema validation (Must contain folders array)
    if (!editedObj.folders || !Array.isArray(editedObj.folders)) {
      throw new Error('Invalid schema: Missing root "folders" array.');
    }
    
    catalogData = editedObj;
    localStorage.setItem('cmm-custom-catalog', JSON.stringify(catalogData));
    
    // Re-render whole app
    currentFolderId = null; // Reset to catalog root
    processAndRender();
    
    closeJsonEditor();
    showToast('Changes applied successfully! Saved to browser memory.', 'success');
  } catch (err) {
    console.error('JSON Parsing failed:', err);
    showToast(`Invalid JSON: ${err.message}`, 'error');
  }
}


// ==========================================================================
// 13b. CLOUD PROVIDERS REFERENCE MODAL
// ==========================================================================
function renderCloudProvidersModal() {
  const container = document.getElementById('providersTableContainer');
  if (!container) return;
  
  const rows = CLOUD_PROVIDERS_REFERENCE.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.storage}</td>
      <td>${p.maxFile}</td>
      <td style="text-align: center;">${p.direct ? '✅' : '❌'}</td>
      <td style="text-align: center;">${p.embed ? '✅' : '❌'}</td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${p.notes}</span></td>
    </tr>
  `).join('');
  
  container.innerHTML = `
    <table class="providers-table">
      <thead>
        <tr>
          <th>Provider</th>
          <th>Free Storage</th>
          <th>Max File Size</th>
          <th style="text-align: center;">🔗 Direct</th>
          <th style="text-align: center;">📺 Embed</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function openProvidersModal() {
  document.getElementById('providersModal').classList.add('active');
  renderCloudProvidersModal();
}

function closeProvidersModal() {
  document.getElementById('providersModal').classList.remove('active');
}

// ==========================================================================
// 14. COMPONENT HELPERS & TOASTS
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast glass-panel ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  toastContainer.appendChild(toast);
  
  // Slide out and remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 4000);
}

function toggleSidebar(forceState) {
  const isOpening = (forceState !== undefined) ? forceState : !sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', isOpening);
  sidebarBackdrop.classList.toggle('active', isOpening);
}


// ==========================================================================
// 15. INITIALIZATION & BINDINGS
// ==========================================================================
function initApp() {
  // PWA & Theme
  initPWA();
  initTheme();
  
  // Catalog Data
  loadCatalog();

  // Core Sidebar Buttons
  menuTrigger.addEventListener('click', () => toggleSidebar());
  sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search Input Binding (With Debounce)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderMediaGrid();
    }, 250);
  });

  // Editor Actions
  openEditorBtn.addEventListener('click', openJsonEditor);
  closeEditorBtn.addEventListener('click', closeJsonEditor);
  editorFormatBtn.addEventListener('click', formatJson);
  editorCopyBtn.addEventListener('click', copyJson);
  editorApplyBtn.addEventListener('click', applyJsonChanges);
  
  reloadJsonBtn.addEventListener('click', () => {
    if (confirm('Discard changes in browser memory and reload data.json from the repository?')) {
      localStorage.removeItem('cmm-custom-catalog');
      loadCatalog();
    }
  });

  // Player Actions
  closePlayerBtn.addEventListener('click', closeMediaViewer);
  playerModal.addEventListener('click', (e) => {
    // Close if clicked backdrop (outside the player container or meta footer)
    if (e.target === playerModal) closeMediaViewer();
  });

  // Cloud Providers Modal Actions
  const openProvidersBtn = document.getElementById('openProvidersBtn');
  const closeProvidersBtn = document.getElementById('closeProvidersBtn');
  const providersModal = document.getElementById('providersModal');
  
  if (openProvidersBtn) openProvidersBtn.addEventListener('click', openProvidersModal);
  if (closeProvidersBtn) closeProvidersBtn.addEventListener('click', closeProvidersModal);
  if (providersModal) {
    providersModal.addEventListener('click', (e) => {
      if (e.target === providersModal) closeProvidersModal();
    });
  }

  // Bind custom video controls once
  bindVideoControlListeners();
  
  // Bind shortcuts
  bindKeyboardShortcuts();
  
  console.log('[App Init] Cloud Media Manager initialized successfully.');
}

// Kickstart App
document.addEventListener('DOMContentLoaded', initApp);
