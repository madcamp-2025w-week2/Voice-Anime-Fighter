import { useState, useRef, useCallback, useEffect } from 'react'

export function useAudioVisualizer() {
  const [analyzerData, setAnalyzerData] = useState(new Array(32).fill(0))
  const [volume, setVolume] = useState(0)
  
  const audioContextRef = useRef(null)
  const analyzerRef = useRef(null)
  const animationRef = useRef(null)
  const sourceRef = useRef(null)
  
  // Start visualizer with audio stream
  const start = useCallback(async (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyzerRef.current = audioContextRef.current.createAnalyser()
      analyzerRef.current.fftSize = 64
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
      sourceRef.current.connect(analyzerRef.current)
      
      const bufferLength = analyzerRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const animate = () => {
        analyzerRef.current.getByteFrequencyData(dataArray)
        
        // Normalize data to 0-100 range
        const normalized = Array.from(dataArray).map(v => (v / 255) * 100)
        setAnalyzerData(normalized)
        
        // Calculate average volume
        const avg = normalized.reduce((a, b) => a + b, 0) / normalized.length
        setVolume(avg)
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animate()
    } catch (err) {
      console.error('Visualizer error:', err)
    }
  }, [])
  
  // Stop visualizer
  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setAnalyzerData(new Array(32).fill(0))
    setVolume(0)
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => stop()
  }, [stop])
  
  return {
    analyzerData,
    volume,
    start,
    stop,
  }
}
