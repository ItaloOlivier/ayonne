/**
 * Shared types for MultiAngleUpload components
 */

export interface CapturedImage {
  file: File
  preview: string
  angle: 'front' | 'left' | 'right'
}

export type CaptureStep = 'front' | 'left' | 'right' | 'review'

export interface AngleConfig {
  id: CaptureStep
  label: string
  instruction: string
  tips: string[]
  silhouetteTransform: string
  guideText: string
}

export const ANGLE_CONFIGS: Record<Exclude<CaptureStep, 'review'>, AngleConfig> = {
  front: {
    id: 'front',
    label: 'Front View',
    instruction: 'Look directly at the camera',
    tips: [
      'Center your face in the frame',
      'Relax your expression naturally',
      'Ensure soft, even lighting',
    ],
    silhouetteTransform: '',
    guideText: 'Center your face',
  },
  left: {
    id: 'left',
    label: 'Left Profile',
    instruction: 'Gently turn to show your left side',
    tips: [
      'Turn your head 45° to the right',
      'Keep your chin parallel to the floor',
      'Let your natural beauty shine through',
    ],
    silhouetteTransform: 'rotateY(35deg)',
    guideText: 'Show your left side',
  },
  right: {
    id: 'right',
    label: 'Right Profile',
    instruction: 'Gently turn to show your right side',
    tips: [
      'Turn your head 45° to the left',
      'Keep your chin parallel to the floor',
      'Almost there — one more angle',
    ],
    silhouetteTransform: 'rotateY(-35deg)',
    guideText: 'Show your right side',
  },
}

export const STEPS_ORDER: Exclude<CaptureStep, 'review'>[] = ['front', 'left', 'right']
