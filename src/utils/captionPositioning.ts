// Smart caption positioning to avoid overlaps and find empty space

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  positionX?: number;
  positionY?: number;
}

interface PositionZone {
  x: number;
  y: number;
  priority: number; // Lower is better (less likely to obscure content)
}

// Define safe zones for captions (avoiding center where faces typically are)
const POSITION_ZONES: PositionZone[] = [
  { x: 50, y: 85, priority: 1 },  // Bottom center (default, safest)
  { x: 50, y: 15, priority: 2 },  // Top center
  { x: 15, y: 85, priority: 3 },  // Bottom left
  { x: 85, y: 85, priority: 4 },  // Bottom right
  { x: 15, y: 15, priority: 5 },  // Top left
  { x: 85, y: 15, priority: 6 },  // Top right
  { x: 15, y: 50, priority: 7 },  // Middle left
  { x: 85, y: 50, priority: 8 },  // Middle right
];

/**
 * Detects if a word should be emphasized based on patterns
 */
export const detectKeyword = (word: string): boolean => {
  // Emphasize words that are ALL CAPS
  if (word.length > 2 && word === word.toUpperCase()) {
    return true;
  }
  
  // Emphasize words with exclamation or question marks
  if (word.includes('!') || word.includes('?')) {
    return true;
  }
  
  // Common emphasis words
  const emphasisWords = [
    'important', 'crucial', 'key', 'essential', 'critical',
    'amazing', 'incredible', 'wow', 'never', 'always',
    'must', 'should', 'need', 'required'
  ];
  
  if (emphasisWords.includes(word.toLowerCase())) {
    return true;
  }
  
  return false;
};

/**
 * Checks if two time ranges overlap
 */
const timeRangesOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
  return start1 < end2 && start2 < end1;
};

/**
 * Checks if two positions are too close (would visually overlap)
 */
const positionsTooClose = (x1: number, y1: number, x2: number, y2: number, minDistance = 15): boolean => {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance < minDistance;
};

/**
 * Finds the best position for a caption to avoid overlaps
 */
export const findOptimalPosition = (
  caption: Caption,
  allCaptions: Caption[],
  currentIndex: number
): { x: number; y: number } => {
  // If caption already has a manually set position, keep it
  if (caption.positionX !== undefined && caption.positionY !== undefined) {
    return { x: caption.positionX, y: caption.positionY };
  }

  // Find captions that overlap in time
  const overlappingCaptions = allCaptions.filter((other, idx) => {
    if (idx === currentIndex) return false;
    return timeRangesOverlap(caption.start, caption.end, other.start, other.end);
  });

  // Try each position zone in priority order
  for (const zone of POSITION_ZONES) {
    let positionIsSafe = true;

    // Check if this position conflicts with any overlapping caption
    for (const overlapping of overlappingCaptions) {
      const otherX = overlapping.positionX ?? 50;
      const otherY = overlapping.positionY ?? 85;
      
      if (positionsTooClose(zone.x, zone.y, otherX, otherY)) {
        positionIsSafe = false;
        break;
      }
    }

    if (positionIsSafe) {
      return { x: zone.x, y: zone.y };
    }
  }

  // Fallback to default position if all zones are occupied
  return { x: 50, y: 85 };
};

/**
 * Gets enhanced styling for a caption based on whether it's a keyword
 */
export const getEnhancedStyling = (caption: Caption): Partial<Caption> => {
  const isKeyword = caption.isKeyword || detectKeyword(caption.word);
  
  if (isKeyword) {
    return {
      fontSize: (caption.fontSize || 32) * 1.3,
      fontFamily: caption.fontFamily || 'Inter',
      color: caption.color || '#FFD700', // Gold for emphasis
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    };
  }
  
  return {
    fontSize: caption.fontSize || 32,
    fontFamily: caption.fontFamily || 'Inter',
    color: caption.color || '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };
};

/**
 * Processes all captions to assign optimal positions and styling
 */
export const optimizeCaptions = (captions: Caption[]): Caption[] => {
  return captions.map((caption, index) => {
    const position = findOptimalPosition(caption, captions, index);
    const styling = getEnhancedStyling(caption);
    const isKeyword = detectKeyword(caption.word);
    
    return {
      ...caption,
      positionX: caption.positionX ?? position.x,
      positionY: caption.positionY ?? position.y,
      isKeyword,
      ...styling,
    };
  });
};
