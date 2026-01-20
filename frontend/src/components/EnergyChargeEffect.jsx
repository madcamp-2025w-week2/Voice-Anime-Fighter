import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * EnergyChargeEffect Component
 * Canvas API를 사용한 기 모으기 이펙트
 * 녹음 중 캐릭터 주변에 에너지가 모이는 애니메이션
 */
export default function EnergyChargeEffect({ isActive, intensity = 1, color = '#ff69b4' }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const timeRef = useRef(0)

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      // 캔버스 클리어
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      particlesRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width
    canvas.height = height

    const centerX = width / 2
    const centerY = height / 2

    // 파티클 초기화
    const initParticles = () => {
      particlesRef.current = []
      const count = 60 + Math.floor(intensity * 40)
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const distance = 150 + Math.random() * 100
        particlesRef.current.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          targetX: centerX,
          targetY: centerY,
          speed: 0.5 + Math.random() * 1.5,
          size: 2 + Math.random() * 4,
          alpha: 0.3 + Math.random() * 0.7,
          angle,
          distance,
          originalDistance: distance,
          hue: Math.random() * 60 - 30, // 색상 변화
          trail: []
        })
      }
    }

    // 에너지 링 데이터
    const rings = [
      { radius: 0, maxRadius: 120, speed: 2, alpha: 0.8 },
      { radius: 0, maxRadius: 90, speed: 3, alpha: 0.6 },
      { radius: 0, maxRadius: 60, speed: 4, alpha: 0.4 }
    ]

    const animate = () => {
      timeRef.current += 0.016
      ctx.clearRect(0, 0, width, height)

      // 배경 글로우
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
      gradient.addColorStop(0, `${color}33`)
      gradient.addColorStop(0.5, `${color}11`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // 에너지 링 그리기
      rings.forEach((ring, index) => {
        ring.radius += ring.speed * intensity
        if (ring.radius > ring.maxRadius) {
          ring.radius = 0
        }

        const ringAlpha = ring.alpha * (1 - ring.radius / ring.maxRadius)
        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${color}${Math.floor(ringAlpha * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 3 - index
        ctx.stroke()
      })

      // 파티클 업데이트 및 그리기
      particlesRef.current.forEach((p, index) => {
        // 중심으로 이동
        const dx = p.targetX - p.x
        const dy = p.targetY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > 10) {
          p.x += (dx / dist) * p.speed * intensity
          p.y += (dy / dist) * p.speed * intensity
          
          // 트레일 추가
          p.trail.push({ x: p.x, y: p.y, alpha: p.alpha })
          if (p.trail.length > 10) p.trail.shift()
        } else {
          // 리스폰
          const newAngle = p.angle + timeRef.current * 0.5
          p.x = centerX + Math.cos(newAngle) * p.originalDistance
          p.y = centerY + Math.sin(newAngle) * p.originalDistance
          p.trail = []
        }

        // 트레일 그리기
        p.trail.forEach((t, i) => {
          const trailAlpha = (i / p.trail.length) * t.alpha * 0.5
          ctx.beginPath()
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `${color}${Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')}`
          ctx.fill()
        })

        // 파티클 그리기
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        
        // 글로우 효과
        const particleGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        particleGradient.addColorStop(0, `${color}ff`)
        particleGradient.addColorStop(0.5, `${color}88`)
        particleGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = particleGradient
        ctx.fill()
      })

      // 중앙 코어 이펙트
      const coreSize = 20 + Math.sin(timeRef.current * 5) * 10 * intensity
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize)
      coreGradient.addColorStop(0, '#ffffff')
      coreGradient.addColorStop(0.3, color)
      coreGradient.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2)
      ctx.fillStyle = coreGradient
      ctx.fill()

      // 스파크 효과
      const sparkCount = 8
      for (let i = 0; i < sparkCount; i++) {
        const sparkAngle = (Math.PI * 2 * i) / sparkCount + timeRef.current * 2
        const sparkDist = 30 + Math.sin(timeRef.current * 3 + i) * 15
        const sparkX = centerX + Math.cos(sparkAngle) * sparkDist
        const sparkY = centerY + Math.sin(sparkAngle) * sparkDist
        
        ctx.beginPath()
        ctx.moveTo(sparkX - 5, sparkY)
        ctx.lineTo(sparkX + 5, sparkY)
        ctx.moveTo(sparkX, sparkY - 5)
        ctx.lineTo(sparkX, sparkY + 5)
        ctx.strokeStyle = `${color}cc`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    initParticles()
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, intensity, color])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ 
        width: '100%', 
        height: '100%',
        mixBlendMode: 'screen'
      }}
    />
  )
}

EnergyChargeEffect.propTypes = {
  isActive: PropTypes.bool.isRequired,
  intensity: PropTypes.number,
  color: PropTypes.string
}
