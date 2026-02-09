# Eye Focus Tracker

Real-time eye focus detection using MediaPipe Face Landmarker. Tracks your gaze and shows focus level as a percentage.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/shoaibahmedcs/eye-focus-level.git
cd eye-focus-level
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python focus-level.py
```

The face landmarker model will download automatically on first run.

## Usage

- Look at your screen to see your focus level
- Press `q` to quit
- Session summary shows total time and focus percentage

## Requirements

- Python 3.8+
- Webcam
- macOS/Linux/Windows
