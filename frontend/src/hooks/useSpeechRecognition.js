import { useState, useRef, useCallback, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Check Web Speech API support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Real-time STT transcript (Fast Track)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  
  const { token } = useUserStore()
  
  // Initialize Web Speech API
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ko-KR'  // Korean
      
      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalText = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalText) {
          setFinalTranscript(prev => prev + finalText)
        }
        setLiveTranscript(interimTranscript)
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        // Don't set error for no-speech, it's expected
        if (event.error !== 'no-speech') {
          setError(`음성 인식 오류: ${event.error}`)
        }
      }
      
      recognitionRef.current = recognition
    } else {
      console.warn('Web Speech API not supported')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])
  
  // Get combined transcript (final + live)
  const getCurrentTranscript = useCallback(() => {
    return (finalTranscript + liveTranscript).trim()
  }, [finalTranscript, liveTranscript])
  
  // Start recording (MediaRecorder + Web Speech API)
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
      setLiveTranscript('')
      setFinalTranscript('')
      chunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4',
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        setAudioBlob(blob)
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100)
      setIsRecording(true)
      
      // Start Web Speech API (Fast Track)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.warn('Speech recognition already started:', e)
        }
      }
      
    } catch (err) {
      console.error('Recording error:', err)
      setError('마이크 접근 권한이 필요합니다.')
    }
  }, [])
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Stop Web Speech API
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording])
  
  // Analyze voice (send to backend with STT text)
  const analyzeVoice = useCallback(async (battleId, expectedSpell, characterId = 'char_001') => {
    setIsAnalyzing(true)
    setError(null)
    
    // Get final STT text
    const sttText = getCurrentTranscript()
    console.log('📝 STT Text:', sttText)
    
    // Wait a bit for audioBlob to be ready
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Check if we have audio blob
    const currentBlob = audioBlob || (chunksRef.current.length > 0 
      ? new Blob(chunksRef.current, { type: 'audio/webm' })
      : null)
    
    if (!currentBlob) {
      console.warn('No audio blob available, using demo mode')
      // Demo mode fallback
      const mockResult = generateMockResult(expectedSpell, sttText)
      setResult(mockResult)
      setIsAnalyzing(false)
      return mockResult
    }
    
    try {
      const formData = new FormData()
      formData.append('audio_file', currentBlob, 'voice.webm')
      formData.append('battle_id', battleId)
      formData.append('expected_spell', expectedSpell)
      formData.append('stt_text', sttText)  // Send Web Speech API result
      formData.append('character_id', characterId)
      
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_URL}/battle/voice-analyze`, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Voice analysis failed')
      }
      
      const data = await response.json()
      console.log('🎯 Analysis result:', data)
      setResult(data)
      return data
      
    } catch (err) {
      console.error('Analysis error:', err)
      // Fallback to demo mode on error
      const mockResult = generateMockResult(expectedSpell, sttText)
      setResult(mockResult)
      return mockResult
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, token, getCurrentTranscript])
  
  // Generate mock result for demo mode
  const generateMockResult = useCallback((expectedSpell, sttText) => {
    // Calculate accuracy based on actual STT result if available
    let accuracy
    if (sttText && sttText.length > 0) {
      // Simple similarity calculation
      const normalize = (s) => s.toLowerCase().replace(/\s/g, '').replace(/[!?]/g, '')
      const sttNorm = normalize(sttText)
      const expectedNorm = normalize(expectedSpell)
      const minLen = Math.min(sttNorm.length, expectedNorm.length)
      const maxLen = Math.max(sttNorm.length, expectedNorm.length)
      let matches = 0
      for (let i = 0; i < minLen; i++) {
        if (sttNorm[i] === expectedNorm[i]) matches++
      }
      accuracy = maxLen > 0 ? matches / maxLen : 0
    } else {
      accuracy = 0.3 + Math.random() * 0.3 // Low accuracy if no STT
    }
    
    const volume = 50 + Math.random() * 40
    const confidence = 0.5 + accuracy * 0.3 + Math.random() * 0.2
    const isCritical = Math.random() > 0.7
    
    const grades = ['SSS', 'S', 'A', 'B', 'C', 'F']
    const gradeIndex = Math.min(5, Math.floor((1 - accuracy) * 6))
    const grade = isCritical && gradeIndex > 0 ? grades[gradeIndex - 1] : grades[gradeIndex]
    
    const baseDamage = 50
    const cringeBonus = Math.floor(90 * accuracy * 0.5)
    const volumeBonus = Math.floor(30 * (volume / 100))
    const multiplier = 0.5 + accuracy * 0.5 + confidence * 0.2
    let totalDamage = Math.floor((baseDamage + cringeBonus + volumeBonus) * multiplier)
    if (isCritical) totalDamage = Math.floor(totalDamage * 1.5)
    
    return {
      success: true,
      transcription: sttText || expectedSpell.split(' ').slice(0, 2).join(' ') + '...',
      analysis: {
        text_accuracy: Math.round(accuracy * 100) / 100,
        volume_db: Math.round(volume * 10) / 10,
        pitch_variance: Math.round((0.02 + Math.random() * 0.06) * 1000) / 1000,
        confidence: Math.round(confidence * 100) / 100
      },
      damage: {
        base_damage: baseDamage,
        cringe_bonus: cringeBonus,
        volume_bonus: volumeBonus,
        accuracy_multiplier: Math.round(multiplier * 100) / 100,
        total_damage: totalDamage,
        is_critical: isCritical
      },
      grade,
      animation_trigger: grade === 'SSS' ? 'ultimate_attack' : grade === 'S' ? 'special_attack_02' : 'normal_attack_01',
      is_critical: isCritical,
      audio_url: null
    }
  }, [])
  
  // Reset state
  const reset = useCallback(() => {
    setAudioBlob(null)
    setResult(null)
    setError(null)
    setLiveTranscript('')
    setFinalTranscript('')
  }, [])
  
  return {
    isRecording,
    isAnalyzing,
    audioBlob,
    result,
    error,
    // Real-time transcript (Fast Track)
    liveTranscript: finalTranscript + liveTranscript,
    startRecording,
    stopRecording,
    analyzeVoice,
    reset,
  }
}
