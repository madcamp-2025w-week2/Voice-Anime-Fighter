import { useCallback, useRef } from 'react'

/**
 * useOtakuAudio - Web Audio API로 상대방의 공격 음성을 재생
 * Echo/Reverb 효과 적용으로 오타쿠 느낌 강화
 */
export function useOtakuAudio() {
  const audioContextRef = useRef(null)

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  /**
   * Play opponent's attack audio with echo/reverb effects
   * @param {string} audioUrl - URL of the audio file
   * @param {object} options - Effect options
   */
  const playOtakuSound = useCallback(async (audioUrl, options = {}) => {
    if (!audioUrl) {
      console.warn('No audio URL provided')
      return
    }

    const {
      echoDelay = 0.15,       // Echo delay in seconds (adjusted for clarity)
      feedbackGain = 0.12,    // Echo feedback amount (reduced for clarity)
      volume = 1,          // Master volume (0-1)
    } = options

    try {
      const ctx = getAudioContext()

      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Fetch and decode audio
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      // Return a Promise that resolves when audio finishes playing
      return new Promise((resolve) => {
        // Create source
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer

        // Master volume control
        const masterGain = ctx.createGain()
        masterGain.gain.value = volume

        // Echo Effect (Delay + Feedback)
        const delay = ctx.createDelay()
        delay.delayTime.value = echoDelay

        const feedback = ctx.createGain()
        feedback.gain.value = feedbackGain

        // Audio routing:
        // Source -> MasterGain -> Destination (direct sound)
        // Source -> Delay -> Feedback -> Delay -> ... -> Destination (echo)

        source.connect(masterGain)
        masterGain.connect(ctx.destination)

        // Echo path
        source.connect(delay)
        delay.connect(feedback)
        feedback.connect(delay)  // Feedback loop
        delay.connect(masterGain)  // Echo goes through master volume

        source.start()

        console.log('🔊 Playing otaku sound with effects')

        // Resolve when audio finishes (+ extra time for echo tail)
        source.onended = () => {
          // Wait a bit for echo tail to finish
          setTimeout(() => {
            source.disconnect()
            delay.disconnect()
            feedback.disconnect()
            masterGain.disconnect()
            console.log('🔊 Audio playback complete')
            resolve()
          }, echoDelay * 1000 * 2)  // Wait for echo tail
        }
      })

    } catch (error) {
      console.error('Error playing otaku sound:', error)
    }
  }, [getAudioContext])

  /**
   * Play critical hit sound effect
   */
  const playCriticalHitSound = useCallback(async () => {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    // Generate a synth sound for critical hit
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)  // A5
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1)  // A6
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)  // A4

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)

    console.log('💥 Critical hit sound!')
  }, [getAudioContext])

  /**
   * Close audio context (cleanup)
   */
  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.log('AudioContext close ignored:', err))
      }
      audioContextRef.current = null
    }
  }, [])

  return {
    playOtakuSound,
    playCriticalHitSound,
    cleanup,
  }
}
