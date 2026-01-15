import { useState, useRef, useCallback } from 'react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

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
      mediaRecorder.start(100) // Collect data every 100ms
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
  
  // Analyze voice (send to backend)
  const analyzeVoice = useCallback(async (battleId, expectedSpell, characterId = 'char_001') => {
    if (!audioBlob) {
      setError('녹음된 음성이 없습니다.')
      return null
    }
    
    setIsAnalyzing(true)
    setError(null)
    
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
      setError('음성 분석에 실패했습니다.')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, token])
  
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
