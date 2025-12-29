/**
 * Identity Verification Module
 *
 * Ensures all 3 angles in a multi-angle skin analysis belong to the same person.
 * This is critical for luxury product quality and preventing fraudulent analyses.
 */

export interface IdentityVerificationResult {
  samePerson: boolean
  confidence: number
  // Which angle comparisons passed/failed
  frontToLeftMatch: number
  frontToRightMatch: number
  leftToRightMatch: number
  // Specific concerns detected
  concerns: IdentityVerificationConcern[]
  // Reject reason if samePerson is false
  rejectReason?: string
}

export interface IdentityVerificationConcern {
  type: 'different_person' | 'multiple_faces' | 'face_obscured' | 'angle_mismatch' | 'lighting_inconsistency' | 'heavy_makeup' | 'beauty_filter' | 'image_manipulation'
  description: string
  affectedAngles: ('front' | 'left' | 'right')[]
  severity: 'warning' | 'error'
}

/**
 * Makeup and filter detection result
 */
export interface MakeupFilterDetection {
  hasHeavyMakeup: boolean
  hasBeautyFilter: boolean
  makeupLevel: 'none' | 'light' | 'moderate' | 'heavy'
  filterConfidence: number
  concerns: string[]
}

/**
 * Face zone validation result
 */
export interface FaceZoneValidation {
  allZonesVisible: boolean
  visibilityScore: number
  missingZones: string[]
  obscuredBy: string[]
  canProceed: boolean
}

// Minimum confidence threshold for identity match
export const IDENTITY_CONFIDENCE_THRESHOLD = 0.70

// Analysis disclaimer prompt
export const ANALYSIS_DISCLAIMER_PROMPT = `
### Important Disclaimers (MUST Include in Analysis)

**In your JSON response, include this disclaimer field:**

"disclaimer": {
  "medicalAdvice": "This analysis is for informational purposes only and does not constitute medical advice. For medical concerns, please consult a board-certified dermatologist.",
  "accuracyNote": "AI-based skin analysis has limitations and may not detect all conditions. Results should be used as a guide, not a diagnosis.",
  "productRecommendations": "Product recommendations are based on detected skin characteristics. Individual results may vary. Discontinue use if irritation occurs.",
  "ageEstimation": "Skin age estimates are approximations based on visible indicators and may not reflect biological age."
}

**Always be conservative with:**
- Skin age estimates (err on the younger side)
- Confidence scores (if unsure, lower the confidence)
- Number of conditions (only report clearly visible issues)
- Severity assessments (avoid alarming language)

**Never:**
- Diagnose medical conditions (psoriasis, eczema, melanoma, etc.)
- Claim certainty about age or health status
- Make promises about product effectiveness
- Suggest prescription treatments
`

// The makeup/filter detection prompt
export const MAKEUP_FILTER_DETECTION_PROMPT = `
### Step 0.5: Makeup & Filter Detection (REQUIRED)

After identity verification, detect any makeup or digital filters that could affect skin analysis accuracy.

**Heavy Makeup Indicators (Flag as Concern):**
- Foundation/concealer completely masking natural skin texture
- Heavy powder that eliminates visible pores
- Color-correcting products that alter natural skin tone
- Thick contour/highlight products obscuring skin surface
- Full-coverage products that hide fine lines and wrinkles

**Light/Natural Makeup (Acceptable - Note Only):**
- Light tinted moisturizer or BB cream
- Minimal concealer for spot coverage
- Light powder or setting spray
- Natural-looking brows or mascara

**Beauty Filter Indicators (MUST Flag as Error):**
- Unnaturally smooth skin texture (porcelain/plastic appearance)
- Artificially enlarged eyes
- Slimmed/reshaped facial features
- Sparkle or glow effects
- Blurred skin with sharp edges on features
- Inconsistent lighting/shadows between face areas
- Color grading that doesn't match natural skin tones
- Perfect symmetry that looks digitally enhanced

**Image Manipulation Signs (MUST Flag as Error):**
- Visible pixelation artifacts around face edges
- Inconsistent resolution between face and background
- Warping or stretching around facial features
- Clone/stamp artifacts
- AI-generated appearance indicators

**Output for Makeup/Filter Detection:**
Add this to your JSON response:

"makeupFilterDetection": {
  "hasHeavyMakeup": false,
  "hasBeautyFilter": false,
  "makeupLevel": "none|light|moderate|heavy",
  "filterConfidence": 0.0-1.0,
  "concerns": ["specific concern descriptions"]
}

**CRITICAL:**
- If \`hasBeautyFilter\` is true with high confidence (>0.7), flag this as an ERROR concern
- Heavy makeup reduces accuracy of fine line and texture detection - note in analysis
- Light makeup is acceptable but should be noted in the analysis quality assessment
`

// The face zone validation prompt
export const FACE_ZONE_VALIDATION_PROMPT = `
### Step 0.75: Face Zone Validation (REQUIRED)

Verify that all critical facial zones are visible and suitable for analysis.

**Required Zones for Front View:**
- Forehead (at least 60% visible)
- Both eye areas including crow's feet regions
- Nose (complete visibility)
- Both cheeks (majority visible)
- Mouth area
- Chin and jawline

**Required Zones for Profile Views:**
- Temple area
- Outer eye corner and crow's feet
- Full cheek contour
- Jawline to ear
- Neck/jaw junction

**Zone Visibility Issues (Flag as Concerns):**
- Hair covering forehead or temple areas
- Glasses obscuring eye areas
- Hand or object blocking face
- Extreme angle hiding critical zones
- Shadow obscuring facial features

**Output for Zone Validation:**
Add this to your JSON response:

"faceZoneValidation": {
  "allZonesVisible": true,
  "visibilityScore": 0.0-1.0,
  "missingZones": ["list of zones not adequately visible"],
  "obscuredBy": ["hair", "glasses", "shadow", "hand", "angle", "other"],
  "canProceed": true
}

**IMPORTANT:**
- If visibility score is below 0.6, set canProceed to false
- Missing critical zones (eyes, cheeks) should strongly reduce visibility score
- Partial zone visibility (50-80%) should be noted but can proceed
`

// The prompt addition for identity verification (Step 0)
export const IDENTITY_VERIFICATION_PROMPT = `
### Step 0: Identity & Face Count Verification (MANDATORY - DO THIS FIRST)

**⚠️ CRITICAL: MULTIPLE FACE DETECTION IS REQUIRED ⚠️**

Before ANYTHING else, you MUST count the number of faces in EACH image. This is a SECURITY requirement.

**FACE COUNTING (MANDATORY FOR EACH IMAGE):**
1. Scan the ENTIRE image, including backgrounds, edges, and reflections
2. Count ALL visible faces, including:
   - Children, babies, or infants (even partially visible)
   - People in the background
   - Faces in mirrors, reflections, or photos on walls
   - Partially visible faces at image edges
3. Report the EXACT count in facesDetected for each angle

**⚠️ IF ANY IMAGE HAS MORE THAN 1 FACE:**
- Set facesDetected to the actual count (e.g., front: 2)
- Set samePerson to FALSE
- Add a concern with type "multiple_faces" and severity "error"
- Set rejectReason to describe which image(s) have multiple faces

**After face counting, verify all three images show the SAME PERSON:**

**Verification Checks:**
1. **Facial Structure Consistency**: Compare bone structure, face shape, and proportions
2. **Feature Matching**: Match eyes, nose, mouth, ears across all angles
3. **Skin Tone Consistency**: Verify consistent skin tone (allowing for lighting variations)
4. **Hair/Hairline**: Check for consistent hair color, texture, and hairline
5. **Distinguishing Marks**: Look for moles, scars, or birthmarks that should appear consistently

**Red Flags (MUST REJECT):**
- **Multiple faces in ANY image (most critical - always check carefully)**
- Different facial bone structure between angles
- Inconsistent distinguishing marks (moles appearing/disappearing)
- Dramatically different skin tones (beyond lighting variance)
- Face partially obscured in ways that prevent verification

**Output for Identity Verification:**
Add this to your JSON response:

"identityVerification": {
  "samePerson": true/false,
  "confidence": 0.0-1.0,
  "frontToLeftMatch": 0.0-1.0,
  "frontToRightMatch": 0.0-1.0,
  "leftToRightMatch": 0.0-1.0,
  "facesDetected": {
    "front": <NUMBER - actual face count, check carefully for children/background people>,
    "left": <NUMBER - actual face count>,
    "right": <NUMBER - actual face count>
  },
  "concerns": [
    {
      "type": "different_person|multiple_faces|face_obscured|angle_mismatch|lighting_inconsistency",
      "description": "Specific description of the concern",
      "affectedAngles": ["front", "left", "right"],
      "severity": "warning|error"
    }
  ],
  "rejectReason": "Reason if samePerson is false (null otherwise)"
}

**IMPORTANT:**
- **Always report accurate face counts - do not assume 1 face per image**
- If any image contains multiple people (even a child in the corner), this MUST be flagged
- If \`samePerson\` is false, you MUST still provide skin analysis but flag the verification failure
- Confidence threshold for acceptance: ${IDENTITY_CONFIDENCE_THRESHOLD} (${IDENTITY_CONFIDENCE_THRESHOLD * 100}%)
- Be thorough but not overly strict on identity - lighting can cause apparent differences
- Same person wearing different expressions is VALID (they may smile in one, neutral in another)
`

/**
 * Parse identity verification result from AI response
 */
export function parseIdentityVerification(
  aiResponse: Record<string, unknown>
): IdentityVerificationResult | null {
  const verification = aiResponse.identityVerification as Record<string, unknown> | undefined

  if (!verification) {
    return null
  }

  const samePerson = Boolean(verification.samePerson)
  const confidence = typeof verification.confidence === 'number'
    ? verification.confidence
    : 0

  const frontToLeftMatch = typeof verification.frontToLeftMatch === 'number'
    ? verification.frontToLeftMatch
    : confidence

  const frontToRightMatch = typeof verification.frontToRightMatch === 'number'
    ? verification.frontToRightMatch
    : confidence

  const leftToRightMatch = typeof verification.leftToRightMatch === 'number'
    ? verification.leftToRightMatch
    : confidence

  // Parse concerns array
  const rawConcerns = Array.isArray(verification.concerns) ? verification.concerns : []
  const concerns: IdentityVerificationConcern[] = rawConcerns
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map(c => ({
      type: (c.type as IdentityVerificationConcern['type']) || 'different_person',
      description: String(c.description || ''),
      affectedAngles: Array.isArray(c.affectedAngles)
        ? c.affectedAngles.filter((a): a is 'front' | 'left' | 'right' =>
            ['front', 'left', 'right'].includes(String(a)))
        : [],
      severity: c.severity === 'error' ? 'error' : 'warning',
    }))

  const rejectReason = typeof verification.rejectReason === 'string' && verification.rejectReason
    ? verification.rejectReason
    : undefined

  return {
    samePerson,
    confidence,
    frontToLeftMatch,
    frontToRightMatch,
    leftToRightMatch,
    concerns,
    rejectReason,
  }
}

/**
 * Check if identity verification passes our threshold
 */
export function isIdentityVerified(verification: IdentityVerificationResult): boolean {
  // Must be marked as same person
  if (!verification.samePerson) {
    return false
  }

  // Must meet confidence threshold
  if (verification.confidence < IDENTITY_CONFIDENCE_THRESHOLD) {
    return false
  }

  // Check for any error-level concerns
  const hasErrorConcerns = verification.concerns.some(c => c.severity === 'error')
  if (hasErrorConcerns) {
    return false
  }

  return true
}

/**
 * Generate user-friendly error message for identity verification failure
 */
export function getIdentityVerificationErrorMessage(
  verification: IdentityVerificationResult
): string {
  // Check for multiple faces first (most specific)
  const multipleFacesConcern = verification.concerns.find(c => c.type === 'multiple_faces')
  if (multipleFacesConcern) {
    return 'Multiple faces detected in one or more images. Please ensure only your face is visible in each photo.'
  }

  // Check for different person
  if (!verification.samePerson || verification.rejectReason) {
    return verification.rejectReason ||
      'The photos appear to show different people. Please retake all photos of the same person.'
  }

  // Low confidence
  if (verification.confidence < IDENTITY_CONFIDENCE_THRESHOLD) {
    return `Unable to verify identity across all angles (confidence: ${Math.round(verification.confidence * 100)}%). Please retake photos with better lighting and ensure your face is clearly visible.`
  }

  // Generic fallback
  return 'Identity verification failed. Please retake all photos ensuring the same person is clearly visible in each.'
}

/**
 * Check for multiple faces in the AI response
 * Uses multiple detection methods for robustness:
 * 1. facesDetected counts
 * 2. concerns array with type 'multiple_faces'
 * 3. rejectReason containing multiple face keywords
 */
export function hasMultipleFaces(aiResponse: Record<string, unknown>): boolean {
  const verification = aiResponse.identityVerification as Record<string, unknown> | undefined
  if (!verification) return false

  // Method 1: Check facesDetected counts
  const facesDetected = verification.facesDetected as Record<string, number> | undefined
  if (facesDetected) {
    const hasManyInFacesDetected = (
      (facesDetected.front ?? 1) > 1 ||
      (facesDetected.left ?? 1) > 1 ||
      (facesDetected.right ?? 1) > 1
    )
    if (hasManyInFacesDetected) {
      return true
    }
  }

  // Method 2: Check concerns array for multiple_faces type
  const concerns = verification.concerns as Array<{ type?: string; description?: string; severity?: string }> | undefined
  if (concerns && Array.isArray(concerns)) {
    const hasMultipleFacesConcern = concerns.some(c =>
      c.type === 'multiple_faces' ||
      (c.severity === 'error' && c.description?.toLowerCase().includes('multiple'))
    )
    if (hasMultipleFacesConcern) {
      return true
    }
  }

  // Method 3: Check rejectReason for multiple face keywords
  const rejectReason = verification.rejectReason as string | undefined
  if (rejectReason) {
    const multipleFaceKeywords = ['multiple face', 'multiple person', 'multiple people', 'more than one', 'another person', 'other person', 'additional face', 'second person', 'two face', 'two people']
    const hasMultipleFaceReason = multipleFaceKeywords.some(keyword =>
      rejectReason.toLowerCase().includes(keyword)
    )
    if (hasMultipleFaceReason) {
      return true
    }
  }

  // Method 4: Check samePerson=false with low confidence could indicate multiple faces
  // But we don't want false positives, so only check explicit indicators above

  return false
}

/**
 * Parse makeup/filter detection from AI response
 */
export function parseMakeupFilterDetection(
  aiResponse: Record<string, unknown>
): MakeupFilterDetection | null {
  const detection = aiResponse.makeupFilterDetection as Record<string, unknown> | undefined

  if (!detection) {
    return null
  }

  return {
    hasHeavyMakeup: Boolean(detection.hasHeavyMakeup),
    hasBeautyFilter: Boolean(detection.hasBeautyFilter),
    makeupLevel: (['none', 'light', 'moderate', 'heavy'].includes(String(detection.makeupLevel))
      ? detection.makeupLevel
      : 'none') as MakeupFilterDetection['makeupLevel'],
    filterConfidence: typeof detection.filterConfidence === 'number'
      ? detection.filterConfidence
      : 0,
    concerns: Array.isArray(detection.concerns)
      ? detection.concerns.map(String)
      : [],
  }
}

/**
 * Check if beauty filter is detected (blocks analysis)
 */
export function hasBeautyFilter(makeupDetection: MakeupFilterDetection | null): boolean {
  if (!makeupDetection) return false
  return makeupDetection.hasBeautyFilter && makeupDetection.filterConfidence >= 0.7
}

/**
 * Get user-friendly message for makeup/filter issues
 */
export function getMakeupFilterErrorMessage(
  makeupDetection: MakeupFilterDetection
): string {
  if (makeupDetection.hasBeautyFilter && makeupDetection.filterConfidence >= 0.7) {
    return 'Beauty filter detected. Please disable camera filters and retake photos for accurate skin analysis.'
  }

  if (makeupDetection.hasHeavyMakeup) {
    return 'Heavy makeup detected which may affect analysis accuracy. For best results, please retake photos with minimal or no makeup.'
  }

  return 'Image quality concern detected. Please retake photos without filters or heavy makeup.'
}

/**
 * Parse face zone validation from AI response
 */
export function parseFaceZoneValidation(
  aiResponse: Record<string, unknown>
): FaceZoneValidation | null {
  const validation = aiResponse.faceZoneValidation as Record<string, unknown> | undefined

  if (!validation) {
    return null
  }

  return {
    allZonesVisible: Boolean(validation.allZonesVisible),
    visibilityScore: typeof validation.visibilityScore === 'number'
      ? validation.visibilityScore
      : 1.0,
    missingZones: Array.isArray(validation.missingZones)
      ? validation.missingZones.map(String)
      : [],
    obscuredBy: Array.isArray(validation.obscuredBy)
      ? validation.obscuredBy.map(String)
      : [],
    canProceed: Boolean(validation.canProceed ?? true),
  }
}

/**
 * Check if face zone validation passes
 */
export function isFaceZoneValid(validation: FaceZoneValidation | null): boolean {
  if (!validation) return true // If not provided, assume valid
  return validation.canProceed && validation.visibilityScore >= 0.6
}

/**
 * Get user-friendly message for face zone issues
 */
export function getFaceZoneErrorMessage(validation: FaceZoneValidation): string {
  if (validation.missingZones.length > 0) {
    const zones = validation.missingZones.slice(0, 3).join(', ')
    return `Some facial areas are not visible: ${zones}. Please ensure your full face is visible and retake the photos.`
  }

  if (validation.obscuredBy.length > 0) {
    const obstructions = validation.obscuredBy.slice(0, 2).join(' and ')
    return `Your face is partially obscured by ${obstructions}. Please remove obstructions and retake the photos.`
  }

  return 'Unable to see all facial areas clearly. Please ensure good lighting and your full face is visible.'
}
