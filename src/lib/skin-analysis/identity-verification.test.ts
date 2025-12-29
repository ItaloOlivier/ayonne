import { describe, it, expect } from 'vitest'
import { hasMultipleFaces, parseIdentityVerification, isIdentityVerified } from './identity-verification'

describe('hasMultipleFaces', () => {
  it('returns false when verification is missing', () => {
    expect(hasMultipleFaces({})).toBe(false)
  })

  it('returns false when only 1 face in each image', () => {
    const response = {
      identityVerification: {
        samePerson: true,
        confidence: 0.95,
        facesDetected: {
          front: 1,
          left: 1,
          right: 1,
        },
        concerns: [],
      },
    }
    expect(hasMultipleFaces(response)).toBe(false)
  })

  it('returns true when front image has multiple faces', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        facesDetected: {
          front: 2,
          left: 1,
          right: 1,
        },
        concerns: [],
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns true when left image has multiple faces', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        facesDetected: {
          front: 1,
          left: 3,
          right: 1,
        },
        concerns: [],
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns true when concerns include multiple_faces type', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        // facesDetected missing - but concerns should catch it
        concerns: [
          {
            type: 'multiple_faces',
            description: 'Multiple faces detected in front image',
            affectedAngles: ['front'],
            severity: 'error',
          },
        ],
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns true when concerns description mentions multiple', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        facesDetected: {
          front: 1,
          left: 1,
          right: 1,
        },
        concerns: [
          {
            type: 'face_obscured',
            description: 'Multiple people visible in the background',
            affectedAngles: ['front'],
            severity: 'error',
          },
        ],
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns true when rejectReason mentions multiple faces', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        facesDetected: {
          front: 1, // AI might not have updated this correctly
          left: 1,
          right: 1,
        },
        concerns: [],
        rejectReason: 'Another person (child) visible in the front image',
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns true when rejectReason mentions two people', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.5,
        rejectReason: 'Two people detected in the image',
      },
    }
    expect(hasMultipleFaces(response)).toBe(true)
  })

  it('returns false when concerns exist but not about multiple faces', () => {
    const response = {
      identityVerification: {
        samePerson: true,
        confidence: 0.75,
        facesDetected: {
          front: 1,
          left: 1,
          right: 1,
        },
        concerns: [
          {
            type: 'lighting_inconsistency',
            description: 'Different lighting conditions between angles',
            affectedAngles: ['front', 'left'],
            severity: 'warning',
          },
        ],
      },
    }
    expect(hasMultipleFaces(response)).toBe(false)
  })
})

describe('parseIdentityVerification', () => {
  it('returns null when identityVerification is missing', () => {
    expect(parseIdentityVerification({})).toBe(null)
  })

  it('parses valid verification response', () => {
    const response = {
      identityVerification: {
        samePerson: true,
        confidence: 0.95,
        frontToLeftMatch: 0.93,
        frontToRightMatch: 0.94,
        leftToRightMatch: 0.92,
        concerns: [],
      },
    }
    const result = parseIdentityVerification(response)
    expect(result).not.toBe(null)
    expect(result?.samePerson).toBe(true)
    expect(result?.confidence).toBe(0.95)
  })

  it('parses concerns correctly', () => {
    const response = {
      identityVerification: {
        samePerson: false,
        confidence: 0.4,
        concerns: [
          {
            type: 'different_person',
            description: 'Facial features do not match',
            affectedAngles: ['front', 'left'],
            severity: 'error',
          },
        ],
        rejectReason: 'Different people in images',
      },
    }
    const result = parseIdentityVerification(response)
    expect(result?.concerns).toHaveLength(1)
    expect(result?.concerns[0].type).toBe('different_person')
    expect(result?.concerns[0].severity).toBe('error')
    expect(result?.rejectReason).toBe('Different people in images')
  })
})

describe('isIdentityVerified', () => {
  it('returns true for valid same person verification', () => {
    const verification = {
      samePerson: true,
      confidence: 0.85,
      frontToLeftMatch: 0.85,
      frontToRightMatch: 0.85,
      leftToRightMatch: 0.85,
      concerns: [],
    }
    expect(isIdentityVerified(verification)).toBe(true)
  })

  it('returns false when samePerson is false', () => {
    const verification = {
      samePerson: false,
      confidence: 0.85,
      frontToLeftMatch: 0.85,
      frontToRightMatch: 0.85,
      leftToRightMatch: 0.85,
      concerns: [],
    }
    expect(isIdentityVerified(verification)).toBe(false)
  })

  it('returns false when confidence is below threshold', () => {
    const verification = {
      samePerson: true,
      confidence: 0.5, // Below 0.70 threshold
      frontToLeftMatch: 0.5,
      frontToRightMatch: 0.5,
      leftToRightMatch: 0.5,
      concerns: [],
    }
    expect(isIdentityVerified(verification)).toBe(false)
  })

  it('returns false when there are error-level concerns', () => {
    const verification = {
      samePerson: true,
      confidence: 0.85,
      frontToLeftMatch: 0.85,
      frontToRightMatch: 0.85,
      leftToRightMatch: 0.85,
      concerns: [
        {
          type: 'multiple_faces' as const,
          description: 'Multiple faces in front image',
          affectedAngles: ['front' as const],
          severity: 'error' as const,
        },
      ],
    }
    expect(isIdentityVerified(verification)).toBe(false)
  })

  it('returns true when only warning-level concerns exist', () => {
    const verification = {
      samePerson: true,
      confidence: 0.85,
      frontToLeftMatch: 0.85,
      frontToRightMatch: 0.85,
      leftToRightMatch: 0.85,
      concerns: [
        {
          type: 'lighting_inconsistency' as const,
          description: 'Different lighting',
          affectedAngles: ['front' as const, 'left' as const],
          severity: 'warning' as const,
        },
      ],
    }
    expect(isIdentityVerified(verification)).toBe(true)
  })
})
