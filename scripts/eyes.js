const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// 🔊 Load selection sound
const selectSound = new Audio('sounds/tak beat.mp3'); // Make sure the path is correct

// Initialize MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

// State variables
let blinkCooldown = false;
let lastHoveredCard = null;

// Main tracking logic
faceMesh.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    // Get iris position
    const iris = landmarks[468];
    const x = (1 - iris.x) * canvasElement.width;
    const y = iris.y * canvasElement.height;

    // Draw red dot
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'red';
    canvasCtx.fill();

    // Auto-scroll if looking down
    const bottomThreshold = window.innerHeight * 0.9;
    if (y >= bottomThreshold) {
      window.scrollBy({ top: 10, behavior: "smooth" });
    }

    // App hover detection
    const cards = document.querySelectorAll(".app-card");
    lastHoveredCard = null;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const isHovered = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (isHovered) {
        card.classList.add("highlight");
        lastHoveredCard = card;
      } else {
        card.classList.remove("highlight");
      }
    });

    // Blink detection
    const upperLid = landmarks[159];
    const lowerLid = landmarks[145];
    const blinkDistance = Math.abs(upperLid.y - lowerLid.y);

    if (blinkDistance < 0.025 && !blinkCooldown && lastHoveredCard) {
      blinkCooldown = true;

      // ✅ Draw confirmation ring
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 20, 0, 2 * Math.PI);
      canvasCtx.strokeStyle = 'lime';
      canvasCtx.lineWidth = 3;
      canvasCtx.stroke();

      // ✅ Play selection sound
      selectSound.play();

      // ✅ Open app after 800ms delay
      const url = lastHoveredCard.getAttribute('href');
      if (url) {
        setTimeout(() => {
          window.location.href = url;
        }, 800);
      }

      // Reset blink cooldown after 1 sec
      setTimeout(() => {
        blinkCooldown = false;
      }, 1000);
    }
  }
});

// Start the camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();


