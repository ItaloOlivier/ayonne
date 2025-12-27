'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true
    setIsStandalone(isStandaloneMode)

    // If running in standalone mode, mark as installed and don't show prompt
    if (isStandaloneMode) {
      localStorage.setItem('ayonne_app_installed', 'true')
      return
    }

    // Check if user has previously installed the app
    const hasInstalled = localStorage.getItem('ayonne_app_installed')
    if (hasInstalled) {
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // For iOS, show the prompt after a delay
    if (isIOSDevice) {
      const hasSeenPrompt = localStorage.getItem('ayonne_install_prompt_seen')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 2000)
      }
      return
    }

    // For other browsers, listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const hasSeenPrompt = localStorage.getItem('ayonne_install_prompt_seen')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        // Mark as installed so we never show the prompt again
        localStorage.setItem('ayonne_app_installed', 'true')
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('ayonne_install_prompt_seen', 'true')
  }

  // Don't show if already installed or prompt not available
  if (isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-[#1C4444]/10 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="w-14 h-14 rounded-xl bg-[#1C4444] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-medium">A</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1C4444] text-lg">
                Install Ayonne App
              </h3>
              <p className="text-[#1C4444]/60 text-sm mt-1">
                {isIOS
                  ? 'Add to your home screen for quick access to skin analysis and product recommendations.'
                  : 'Install for quick access to skin analysis and personalized skincare recommendations.'}
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="mt-4 p-3 bg-[#F4EBE7] rounded-lg">
              <p className="text-[#1C4444] text-sm">
                <strong>To install:</strong> Tap the share button{' '}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-[#1C4444] text-white rounded text-xs">
                  ↑
                </span>{' '}
                then &quot;Add to Home Screen&quot;
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex gap-3">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex-1 bg-[#1C4444] text-white py-2.5 px-4 rounded-lg hover:bg-[#1C4444]/90 transition-colors font-medium text-sm"
              >
                Install App
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`${isIOS || !deferredPrompt ? 'flex-1' : ''} text-[#1C4444]/70 hover:text-[#1C4444] py-2.5 px-4 rounded-lg transition-colors text-sm`}
            >
              {isIOS ? 'Got it' : 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
