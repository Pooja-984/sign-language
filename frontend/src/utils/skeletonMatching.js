// Utility for Skeleton Alignment and Matching (Cosine Similarity)

// Single Hand Alignment (Now purely Translation + Scale, NO Rotation)
export const getAlignedLandmarks = (landmarks) => {
    // Handling both array-of-arrays and array-of-objects formats
    const getX = (p) => typeof p[0] === 'number' ? p[0] : p.x;
    const getY = (p) => typeof p[1] === 'number' ? p[1] : p.y;

    if (!landmarks || landmarks.length < 10) return [];

    const wrist = landmarks[0];
    const wristX = getX(wrist);
    const wristY = getY(wrist);

    // 1. Center at Wrist
    let centered = landmarks.map(p => ({
        x: getX(p) - wristX,
        y: getY(p) - wristY
    }));

    // 2. Scale Normalization (Variable size based on hand size)
    // Use Wrist -> Middle MCP distance as the "unit" scale
    // We intentionally DO NOT ROTATE to preserve orientation information.
    const midMCP = centered[9];
    const scaleRef = Math.sqrt(midMCP.x ** 2 + midMCP.y ** 2) || 1;

    return centered.map(p => ({
        x: p.x / scaleRef,
        y: p.y / scaleRef
    }));
};

// Two-Hand Matching Logic
export const calculateSkeletonMatch = (candidateHands, referenceHands) => {
    // candidateHands: Array[2] of raw landmarks (or null) from live video
    // referenceHands: Array[2] of aligned landmarks (or null) from saved skill

    if (!referenceHands || !Array.isArray(referenceHands)) return -1;

    let totalSim = 0;
    let validChecks = 0;

    for (let i = 0; i < 2; i++) {
        const cand = candidateHands[i]; // Raw landmarks
        // Reference might be stored as aligned points directly.
        // We need to check if referenceHands[i] is valid
        const ref = referenceHands[i];

        if (ref && ref.length > 0) {
            // Reference expects a hand here
            if (!cand) {
                // Candidate missing hand -> Penalty or instant fail? 
                // Let's return 0 similarity for this hand slot.
                return 0;
            }

            // Align candidate
            const alignedCand = getAlignedLandmarks(cand);

            // Flatten candidate to 1D vector
            const flatCand = alignedCand.flatMap(p => [p.x, p.y]);

            // Flatten reference (handle object/array structure)
            const first = ref[0];
            let flatRef = [];
            if (Array.isArray(first)) {
                flatRef = ref.flatMap(p => [p[0], p[1]]);
            } else {
                flatRef = ref.flatMap(p => [p.x, p.y]);
            }

            // Cosine Similarity
            let dotProduct = 0;
            let magA = 0;
            let magB = 0;

            const len = Math.min(flatCand.length, flatRef.length);
            for (let k = 0; k < len; k++) {
                const a = flatCand[k];
                const b = flatRef[k];
                dotProduct += (a * b);
                magA += (a * a);
                magB += (b * b);
            }

            magA = Math.sqrt(magA);
            magB = Math.sqrt(magB);

            if (magA === 0 || magB === 0) {
                // partial sim 0
            } else {
                totalSim += (dotProduct / (magA * magB));
            }
            validChecks++;
        } else {
            // Reference has NO hand here.
            // If candidate DOES have a hand, that's a mismatch (extra hand).
            if (cand) {
                // Strict matching: Extra hand = fail
                return 0;
            }
        }
    }

    if (validChecks === 0) return 0;
    return totalSim / validChecks;
};

// Default thresholds - can be overridden
export const MATCH_CONFIG = {
    SIMILARITY_THRESHOLD: 0.95, // 95% match required
    CONFIDENCE_THRESHOLD: 0.8  // Hand detection confidence
};
