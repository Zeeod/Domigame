
import wave
import struct
import math
import os

SAMPLE_RATE = 44100

def generate_tone(file_path, duration_sec, freq_func, volume=0.5):
    num_samples = int(duration_sec * SAMPLE_RATE)
    with wave.open(file_path, 'w') as f:
        f.setnchannels(1)  # Mono
        f.setsampwidth(2)  # 16-bit
        f.setframerate(SAMPLE_RATE)
        
        for i in range(num_samples):
            t = float(i) / SAMPLE_RATE
            freq = freq_func(t)
            # Sine wave
            sample = math.sin(2.0 * math.pi * freq * t)
            # Apply volume and envelope (simple fade out)
            envelope = 1.0 - (t / duration_sec)
            sample *= volume * envelope
            
            f.writeframesraw(struct.pack('<h', int(sample * 32767)))

def generate_noise(file_path, duration_sec, volume=0.3):
    import random
    num_samples = int(duration_sec * SAMPLE_RATE)
    with wave.open(file_path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        
        for i in range(num_samples):
            # Random noise
            sample = random.uniform(-1, 1)
            # Envelope
            t = float(i) / SAMPLE_RATE
            envelope = 1.0 - (t / duration_sec)
            sample *= volume * envelope
            
            f.writeframesraw(struct.pack('<h', int(sample * 32767)))

output_dir = "d:/Jeux/Developpement/Dominion/client/public/sounds"
os.makedirs(output_dir, exist_ok=True)

print("Generating sound effects...")

# 1. Click- short high beep
generate_tone(os.path.join(output_dir, "click.wav"), 0.05, lambda t: 1000, volume=0.2)

# 2. Card Play - short flutter
generate_tone(os.path.join(output_dir, "card_play.wav"), 0.15, lambda t: 400 + 400 * math.sin(t * 50), volume=0.3)

# 3. Card Gain - rising tone
generate_tone(os.path.join(output_dir, "card_gain.wav"), 0.3, lambda t: 200 + 800 * (t/0.3), volume=0.4)

# 4. Shuffle - noise
generate_noise(os.path.join(output_dir, "shuffle.wav"), 0.5, volume=0.2)

# 5. Coins - jingling tones
def coins_freq(t):
    return 1500 if (int(t * 20) % 2 == 0) else 1200
generate_tone(os.path.join(output_dir, "coins.wav"), 0.4, coins_freq, volume=0.3)

# 6. Turn Start - bell tone
def turn_freq(t):
    return 880 # A5
generate_tone(os.path.join(output_dir, "turn_start.wav"), 0.8, turn_freq, volume=0.4)

# 7. Error - low buzz
generate_tone(os.path.join(output_dir, "error.wav"), 0.3, lambda t: 100 + 50 * math.sin(t * 200), volume=0.3)

# 8. Success - rising melodic
generate_tone(os.path.join(output_dir, "success.wav"), 0.5, lambda t: 440 * (1 + int(t * 8) / 8), volume=0.4)

print("Done! Sounds generated in", output_dir)
