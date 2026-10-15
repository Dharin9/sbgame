# Shadowbox

Two-player online game. One player boxes, the other dodges. Pick a direction within 5 seconds;
three matches in a row knocks the dodger out.

## Run locally
```
npm install
npm start
```
Open http://localhost:3000 in two browser tabs (or two devices on the same network using your
computer's IP). Create a room in one, join with the 5-letter code in the other.

Controls: arrow keys on laptop, swipes on phone.

## Deploy
The server serves the page and the WebSocket on one port, so deploy it as a single Node app
(Render, Railway, Fly.io, etc.): build command `npm install`, start command `npm start`.
HTTPS hosts work automatically (the client switches to wss://).

GitHub Pages alone won't work, because the relay server needs to run somewhere.
