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
  const isRecordingRef = useRef(false)  // 🔥 Ref for onend callback closure
  const restartCountRef = useRef(0)  // 🔥 재시작 횟수 추적
  const maxRestarts = 5  // 🔥 최대 재시작 횟수 (무한 루프 방지)
  const lastErrorRef = useRef(null)  // 🔥 마지막 에러 저장

  const { token } = useUserStore()

  // Initialize Web Speech API
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ko-KR'  // Korean
      recognition.maxAlternatives = 1  // 🔥 성능 최적화

      recognition.onresult = (event) => {
        // 🔥 결과 수신 시 재시작 카운트 초기화 (정상 작동 중)
        restartCountRef.current = 0
        
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
        console.error('🔴 Speech recognition error:', event.error)
        lastErrorRef.current = event.error
        
        // 에러 타입별 처리
        switch (event.error) {
          case 'no-speech':
            // 음성 없음 - 정상적인 상황, 자동 재시작됨
            console.log('🔇 No speech detected, will auto-restart')
            break
          case 'aborted':
            // 의도적 중단 - 무시
            break
          case 'network':
            // 🔥 네트워크 오류 - 재시도 가능 (3회 연속 실패 시에만 에러 표시)
            console.warn('🌐 Network error, will retry automatically...')
            if (restartCountRef.current >= 3) {
              setError('음성 인식 서버 연결에 실패했습니다. 인터넷 연결을 확인해주세요.')
            }
            // 재시작은 onend에서 처리됨
            break
          case 'not-allowed':
          case 'service-not-allowed':
            // 마이크 권한 없음
            setError('마이크 사용 권한이 필요합니다.')
            break
          case 'audio-capture':
            // 마이크 접근 실패
            setError('마이크를 찾을 수 없습니다.')
            break
          default:
            setError(`음성 인식 오류: ${event.error}`)
        }
      }

      // 🔥 Auto-restart when recognition ends unexpectedly (개선된 버전)
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended, isRecording:', isRecordingRef.current, 'restarts:', restartCountRef.current)
        
        // If still recording and within restart limit, auto-restart
        if (isRecordingRef.current && restartCountRef.current < maxRestarts) {
          // 치명적 에러일 경우 재시작 안함
          if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(lastErrorRef.current)) {
            console.log('⛔ Skipping restart due to critical error:', lastErrorRef.current)
            return
          }
          
          restartCountRef.current++
          console.log(`🔄 Auto-restarting speech recognition (${restartCountRef.current}/${maxRestarts})...`)
          
          // 🔥 abort() 후 딜레이를 두고 start()
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.abort()  // 🔥 깔끔하게 정리
              } catch (e) {
                // ignore abort error
              }
              
              // abort 후 추가 딜레이
              setTimeout(() => {
                if (isRecordingRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start()
                    console.log('✅ Speech recognition restarted successfully')
                    lastErrorRef.current = null  // 성공 시 에러 초기화
                  } catch (e) {
                    console.warn('Failed to restart speech recognition:', e.message)
                  }
                }
              }, 100)  // abort 후 100ms 추가 대기
            }
          }, 300)  // 🔥 300ms 딜레이 (100ms → 300ms 증가)
        } else if (restartCountRef.current >= maxRestarts) {
          console.warn('⚠️ Max restart attempts reached, stopping auto-restart')
        }
      }

      recognitionRef.current = recognition
    } else {
      console.warn('Web Speech API not supported')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  // Get combined transcript (final + live)
  const getCurrentTranscript = useCallback(() => {
    return (finalTranscript + liveTranscript).trim()
  }, [finalTranscript, liveTranscript])

  // Start recording (MediaRecorder + Web Speech API)
  // 🔥 Returns the stream so visualizer can use the same stream
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
      setLiveTranscript('')
      setFinalTranscript('')
      setAudioBlob(null)  // 🔥 이전 오디오 초기화!
      chunksRef.current = []
      restartCountRef.current = 0  // 🔥 녹음 시작 시 재시작 카운트 초기화
      lastErrorRef.current = null  // 🔥 에러 상태 초기화

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
      isRecordingRef.current = true  // 🔥 Sync ref for onend callback

      // Start Web Speech API (Fast Track)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.warn('Speech recognition already started:', e)
        }
      }

      // 🔥 Return stream so visualizer can use the same stream
      return stream

    } catch (err) {
      console.error('Recording error:', err)
      setError('마이크 접근 권한이 필요합니다.')
      return null
    }
  }, [])

  // Stop recording - returns Promise with audio blob
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current

        // 🔥 onstop 이벤트 핸들러를 교체하여 현재 녹음 blob을 반환
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
          console.log('🎵 Recording stopped, blob size:', blob.size, 'chunks:', chunksRef.current.length)
          setAudioBlob(blob)
          resolve(blob)  // 녹음 완료 후 blob 반환
        }

        mediaRecorder.stop()
        setIsRecording(false)
        isRecordingRef.current = false  // 🔥 Sync ref to prevent auto-restart

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Stop Web Speech API
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      } else {
        // 녹음 중이 아니면 null 반환
        resolve(null)
      }
    })
  }, [isRecording])

  // Analyze voice (send to backend with STT text)
  // 🔥 audioBlob을 직접 파라미터로 받음 (stopRecording에서 반환된 blob)
  const analyzeVoice = useCallback(async (battleId, expectedSpell, characterId = 'char_001', providedBlob = null, isUltimate = false) => {
    setIsAnalyzing(true)
    setError(null)

    // Get final STT text
    const sttText = getCurrentTranscript()
    console.log('📝 STT Text:', sttText)

    // 🔥 제공된 blob 사용, 없으면 state/chunks fallback
    const currentBlob = providedBlob
      || audioBlob
      || (chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'audio/webm' }) : null)

    console.log('🎵 Using provided blob:', !!providedBlob, 'size:', currentBlob?.size)

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
      formData.append('is_ultimate', isUltimate.toString())  // 궁극기 여부 전달

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
