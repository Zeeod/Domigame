
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, durationSec, bufferFunc) {
    const numSamples = Math.floor(durationSec * SAMPLE_RATE);
    const byteDepth = 2; // 16-bit
    const dataSize = numSamples * byteDepth;
    const buffer = Buffer.alloc(44 + dataSize);

    // Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * byteDepth, 28);
    buffer.writeUInt16LE(byteDepth, 32);
    buffer.writeUInt16LE(byteDepth * 8, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        let sample = bufferFunc(t, durationSec);
        // Clamp
        sample = Math.max(-1, Math.min(1, sample));
        buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
}

const outputDir = "d:/Jeux/Developpement/Dominion/client/public/sounds";
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log("Generating sounds in Node.js...");

// 1. Click
writeWav(path.join(outputDir, "click.wav"), 0.05, (t) => 0.2 * Math.sin(2 * Math.PI * 1000 * t) * (1 - t / 0.05));

// 2. Card Play
writeWav(path.join(outputDir, "card_play.wav"), 0.15, (t) => 0.3 * Math.sin(2 * Math.PI * (400 + 200 * Math.sin(t * 100)) * t) * (1 - t / 0.15));

// 3. Card Gain
writeWav(path.join(outputDir, "card_gain.wav"), 0.3, (t, dur) => 0.4 * Math.sin(2 * Math.PI * (200 + 800 * (t / dur)) * t) * (1 - t / dur));

// 4. Shuffle (Noise)
writeWav(path.join(outputDir, "shuffle.wav"), 0.5, (t, dur) => 0.2 * (Math.random() * 2 - 1) * (1 - t / dur));

// 5. Coins
writeWav(path.join(outputDir, "coins.wav"), 0.4, (t, dur) => {
    const f = (Math.floor(t * 20) % 2 === 0) ? 1500 : 1200;
    return 0.3 * Math.sin(2 * Math.PI * f * t) * (1 - t / dur);
});

// 6. Turn Start
writeWav(path.join(outputDir, "turn_start.wav"), 0.8, (t, dur) => 0.4 * Math.sin(2 * Math.PI * 880 * t) * (1 - t / dur));

// 7. Error
writeWav(path.join(outputDir, "error.wav"), 0.3, (t, dur) => 0.3 * Math.sin(2 * Math.PI * (100 + 50 * Math.sin(t * 200)) * t) * (1 - t / dur));

// 8. Success
writeWav(path.join(outputDir, "success.wav"), 0.5, (t, dur) => {
    const f = 440 * (1 + Math.floor(t * 8) / 8);
    return 0.4 * Math.sin(2 * Math.PI * f * t) * (1 - t / dur);
});

console.log("Done!");
