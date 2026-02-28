
// Geometric gesture recognition for control commands
// Indices for landmarks
const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_IP = 3;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_DIP = 7;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_DIP = 11;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_DIP = 15;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_DIP = 19;
const PINKY_TIP = 20;

const FINGER_TIPS = [8, 12, 16, 20];
const FINGER_PIPS = [6, 10, 14, 18];

const getCoord = (p, index, prop) => {
    if (typeof p[index] === 'number') return p[index];
    if (p[prop] !== undefined) return p[prop];
    return 0;
};

// Helper to calculate distance
const dist = (p1, p2) => {
    const x1 = getCoord(p1, 0, 'x');
    const y1 = getCoord(p1, 1, 'y');
    const z1 = getCoord(p1, 2, 'z');

    const x2 = getCoord(p2, 0, 'x');
    const y2 = getCoord(p2, 1, 'y');
    const z2 = getCoord(p2, 2, 'z');

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
};

export const detectControlGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Check if fingers are extended from the palm
    // We compare distance of Tip to Wrist vs PIP to Wrist to detect curled fingers
    // Or simpler: TIP is lower than PIP (in y-axis) for upright hand? 
    // But hand orientation varies.
    // robust method: Distance from Wrist. Extended finger tip is usually further from wrist than MCP.

    // Helper to get coords inside function scope if needed, or just use getCoord
    const getY = (idx) => getCoord(landmarks[idx], 1, 'y');
    const getX = (idx) => getCoord(landmarks[idx], 0, 'x');

    const wrist = landmarks[WRIST];

    // Check extension status of each finger (Index to Pinky)
    let extendedFingers = 0;

    // Index
    if (dist(landmarks[INDEX_TIP], wrist) > dist(landmarks[INDEX_MCP], wrist) * 1.3) extendedFingers++;
    // Middle
    if (dist(landmarks[MIDDLE_TIP], wrist) > dist(landmarks[MIDDLE_MCP], wrist) * 1.3) extendedFingers++;
    // Ring
    if (dist(landmarks[RING_TIP], wrist) > dist(landmarks[RING_MCP], wrist) * 1.3) extendedFingers++;
    // Pinky
    if (dist(landmarks[PINKY_TIP], wrist) > dist(landmarks[PINKY_MCP], wrist) * 1.3) extendedFingers++;

    // Thumb status
    // Thumb is tricky. "Thumbs Up" usually means Thumb Tip is highest point (low Y value) 
    // and other fingers are curled.

    const thumbExtended = dist(landmarks[THUMB_TIP], landmarks[PINKY_MCP]) > dist(landmarks[THUMB_MCP], landmarks[PINKY_MCP]);
    // Better check for Thumbs Up: Thumb Tip y < Wrist y (if hand upright) and fingers curled.

    const isCurled = extendedFingers === 0;

    // Get Y coords (assuming standard video coordinates where 0 is top)
    const thumbTipY = getY(THUMB_TIP);
    const indexMcpY = getY(INDEX_MCP);
    const wristY = getY(WRIST);

    // THUMBS UP DETECTION
    // 1. All fingers (Index-Pinky) curled
    // 2. Thumb is extended upward (Tip Y < MCP Y) or just generally up
    if (isCurled) {
        // Check thumb pointing UP
        // Thumb tip should be significantly higher (lower Y) than wrist and index MCP
        if (thumbTipY < indexMcpY && thumbTipY < wristY) {
            return "THUMBS_UP";
        }
    }

    // OPEN PALM DETECTION
    // All 4 fingers extended + Thumb extended
    if (extendedFingers >= 4) {
        return "OPEN_PALM";
    }

    return null;
};
