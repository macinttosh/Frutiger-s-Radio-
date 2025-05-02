// --- Theme Settings ---
const themes = {
    light: {
        playlistId: "PLxth3-aqDbCyBcWC6tv5Vk5pLlMCHYoLo",
        buttonText: "Dark Theme"
    },
    dark: {
        playlistId: "PLpoYz7tii_gj5EA1RV99A9ZOR4OD5W0LS",
        buttonText: "Light Theme"
    }
};

// --- Global Variables ---
let player;
let currentTheme = "light"; // Initial theme
let isPlaying = false;
let bootScreenTimeout; // To manage boot screen duration
let isMinimized = false; // Track player minimize state

// --- UI Elements ---
const bodyElement = document.body;
const bootScreen = document.getElementById("boot-screen");
const mainContent = document.getElementById("main-content");
const radioContainer = document.querySelector(".radio-container"); 
const playerUi = document.querySelector(".player-ui"); // Get player UI for minimize
const thumbnailElement = document.getElementById("thumbnail");
const titleElement = document.getElementById("track-title");
const artistElement = document.getElementById("artist-channel");
const playPauseButton = document.getElementById("play-pause-button");
const skipButton = document.getElementById("skip-button");
const volumeSlider = document.getElementById("volume-slider");
const themeToggleButton = document.getElementById("theme-toggle-button");
const cornerGif = document.getElementById("corner-gif");
const minimizeButton = document.getElementById("minimize-button");
const resizeButton = document.getElementById("resize-button");

// --- Boot Screen Logic ---
function finishBoot() {
    if (bootScreen) {
        bootScreen.style.opacity = "0";
        setTimeout(() => {
            bootScreen.style.display = "none";
            if (mainContent) {
                mainContent.style.display = "flex"; // Use flex for centering
                setTimeout(() => { mainContent.style.opacity = "1"; }, 50); 
            }
            loadYouTubeAPI();
        }, 500); 
    }
}

const bootDuration = 3000; 
bootScreenTimeout = setTimeout(finishBoot, bootDuration);

if (bootScreen) {
    bootScreen.addEventListener("click", () => {
        clearTimeout(bootScreenTimeout);
        finishBoot();
    });
}

// --- YouTube API Loading (Delayed) ---
function loadYouTubeAPI() {
    if (!document.querySelector("script[src=\"https://www.youtube.com/iframe_api\"]")) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
        console.log("YouTube API script added.");
    } else {
        if (typeof YT !== "undefined" && typeof YT.Player !== "undefined") {
            onYouTubeIframeAPIReady();
        } else {
            console.log("API script exists, waiting for onYouTubeIframeAPIReady...");
        }
    }
}

// --- YouTube Player Functions ---
function onYouTubeIframeAPIReady() {
    console.log("YouTube API ready.");
    if (!player) {
        player = new YT.Player("youtube-player", {
            height: "0",
            width: "0",
            playerVars: {
                listType: "playlist",
                list: themes[currentTheme].playlistId,
                autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1
            },
            events: {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange,
                "onError": onPlayerError
            }
        });
    }
}

function onPlayerReady(event) {
    console.log("Player ready.");
    player.setVolume(volumeSlider.value);
    player.setShuffle(true);
    player.cuePlaylist({ listType: "playlist", list: themes[currentTheme].playlistId });
    setTimeout(updateMetadata, 1500);
    themeToggleButton.textContent = themes[currentTheme].buttonText;
    bodyElement.classList.add("light-theme");
    if (radioContainer) radioContainer.classList.add("fade-in"); 
}

function onPlayerStateChange(event) {
    console.log("Player State Changed: ", event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playPauseButton.textContent = "Pause";
        updateMetadata();
        if (radioContainer) radioContainer.classList.add("fade-in");
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        playPauseButton.textContent = "Play";
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("State: ENDED - Track ended, playing next random.");
    } else if (event.data == YT.PlayerState.CUED) {
        updateMetadata();
        if (radioContainer) radioContainer.classList.add("fade-in");
    } else {
        console.log("State: Other (", event.data, ")");
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error: ", event.data);
    showError("Error loading video, skipping...");
    setTimeout(() => {
        if (player && typeof player.nextVideo === "function") {
            player.nextVideo();
        }
    }, 1500);
}

function updateMetadata() {
    if (!player || typeof player.getVideoData !== "function" || typeof player.getPlayerState !== "function") {
        titleElement.textContent = "Loading..."; artistElement.textContent = "..."; thumbnailElement.src = ""; return;
    }
    const playerState = player.getPlayerState();
    if (playerState === YT.PlayerState.UNSTARTED || playerState === -1) {
        titleElement.textContent = "Loading..."; artistElement.textContent = "..."; thumbnailElement.src = ""; return;
    }
    const videoData = player.getVideoData();
    if (videoData && videoData.title) {
        let trackTitle = videoData.title;
        let artistName = videoData.author;
        const titleParts = trackTitle.split(" - ");
        if (titleParts.length >= 2 && titleParts[0].length < 40 && !titleParts[0].toLowerCase().includes("playlist")) {
            artistName = titleParts[0].trim();
            trackTitle = titleParts.slice(1).join(" - ").trim();
        }
        titleElement.textContent = trackTitle; titleElement.title = trackTitle;
        artistElement.textContent = artistName; artistElement.title = artistName;
        if (videoData.video_id) {
            thumbnailElement.src = `https://img.youtube.com/vi/${videoData.video_id}/hqdefault.jpg`;
            thumbnailElement.alt = `Thumbnail for ${trackTitle}`;
        } else {
             thumbnailElement.src = ""; thumbnailElement.alt = "Track thumbnail";
        }
    } else {
        titleElement.textContent = "Info Unavailable"; artistElement.textContent = "..."; thumbnailElement.src = "";
    }
}

function showError(message) {
    titleElement.textContent = message; artistElement.textContent = "";
    setTimeout(updateMetadata, 3000);
}

// --- Theme Switching Functionality ---
function toggleTheme() {
    if (!radioContainer) return;
    radioContainer.classList.remove("fade-in");
    radioContainer.classList.add("fade-out");
    setTimeout(() => {
        currentTheme = (currentTheme === "light") ? "dark" : "light";
        bodyElement.classList.toggle("dark-theme");
        bodyElement.classList.toggle("light-theme");
        themeToggleButton.textContent = themes[currentTheme].buttonText;
        const newPlaylistId = themes[currentTheme].playlistId;
        if (player && typeof player.loadPlaylist === "function") {
            if (typeof player.stopVideo === "function") player.stopVideo();
            if (isPlaying) player.loadPlaylist({ listType: "playlist", list: newPlaylistId });
            else player.cuePlaylist({ listType: "playlist", list: newPlaylistId });
        } else {
             radioContainer.classList.remove("fade-out");
             radioContainer.classList.add("fade-in");
        }
    }, 300);
}

// --- Player Minimize/Resize Functionality ---
function toggleMinimize() {
    if (!radioContainer || !playerUi) return;
    isMinimized = !isMinimized;
    radioContainer.classList.toggle("minimized", isMinimized);
    playerUi.style.display = isMinimized ? "none" : "flex";
    // Optionally change resize button icon/label
    if (resizeButton) resizeButton.innerHTML = isMinimized ? "&#x25A1;" : "&#x25A1;"; // Simple square for both states for now
    console.log(`Player ${isMinimized ? "minimized" : "restored"}`);
}

// --- Event Listeners ---
playPauseButton.addEventListener("click", () => {
    if (!player || typeof player.playVideo !== "function") return;
    const currentState = player.getPlayerState();
    if (currentState === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
});

skipButton.addEventListener("click", () => {
    if (!player || typeof player.nextVideo !== "function") return;
    player.nextVideo();
});

volumeSlider.addEventListener("input", (e) => {
    if (!player || typeof player.setVolume !== "function") return;
    player.setVolume(e.target.value);
});

themeToggleButton.addEventListener("click", toggleTheme);

// Add listeners for new window controls
if (minimizeButton) {
    minimizeButton.addEventListener("click", toggleMinimize);
}
if (resizeButton) {
    // For now, resize button also acts as restore from minimized state
    resizeButton.addEventListener("click", toggleMinimize); 
}

// Initialization: Boot screen logic runs first, then calls loadYouTubeAPI.

