# AI-Powered Rock Paper Scissors Game

An interactive web-based Rock Paper Scissors game that uses AI and hand gesture recognition to play against an intelligent AI opponent.

| Demo | Blog|
|------|-----|
|[![rps-demo](https://i9.ytimg.com/vi/ZVLuXoJ_iG0/mqdefault.jpg?sqp=CJCw8sAG-oaymwEmCMACELQB8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgTShKMA8=&rs=AOn4CLDiErNeFLfB-EEsLRSJZ-tKsVvwmA)](https://youtu.be/ZVLuXoJ_iG0?si=UIvit-7FHzuul6qZ)|[![rps-blog](https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fz63u9g1bc9k2gwtwjeph.png)](https://dev.to/abhinav-writes/building-rock-paper-scissors-game-with-ai-by-amazon-q-30pe)|

## Features

- Real-time hand gesture recognition using your webcam
- AI opponent that adapts to your playing patterns
- Visual feedback with confidence scoring
- Sleek, responsive UI with real-time scoring

## Technologies Used

- HTML5, CSS3, and JavaScript
- TensorFlow.js and MediaPipe Hands for hand gesture recognition
- Google Gemini API for intelligent AI opponent responses
- Canvas API for real-time drawing and visualization

## Prerequisites

- Google Gemini API key

## Setup and Installation

1. Clone this repository:
   ```
   git clone https://github.com/abhinavthedev/rock-paper-scissors.git
   cd rock-paper-scissors
   ```

2. **Important**: Add your Google Gemini API key
   - Open `script.js` and at Line 30.
   - Replace it with your own API key: `const YOUR_API_KEY = 'YOUR_ACTUAL_API_KEY';`

3. Serve the project using a local web server:
   - copy the path of index.html in your web browser.
   - Or use extensions like Live Server in VS Code

- Now, your application will be running on browser.

## How to Play

1. Allow webcam access when prompted
2. Click the "Start Game" button
3. Follow the countdown (Rock, Paper, Scissors, Go!)
4. Show your hand gesture to the webcam
5. Hold your gesture steady until it's recognized (3 consecutive detections)
6. See the AI's move and the round result
7. Click "Play Again" to start a new round

## Project Structure

```
rock-paper-scissors/
----- index.html - Main HTML structure
----- styles.css - CSS styling
----- script.js  - Game logic and AI implementation
----- assets/    - Images and resources
```
## Troubleshooting

- **Webcam not working**: Ensure you've granted camera permissions in your browser
- **Hand detection issues**: Make sure you have good lighting and your hand is clearly visible
- **API errors**: Verify your API key is correct and has the necessary permissions
- **Performance issues**: Try closing other applications or tabs that might be using your webcam

## Credits

- Developed by Abhinav using Amazon Q Developer
- Hand gesture recognition powered by TensorFlow.js and MediaPipe
- AI opponent powered by Google Gemini API

## License

This project is licensed under the MIT License - see the LICENSE file for details.