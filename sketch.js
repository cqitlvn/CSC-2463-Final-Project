let gameState = "menu";
let notes = [];
let lanes = ['D', 'F', 'J', 'K'];
let laneX = [100, 200, 300, 400];
let noteSpeed = 3.2;
let score = 0;
let streak = 0;
let missStreak = 0;
let health = 100;
const maxHealth = 100;
let timerStart;
let hitBuffer = 50;
let nextSpawnTime = 0;
let lastUsedLanes = [];
let noteHits = 0;

let synthMelody, synthBass, synthGameOver;

let chordIndex = 0;

let port;
let connectButton;

let shineSFX, wrongSFX;

const chords = [
  { bass: 98.00, notes: [932.33, 587.33, 698.46, 880.00] },
  { bass: 65.41, notes: [932.33, 587.33, 659.26, 880.00] },
  { bass: 98.00, notes: [932.33, 587.33, 698.46, 880.00] },
  { bass: 65.41, notes: [932.33, 587.33, 659.26, 880.00] },
  { bass: 82.41, notes: [880.00, 523.25, 659.26, 783.99] },
  { bass: 116.54, notes: [880.00, 523.25, 587.33, 783.99] },
  { bass: 82.41, notes: [880.00, 523.25, 659.26, 783.99] },
  { bass: 73.42, notes: [523.25, 622.25, 739.99, 932.33] }
];

function preload() {
  shineSFX = new Tone.Player("shine.mp3").toDestination();
  wrongSFX = new Tone.Player("wrong.mp3").toDestination();
}


function setup() {
  createCanvas(500, 600);
  textAlign(CENTER, CENTER);
  textFont('Georgia');
  noStroke();

  if (typeof Tone === 'undefined') {
    console.error("Tone.js not loaded. Ensure the script is correctly included.");
    return;
  }

  synthMelody = new Tone.PolySynth(Tone.AMSynth, {
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.5,
      release: 1
    }
  }).toDestination();  
  synthBass = new Tone.FMSynth({
    modulationIndex: 5,
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
      release: 0.9
    }
  }).toDestination();

  synthGameOver = new Tone.Synth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.4 }
  }).toDestination();

  shineSFX = new Tone.Player("shine.mp3").toDestination();
  wrongSFX = new Tone.Player("wrong.mp3").toDestination();

  const reverb = new Tone.Reverb({ decay: 3, preDelay: 0.2 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();

synthMelody.connect(reverb);
synthBass.connect(delay);

const lfo = new Tone.LFO("4n", 200, 1200).start();
const autoFilter = new Tone.Filter(800, "lowpass").toDestination();
lfo.connect(autoFilter.frequency);

shineSFX.disconnect();
shineSFX.connect(autoFilter);

const chordSequence = new Tone.Sequence(
  (time, note) => {
    synthMelody.triggerAttackRelease(note, "8n", time);
  },
  ["C4", "E4", "G4", "B4"],
  "4n"
).start(0);

// Metronome with audible click
const metClick = new Tone.MembraneSynth().toDestination();
const metronome = new Tone.Loop((time) => {
  metClick.triggerAttackRelease("C2", "16n", time);
}, "4n").start(0);

// Serial setup
port = createSerial();
connectButton = createButton('Connect to Arduino');
connectButton.position(10, height + 10);
connectButton.mousePressed(connectToSerial);

}



function connectToSerial() {
  port.open("Arduino", 9600);
}

function draw() {
  if (gameState === "menu") drawMenu();
  else if (gameState === "play") drawGame();
  else if (gameState === "gameOver") drawGameOver();

  if (port && port.available()) {
    let input = port.readUntil("\n").trim();
    if (gameState === "gameOver" && input === "M") {
      gameState = "menu";
    } else if (gameState === "play") {
      if (input === "BTN0") handleKeyPress('D');
      else if (input === "BTN1") handleKeyPress('F');
      else if (input === "BTN2") handleKeyPress('J');
      else if (input === "BTN3") handleKeyPress('K');
    }
  }
}


function drawMenu() {
  setGradient(0, 0, width, height, color(255, 200, 220), color(255, 240, 250), 'Y');
  drawPattern();
  drawBorder();
  fill(255, 255, 255, 200);
  stroke(255, 180, 210);
  strokeWeight(3);
  rect(width / 2 - 180, height / 4 - 40, 360, 100, 20);
  noStroke();
  fill(255, 120, 180);
  textSize(48);
  text("✿ Petal Pulse! ✿", width / 2, height / 4 + 10);
  textSize(24);
  drawButton("Play", width / 2, height / 2 + 40);
}

function drawButton(label, x, y) {
  fill(255, 240, 250);
  stroke(255, 170, 200);
  strokeWeight(3);
  rect(x - 100, y - 25, 200, 50, 30);
  noStroke();
  fill(120, 40, 80);
  textSize(20);
  text(label, x, y);
}

function drawGameOver() {
  setGradient(0, 0, width, height, color(255, 240, 250), color(255, 200, 210), 'Y');
  drawPattern();
  drawBorder();

  fill(255, 255, 255, 220);
  stroke(255, 180, 210);
  strokeWeight(4);
  rect(width / 2 - 180, height / 3 - 60, 360, 270, 30);

  noStroke();
  fill(120, 40, 80);
  textSize(52);
  text("Game Over!", width / 2, height / 3);
  textSize(26);
  fill(100, 30, 70);
  text(`Final Score: ${score}`, width / 2, height / 2);
  text("Press button to \nreturn to menu", width / 2, height / 2 + 60);
}

function drawBorder() {
  noFill();
  stroke(255, 160, 200);
  strokeWeight(8);
  rect(5, 5, width - 10, height - 10, 20);
}

function drawPattern() {
  for (let i = 0; i < width; i += 60) {
    for (let j = 0; j < height; j += 60) {
      push();
      translate(i + 15, j + 15);
      noStroke();
      fill(255, 250, 250, 100);
      for (let a = 0; a < 6; a++) {
        ellipse(0, 8, 6, 12);
        rotate(PI / 3);
      }
      fill(255, 255, 200, 80);
      ellipse(0, 0, 6);
      pop();
    }
  }
}

function drawGame() {
  setGradient(0, 0, width, height, color(255, 240, 250), color(255, 200, 210), 'Y');
  drawPattern();
  drawBorder();

  const hitZoneY = height - 100;
  let elapsed = floor((millis() - timerStart) / 1000);
  let progress = constrain(elapsed / 60, 0, 1);
  noteSpeed = 3.2 + progress * 5;

  fill(255, 240, 250, 180);
  stroke(255, 180, 210);
  strokeWeight(4);
  rect(80, hitZoneY - 20, 390, 65, 20);

  for (let i = 0; i < 4; i++) {
    fill(255, 180, 210);
    noStroke();
    rect(laneX[i], hitZoneY, 50, 12, 8);
    textSize(20);
    textStyle(BOLD);
    fill(80, 20, 50);
    text(lanes[i], laneX[i] + 25, hitZoneY + 30);
  }

  for (let i = notes.length - 1; i >= 0; i--) {
    let note = notes[i];
    note.update();
    note.display();
    if (note.y > height + 5) {
      notes.splice(i, 1);
      streak = 0;
      missStreak++;
      score = max(0, score - 50);
      health -= missStreak * 5;
      health = constrain(health, 0, maxHealth);
      if (port.opened) port.write("R\n");
      wrongSFX.start();
    }
  }

  fill(120, 40, 80);
  textSize(18);
  text(`Score: ${score}`, 70, 30);
  text(`Streak: ${streak}`, 70, 55);
  text(`Health`, width - 70, 30);
  noStroke();
  fill(255, 200, 210);
  rect(width - 150, 50, 100, 20, 10);
  fill(255, 120, 140);
  rect(width - 150, 50, health, 20, 10);
  stroke(255);
  noFill();
  rect(width - 150, 50, 100, 20, 10);

  if (streak >= 50) {
    textSize(48);
    fill(255, 215, 0);
    text("x" + streak, width / 2, 50);
  }

  if (millis() >= nextSpawnTime) {
    spawnNote();
    let minSpawn = lerp(400, 100, progress);
    let maxSpawn = lerp(1200, 300, progress);
    nextSpawnTime = millis() + random(minSpawn, maxSpawn);
  }

  if (health <= 0) {
    gameState = "gameOver";
    playGameOverSound();
  }

  if (health <= maxHealth * 0.50) {
    let alpha = map(sin(millis() / 100), -1, 1, 50, 150);
    noStroke();
    fill(255, 0, 0, alpha);
    rect(0, 0, width, height);
  }
}

function playGameOverSound() {
  if (Tone.context.state !== "running") Tone.start();
  const freqs = [330, 220, 165, 110];
  const now = Tone.now();
  freqs.forEach((freq, i) => {
    synthGameOver.triggerAttackRelease(freq, "16n", now + i * 0.3);
  });
}

function keyPressed() {
  if (gameState === "play") {
    handleKeyPress(key.toUpperCase());
  } else if (gameState === "gameOver" && key.toUpperCase() === 'M') {
    gameState = "menu";
  }
}

function handleKeyPress(simulatedKey) {
  const hitZoneY = height - 100;
  let keyMatchedNote = false;

  for (let i = notes.length - 1; i >= 0; i--) {
    let note = notes[i];
    if (simulatedKey === lanes[note.lane]) {
      if (abs(note.y - hitZoneY) < hitBuffer) {
        notes.splice(i, 1);
        streak++;
        missStreak = 0;
        let multiplier = 1 + floor(streak / 10);
        score += 100 * multiplier;
        health += 2;
        health = constrain(health, 0, maxHealth);
        if (streak === 50) shineSFX.start();
        playNoteWithBass(note.lane);
        noteHits++;
        if (noteHits >= 8) {
          chordIndex = (chordIndex + 1) % chords.length;
          noteHits = 0;
        }
        keyMatchedNote = true;
        break;
      }
    }
  }

  if (!keyMatchedNote) {
    streak = 0;
    missStreak++;
    score = max(0, score - 50);
    health -= missStreak * 3;
    health = constrain(health, 0, maxHealth);
    port.write("R\n");
    wrongSFX.start();
  }
}


function playNoteWithBass(lane) {
  if (Tone.context.state !== "running") Tone.start();
  let chord = chords[chordIndex];
  let now = Tone.now();
  synthMelody.triggerAttackRelease(chord.notes[lane], "8n", now);
  synthBass.triggerAttackRelease(chord.bass, "8n", now);
}

function mousePressed() {
  if (gameState === "menu") {
    if (
      mouseX > width / 2 - 100 &&
      mouseX < width / 2 + 100 &&
      mouseY > height / 2 + 15 &&
      mouseY < height / 2 + 65
    ) {
      startGame();
    }
  }
}

function startGame() {
  gameState = "play";
  notes = [];
  score = 0;
  streak = 0;
  health = maxHealth;
  missStreak = 0;
  noteHits = 0;
  chordIndex = 0;
  timerStart = millis();
  nextSpawnTime = millis() + random(400, 1200);
}

function spawnNote() {
  let shouldDouble = random(1) < 0.18;
  let availableLanes = [0, 1, 2, 3].filter(l => !lastUsedLanes.includes(l));
  if (availableLanes.length === 0) availableLanes = [0, 1, 2, 3];
  let lane1 = floor(random(availableLanes));
  notes.push(new Note(lane1));
  lastUsedLanes = [lane1];
  if (shouldDouble) {
    let remaining = [0, 1, 2, 3].filter(l => l !== lane1);
    let lane2 = floor(random(remaining));
    notes.push(new Note(lane2));
    lastUsedLanes.push(lane2);
  }
}

class Note {
  constructor(lane) {
    this.lane = lane;
    this.x = laneX[lane] + 25;
    this.y = 0;
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(0.02, 0.05);
  }

  update() {
    this.y += noteSpeed;
    this.rotation += this.rotationSpeed;
  }

  display() {
    const hitZoneY = height - 100;
    const inHitZone = abs(this.y - hitZoneY) < hitBuffer;
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    angleMode(RADIANS);

    let petalColor, centerColor, strokeColor;
    let golden = streak >= 50;

    switch (this.lane) {
      case 0:
        petalColor = golden ? color(255, 215, 0) : color(255, 182, 193);
        strokeColor = inHitZone ? color(255) : golden ? color(180, 140, 0) : color(200, 100, 130);
        break;
      case 1:
        petalColor = golden ? color(255, 215, 0) : color(255, 204, 229);
        strokeColor = inHitZone ? color(255) : golden ? color(180, 140, 0) : color(200, 110, 160);
        break;
      case 2:
        petalColor = golden ? color(255, 215, 0) : color(204, 229, 255);
        strokeColor = inHitZone ? color(255) : golden ? color(180, 140, 0) : color(100, 160, 220);
        break;
      case 3:
        petalColor = golden ? color(255, 215, 0) : color(255, 240, 200);
        strokeColor = inHitZone ? color(255) : golden ? color(180, 140, 0) : color(200, 180, 100);
        break;
    }

    centerColor = color(255, 255, 190);

    stroke(strokeColor);
    strokeWeight(2);
    fill(petalColor);

    let petalCount = [6, 8, 10, 12][this.lane];
    let petalW = [12, 14, 10, 10][this.lane];
    let petalH = [24, 24, 22, 22][this.lane];

    for (let i = 0; i < petalCount; i++) {
      ellipse(0, 14, petalW, petalH);
      rotate(TWO_PI / petalCount);
    }

    noStroke();
    fill(centerColor);
    ellipse(0, 0, 14);
    pop();
  }
}

function setGradient(x, y, w, h, c1, c2, axis) {
  noFill();
  if (axis === 'Y') {
    for (let i = y; i <= y + h; i++) {
      let inter = map(i, y, y + h, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x + w, i);
    }
  }
}
