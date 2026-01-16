import { useState, useRef, useCallback } from 'react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Demo mode - works without backend
const DEMO_MODE = true

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  
  const { token } = useUserStore()
  
  // Generate mock result for demo mode
  const generateMockResult = useCallback((expectedSpell) => {
    const accuracy = 0.6 + Math.random() * 0.4 // 60-100%
    const volume = 65 + Math.random() * 30      // 65-95 dB
    const confidence = 0.7 + Math.random() * 0.28
    
    const grades = ['SSS', 'S', 'A', 'B', 'C']
    const gradeIndex = Math.floor((1 - accuracy) * 5)
    const grade = grades[Math.min(gradeIndex, 4)]
    
    const baseDamage = 50
    const cringeBonus = Math.floor(95 * accuracy * 0.5)
    const volumeBonus = Math.floor(30 * ((volume - 60) / 40))
    const multiplier = 0.5 + accuracy * 0.5 + confidence * 0.2
    const totalDamage = Math.floor((baseDamage + cringeBonus + volumeBonus) * multiplier)
    
    return {
      success: true,
      transcription: accuracy > 0.8 ? expectedSpell : expectedSpell.split(' ').slice(0, 2).join(' ') + '...',
      analysis: {
        text_accuracy: Math.round(accuracy * 100) / 100,
        volume_db: Math.round(volume * 10) / 10,
        pitch_variance: Math.round((0.15 + Math.random() * 0.3) * 100) / 100,
        confidence: Math.round(confidence * 100) / 100
      },
      damage: {
        base_damage: baseDamage,
        cringe_bonus: cringeBonus,
        volume_bonus: volumeBonus,
        accuracy_multiplier: Math.round(multiplier * 100) / 100,
        total_damage: totalDamage
      },
      grade,
      animation_trigger: grade === 'SSS' ? 'ultimate_attack' : grade === 'S' ? 'special_attack_02' : 'normal_attack_01'
    }
  }, [])
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
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
    }
  }, [isRecording])
  
  // Analyze voice (send to backend or use demo mode)
  const analyzeVoice = useCallback(async (battleId, expectedSpell, characterId = 'char_001') => {
    setIsAnalyzing(true)
    setError(null)
    
    // Demo mode - simulate analysis delay and return mock data
    if (DEMO_MODE || !token) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
      const mockResult = generateMockResult(expectedSpell)
      setResult(mockResult)
      setIsAnalyzing(false)
      return mockResult
    }
    
    // Real backend mode
    if (!audioBlob) {
      setError('녹음된 음성이 없습니다.')
      setIsAnalyzing(false)
      return null
    }
    
    try {
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'voice.webm')
      formData.append('battle_id', battleId)
      formData.append('expected_spell', expectedSpell)
      formData.append('character_id', characterId)
      
      const response = await fetch(`${API_URL}/battle/voice-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Voice analysis failed')
      }
      
      const data = await response.json()
      setResult(data)
      return data
      
    } catch (err) {
      console.error('Analysis error:', err)
      // Fallback to demo mode on error
      const mockResult = generateMockResult(expectedSpell)
      setResult(mockResult)
      return mockResult
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, token, generateMockResult])
  
  // Reset state
  const reset = useCallback(() => {
    setAudioBlob(null)
    setResult(null)
    setError(null)
  }, [])
  
  return {
    isRecording,
    isAnalyzing,
    audioBlob,
    result,
    error,
    startRecording,
    stopRecording,
    analyzeVoice,
    reset,
  }
}
