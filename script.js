// DOM Elements
const webcamElement = document.getElementById("webcam");
const canvasElement = document.getElementById("output-canvas");
const canvasCtx = canvasElement.getContext("2d");
const userMoveDisplay = document.getElementById("user-move-display");
const aiMoveDisplay = document.getElementById("ai-move-display");
const aiMoveImg = document.getElementById("ai-move-img");
const displayElement = document.getElementById("display");
const userScoreElement = document.getElementById("user-score");
const aiScoreElement = document.getElementById("ai-score");
const userScoreElement2 = document.getElementById("user-score-2");
const aiScoreElement2 = document.getElementById("ai-score-2");
const startButton = document.getElementById("start-btn");
const playAgainButton = document.getElementById("play-again-btn");

// Game state variables
let detector = null;
let webcamRunning = false;
let userMove = null;
let userMoves = [];
let aiMove = null;
let userScore = 0;
let aiScore = 0;
let countdownTimer = null;
let detectionActive = false;
let lastDetectionTime = 0;
let detectionInterval = null;

// Constants
const YOUR_API_KEY = `YOUR_ACTUAL_API_KEY`;
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${YOUR_API_KEY}`;
const COUNTDOWN_SECONDS = 5;
const MOVES = ["Rock", "Paper", "Scissors"];
const MOVE_IMAGES = {
  Rock: "assets/rock.png",
  Paper: "assets/paper.png",
  Scissors: "assets/scissors.png",
};

const AI_Strategy = [
  {
    name: "random",
    prompt: `Random - pick randomly from Rock, Paper, or Scissors with equal probability.`,
  },
  {
    name: "markov",
    prompt: `Strategy uses a Markov chain to predict the player's next decision based on their previous decisions. For example, if the player tends to play Paper after playing Rock and their last move was Rock, we can guess that Paper is likely their next move.`,
  },
];

function updatePromptText() {
  if (userScore === 0 && aiScore === 0) {
    promptText = `Imagine you're playing rock-paper-scissors with me. Select the character you want to show.
Use the following strategy: ${AI_Strategy[0].prompt}
Answer in one word, i.e. Rock, Paper or Scissors.`;
  } else if (userMoves.length > 1) {
    promptText = `Imagine you're playing rock-paper-scissors with me. Select the character you want to show.
Use the following strategy: ${AI_Strategy[1].prompt}
${
  userMoves.length > 0
    ? `Recent player moves were (from oldest to newest) [${userMoves}]`
    : ``
}
Answer in one word, i.e. Rock, Paper or Scissors.`;
  } else {
    promptText = `Imagine you're playing rock-paper-scissors with me. Select the character you want to show.
Use the following strategy: ${AI_Strategy[0].prompt}
Answer in one word, i.e. Rock, Paper or Scissors.`;
  }
}

// Initialize the application
async function initializeApp() {
  try {
    // Set up event listeners
    startCam();
    startButton.addEventListener("click", startCountdown);
    playAgainButton.style.display = "none";
    playAgainButton.addEventListener("click", resetRound);

    // Initialize TensorFlow.js Hand Detection model
    // displayElement.textContent = 'Loading hand detection model...';

    // Create hand detector using MediaPipe Hands model
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      modelType: "full",
    };

    detector = await handPoseDetection.createDetector(model, detectorConfig);

  } catch (error) {
    console.error("Error initializing app:", error);
    displayElement.textContent = "Error initializing. Please refresh.";
  }
}

// Start the game by enabling webcam
async function startCam() {
  try {
    const constraints = { video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcamElement.srcObject = stream;

    // Wait for the video to be ready
    webcamElement.addEventListener(
      "loadeddata",
      () => {
        // Set canvas dimensions to match video
        canvasElement.width = webcamElement.videoWidth;
        canvasElement.height = webcamElement.videoHeight;

        // Start prediction loop
        webcamRunning = true;

        // Start the prediction loop
        predictWebcam();
      },
      { once: true }
    );
  } catch (error) {
    console.error("Error accessing webcam:", error);
    alert("Error accessing webcam. Please check permissions.");
  }
}

// Start countdown for gesture detection
function startCountdown() {
  const countdownSteps = ["Rock", "Paper", "Scissors", "Go!"];
  let currentStep = 0;
  displayElement.textContent = "Get ready!";
  startButton.textContent = countdownSteps[currentStep];

  // Set initial AI image
  aiMoveImg.src = MOVE_IMAGES[countdownSteps[currentStep]];

  // Use requestAnimationFrame for smoother countdown
  const animateCountdown = () => {
    currentStep++;

    if (currentStep < countdownSteps.length) {
      // Update display text
      startButton.textContent = countdownSteps[currentStep];

      // Update AI image to match countdown step
      aiMoveImg.src = MOVE_IMAGES[countdownSteps[currentStep]];

      countdownTimer = requestAnimationFrame(() => {
        // Wait approximately 700ms before next step
        setTimeout(animateCountdown, 700);
      });
    } else {
      // Start detection immediately
      startDetection();
    }
  };

  // Start the countdown animation after a short delay
  countdownTimer = setTimeout(animateCountdown, 700);
}

// Process webcam frames and detect hand landmarks
async function predictWebcam() {
  if (webcamRunning) {
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the webcam image first
    canvasCtx.drawImage(
      webcamElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    // Continuously detect hands and draw landmarks
    try {
      // Only run detection every 100ms to improve performance
      const now = Date.now();
      if (now - lastDetectionTime > 100) {
        const hands = await detector.estimateHands(webcamElement);
        lastDetectionTime = now;

        if (hands && hands.length > 0) {
          // Draw hand landmarks
          drawHand(hands[0]);
        }
      }
    } catch (error) {
      console.error("Error in hand detection:", error);
    }

    // Continue the detection loop
    window.requestAnimationFrame(predictWebcam);
  }
}

// Start the gesture detection process
function startDetection() {
  detectionActive = true;
  // displayElement.textContent = 'Detecting your gesture...';

  // Start detection interval - check every 200ms for a stable gesture
  let stableGestureCounter = 0;
  let lastDetectedGesture = null;

  detectionInterval = setInterval(async () => {
    try {
      const hands = await detector.estimateHands(webcamElement);

      if (hands.length === 0) {
        userMoveDisplay.textContent = "No hand detected";
        return;
      }

      // Get the gesture
      const gesture = recognizeHandGesture(hands[0]);

      if (!gesture) {
        userMoveDisplay.textContent = "Gesture not recognized";
        return;
      }

      // Check if the same gesture is maintained
      if (gesture === lastDetectedGesture) {
        stableGestureCounter++;
        userMoveDisplay.textContent = `Detected: ${gesture} (${stableGestureCounter}/3)`;

        // If gesture is stable for 3 consecutive checks, confirm it
        if (stableGestureCounter >= 3) {
          clearInterval(detectionInterval);
          confirmUserMove(gesture, hands[0].score);
        }
      } else {
        lastDetectedGesture = gesture;
        stableGestureCounter = 1;
        userMoveDisplay.textContent = `Detected: ${gesture} (1/3)`;
      }
    } catch (error) {
      console.error("Error detecting gesture:", error);
      userMoveDisplay.textContent = "Error in detection";
    }
  }, 200);

  // Set a timeout to stop detection after 5 seconds if no stable gesture is found
  setTimeout(() => {
    if (detectionActive) {
      clearInterval(detectionInterval);
      userMoveDisplay.textContent = "No stable gesture detected";
      displayElement.textContent = "Please try again";
      startButton.style.display = "inline-block";
      startButton.textContent = "Try Again";
      detectionActive = false;
    }
  }, 5000);
}

// Draw hand landmarks on canvas
function drawHand(hand) {
  const keypoints = hand.keypoints;
  const keypoints3D = hand.keypoints3D;

  // Draw keypoints
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    canvasCtx.beginPath();
    canvasCtx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = "red";
    canvasCtx.fill();
  }

  // Draw connections - MediaPipe hand connections
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index finger
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle finger
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring finger
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [0, 17], // Palm
  ];

  for (const connection of connections) {
    const [i, j] = connection;
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    canvasCtx.beginPath();
    canvasCtx.moveTo(kp1.x, kp1.y);
    canvasCtx.lineTo(kp2.x, kp2.y);
    canvasCtx.strokeStyle = "green";
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
  }
}

// Recognize hand gesture from landmarks
function recognizeHandGesture(hand) {
  const keypoints = hand.keypoints;

  // Helper function to calculate distance between two landmarks
  function distance(kp1, kp2) {
    const dx = kp1.x - kp2.x;
    const dy = kp1.y - kp2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Helper function to check if a finger is extended
  function isFingerExtended(tipIndex, pipIndex, mcpIndex) {
    const tipToMcp = distance(keypoints[tipIndex], keypoints[mcpIndex]);
    const pipToMcp = distance(keypoints[pipIndex], keypoints[mcpIndex]);
    return tipToMcp > pipToMcp * 1.2; // Finger is extended if tip is significantly farther from MCP than PIP
  }

  // Check for Rock (closed fist)
  const indexCurled = !isFingerExtended(8, 6, 5);
  const middleCurled = !isFingerExtended(12, 10, 9);
  const ringCurled = !isFingerExtended(16, 14, 13);
  const pinkyCurled = !isFingerExtended(20, 18, 17);

  if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return "Rock";
  }

  // Check for Paper (open hand)
  const indexExtended = isFingerExtended(8, 6, 5);
  const middleExtended = isFingerExtended(12, 10, 9);
  const ringExtended = isFingerExtended(16, 14, 13);
  const pinkyExtended = isFingerExtended(20, 18, 17);

  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return "Paper";
  }

  // Check for Scissors (index and middle extended, others curled)
  if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
    return "Scissors";
  }

  // No clear gesture detected
  return null;
}

// Confirm user's move and get AI's move
async function confirmUserMove(move, confi) {
  detectionActive = false;
  userMove = move;
  userMoves.push(move);
  userMoveDisplay.innerHTML = `${move} <span>${Math.round(confi * 100)}% confidence</span>`;
  try {
    aiMove = await getAIMove();
    aiMoveDisplay.textContent = aiMove;
    aiMoveImg.src = MOVE_IMAGES[aiMove];

    // Determine winner and update scores
    const result = determineWinner(userMove, aiMove);
    updateScores(result);
    displayResult(result);

    // Enable play again button
    playAgainButton.style.display = "block";
    startButton.style.display = "none";
  } catch (error) {
    console.error("Error getting AI move:", error);
    alert("Error in getting AI move:", error);
    // aiMoveDisplay.textContent = 'Error';
    // displayElement.textContent = 'Error getting AI move. Please try again.';

    // Show the start button again to retry
    startButton.style.display = "inline-block";
    startButton.textContent = "Try Again";
  }
}

// Get AI's move from Gemini API
async function getAIMove() {
  updatePromptText();
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract the AI's move from the response
    let aiResponseText = data.candidates[0].content.parts[0].text.trim();

    // Validate and normalize the response
    for (const move of MOVES) {
      if (aiResponseText.includes(move)) {
        return move;
      }
    }

    // If no valid move found in the response, return a random move
    return MOVES[Math.floor(Math.random() * MOVES.length)];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback to random move if API fails
    alert("Error calling Gemini API:", error);
  }
}

// Determine the winner based on the moves
function determineWinner(userMove, aiMove) {
  if (userMove === aiMove) {
    return "tie";
  } else if (
    (userMove === "Rock" && aiMove === "Scissors") ||
    (userMove === "Paper" && aiMove === "Rock") ||
    (userMove === "Scissors" && aiMove === "Paper")
  ) {
    return "user";
  } else {
    return "ai";
  }
}

// Update scores based on the result
function updateScores(result) {
  if (result === "user") {
    userScore++;
    userScoreElement.textContent = userScore;
    if (userScoreElement2) {
      userScoreElement2.textContent = userScore;
    }
  } else if (result === "ai") {
    aiScore++;
    aiScoreElement.textContent = aiScore;
    if (aiScoreElement2) {
      aiScoreElement2.textContent = aiScore;
    }
  }
}

// Display the result of the round
function displayResult(result) {
  if (result === "user") {
    displayElement.textContent = "You Win!";
    displayElement.className = "display win";
  } else if (result === "ai") {
    displayElement.textContent = "AI Wins!";
    displayElement.className = "display lose";
  } else {
    displayElement.textContent = "It's a Tie!";
    displayElement.className = "display tie";
  }
}

// Reset for a new round
function resetRound() {
  // Cancel any existing countdown or detection
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    cancelAnimationFrame(countdownTimer);
  }

  if (detectionInterval) {
    clearInterval(detectionInterval);
  }

  userMove = null;
  aiMove = null;

  // Reset displays
  aiMoveImg.src = "./assets/horns2.png";
  aiMoveImg.style.width = "30%";
  aiMoveImg.style.transform = "rotate(0deg)";

  displayElement.textContent = "Let's play!";
  displayElement.className = "display";

  playAgainButton.style.display = "none";
  startButton.style.display = "block";

  // Small delay before starting countdown to ensure UI updates
  setTimeout(() => {
    startCountdown();
  }, 100);
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", initializeApp);
