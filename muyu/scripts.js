;(function () {
  "use strict"

  console.log("scripts.js loaded")

  window.addEventListener('error', function (e) {
    try {
      console.error('Runtime error:', e.message || e)
      alert('脚本错误: ' + (e.message || e))
    } catch (err) {
      /* ignore */
    }
  })

  const State = {
    meritCount: 0,
    phase: 1,
    combo: 0,
    lastHitTime: 0,
    comboTimer: null,
    isPressed: false,
    springX: 0,
    springY: 0,
    springVx: 0,
    springVy: 0,
    deformation: 0,
    rotation: 0,
    glowIntensity: 0,
    particles: [],
    stars: [],
    codeRainChars: [],
    zenQuotes: [
      "Debug 即是修行",
      "404 Not Found, But Peace Found",
      "心无 Bug 自凉",
      "代码本无相，功德在其中",
      "变量皆空，常量永恒",
      "递归深处见真我",
      "内存释放，执念亦放",
      "算法无边，回向众生",
      "Git Push，业力清零",
      "编译通过，立地成佛",
    ],
  }

  const SPRING_CONFIG = {
    1: { stiffness: 0.15, damping: 0.85 },
    2: { stiffness: 0.25, damping: 0.8 },
    3: { stiffness: 0.1, damping: 0.7 },
    4: { stiffness: 0.05, damping: 0.6 },
    5: { stiffness: 0.2, damping: 0.75 },
    6: { stiffness: 0.03, damping: 0.55 },
  }

  const canvas = document.getElementById("mainCanvas")
  const ctx = canvas.getContext("2d")
  const meritCountEl = document.getElementById("meritCount")
  const phaseNameEl = document.getElementById("phaseName")
  const comboEl = document.getElementById("combo")

  let width, height, centerX, centerY, mokugyoRadius

  class AudioEngine {
    constructor() {
      this.ctx = null
      this.initialized = false
    }

    init() {
      if (this.initialized) return
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)()
        this.initialized = true
      } catch (e) {
        console.warn("Web Audio API not supported")
      }
    }

    playWoodSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(800, now)
      filter.Q.value = 1

      gain.gain.setValueAtTime(0.6, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    }

    playBronzeSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc1.type = "square"
      osc1.frequency.setValueAtTime(880, now)
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(1320, now)

      filter.type = "highpass"
      filter.frequency.setValueAtTime(400, now)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.1)
      osc2.start(now)
      osc2.stop(now + 0.8)

      this.playReverb()
    }

    playReverb() {
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const convolver = this.ctx.createConvolver()
      const rate = this.ctx.sampleRate
      const length = rate * 1.5
      const impulse = this.ctx.createBuffer(2, length, rate)

      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel)
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
        }
      }

      convolver.buffer = impulse
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.15, now)

      const noise = this.ctx.createOscillator()
      noise.frequency.setValueAtTime(440, now)
      const noiseGain = this.ctx.createGain()
      noiseGain.gain.setValueAtTime(0.05, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

      noise.connect(noiseGain)
      noiseGain.connect(convolver)
      convolver.connect(gain)
      gain.connect(this.ctx.destination)

      noise.start(now)
      noise.stop(now + 0.1)
    }

    playCyberSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      const carrier = this.ctx.createOscillator()
      const modulator = this.ctx.createOscillator()
      const modGain = this.ctx.createGain()
      const gain = this.ctx.createGain()

      carrier.type = "sine"
      carrier.frequency.setValueAtTime(440, now)

      modulator.type = "sine"
      modulator.frequency.setValueAtTime(110, now)

      modGain.gain.setValueAtTime(200, now)

      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

      modulator.connect(modGain)
      modGain.connect(carrier.frequency)
      carrier.connect(gain)
      gain.connect(this.ctx.destination)

      carrier.start(now)
      modulator.start(now)
      carrier.stop(now + 0.5)
      modulator.stop(now + 0.5)
    }

    playCosmicSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      const frequencies = [65.41, 82.41, 98, 130.81]
      const masterGain = this.ctx.createGain()
      masterGain.gain.setValueAtTime(0.2, now)
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2)

      frequencies.forEach((freq, i) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now)

        lfo.type = "sine"
        lfo.frequency.setValueAtTime(0.5 + i * 0.2, now)

        lfoGain.gain.setValueAtTime(0.1, now)

        gain.gain.setValueAtTime(0.15 / (i + 1), now)

        lfo.connect(lfoGain)
        lfoGain.connect(gain.gain)
        osc.connect(gain)
        gain.connect(masterGain)

        osc.start(now)
        lfo.start(now)
        osc.stop(now + 2)
        lfo.stop(now + 2)
      })

      masterGain.connect(this.ctx.destination)
    }

    play(phase) {
      this.init()
      switch (phase) {
        case 1:
          this.playWoodSound()
          break
        case 2:
          this.playBronzeSound()
          break
        case 3:
          this.playCyberSound()
          break
        case 4:
          this.playCosmicSound()
          break
        case 5:
          this.playSunSound()
          break
        case 6:
          this.playSourceSound()
          break
      }
    }

    playSunSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      // 明亮、温暖的太阳声音
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = "sine"
      osc1.frequency.setValueAtTime(528, now) // 528Hz - "爱的频率"
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(264, now)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1)
      osc2.stop(now + 1)
    }

    playSourceSound() {
      if (!this.ctx) return
      const now = this.ctx.currentTime

      // 宏大、神秘的创世音效
      const frequencies = [32.7, 65.41, 130.81, 261.63, 523.25]
      const masterGain = this.ctx.createGain()
      masterGain.gain.setValueAtTime(0.15, now)
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 3)

      frequencies.forEach((freq, i) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 2)

        gain.gain.setValueAtTime(0.1 / (i + 1), now)

        osc.connect(gain)
        gain.connect(masterGain)

        osc.start(now)
        osc.stop(now + 3)
      })

      masterGain.connect(this.ctx.destination)
    }
  }

  const audioEngine = new AudioEngine()

  class Particle {
    constructor(x, y, type) {
      this.x = x
      this.y = y
      this.type = type
      this.life = 1
      this.maxLife = 1

      switch (type) {
        case "wood":
          this.vx = (Math.random() - 0.5) * 4
          this.vy = (Math.random() - 0.5) * 4 - 2
          this.gravity = 0.15
          this.size = Math.random() * 4 + 2
          this.color = `hsl(${25 + Math.random() * 15}, ${50 + Math.random() * 30}%, ${30 + Math.random() * 20}%)`
          this.decay = 0.02
          break
        case "bronze":
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 8 + 4
          this.vx = Math.cos(angle) * speed
          this.vy = Math.sin(angle) * speed
          this.gravity = 0.1
          this.size = Math.random() * 3 + 1
          this.color = `hsl(${40 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`
          this.decay = 0.025
          break
        case "cyber":
          this.vx = (Math.random() - 0.5) * 2
          this.vy = -Math.random() * 4 - 2
          this.gravity = -0.02
          this.size = 12
          this.char = Math.random() > 0.5 ? "0" : "1"
          this.color = Math.random() > 0.5 ? "#00FFFF" : "#FF00FF"
          this.decay = 0.015
          break
        case "cosmic":
          const dx = centerX - x
          const dy = centerY - y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          this.vx = (dx / dist) * (Math.random() * 3 + 2)
          this.vy = (dy / dist) * (Math.random() * 3 + 2)
          this.gravity = 0
          this.size = Math.random() * 3 + 1
          this.color = `hsl(${Math.random() * 360}, 80%, 70%)`
          this.decay = 0.02
          break
        case "sun":
          const sunAngle = Math.random() * Math.PI * 2
          const sunSpeed = Math.random() * 6 + 3
          this.vx = Math.cos(sunAngle) * sunSpeed
          this.vy = Math.sin(sunAngle) * sunSpeed
          this.gravity = 0.05
          this.size = Math.random() * 5 + 2
          this.color = `hsl(${35 + Math.random() * 30}, 100%, ${50 + Math.random() * 40}%)`
          this.decay = 0.018
          break
        case "source":
          const sourceAngle = Math.random() * Math.PI * 2
          const sourceSpeed = Math.random() * 8 + 4
          this.vx = Math.cos(sourceAngle) * sourceSpeed
          this.vy = Math.sin(sourceAngle) * sourceSpeed
          this.gravity = -0.01
          this.size = Math.random() * 4 + 1
          this.color = `hsl(${Math.random() * 360}, 100%, 60%)`
          this.decay = 0.016
          break
      }
    }

    update() {
      this.x += this.vx
      this.y += this.vy
      this.vy += this.gravity
      this.life -= this.decay

      if (this.type === "cosmic") {
        const dx = centerX - this.x
        const dy = centerY - this.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        this.vx += (dx / dist) * 0.5
        this.vy += (dy / dist) * 0.5
      } else if (this.type === "source") {
        const dx = centerX - this.x
        const dy = centerY - this.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        this.vx += (dx / dist) * 0.8
        this.vy += (dy / dist) * 0.8
      }

      return this.life > 0
    }

    draw(ctx) {
      ctx.save()
      ctx.globalAlpha = this.life

      if (this.type === "cyber") {
        ctx.font = `${this.size}px monospace`
        ctx.fillStyle = this.color
        ctx.shadowColor = this.color
        ctx.shadowBlur = 10
        ctx.fillText(this.char, this.x, this.y)
      } else {
        ctx.fillStyle = this.color
        if (this.type === "bronze") {
          ctx.shadowColor = this.color
          ctx.shadowBlur = 8
        } else if (this.type === "sun") {
          ctx.shadowColor = this.color
          ctx.shadowBlur = 15
        } else if (this.type === "source") {
          ctx.shadowColor = this.color
          ctx.shadowBlur = 12
        }
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }
  }

  function initCanvas() {
    if (!canvas) {
      console.error('Canvas element not found')
      return
    }

    // ensure canvas pixel size matches window size
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    centerX = width / 2
    centerY = height / 2
    mokugyoRadius = Math.min(width, height) * 0.25

    initStars()
  }

  function initStars() {
    State.stars = []
    for (let i = 0; i < 200; i++) {
      State.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      })
    }
  }

  function getPhase(count) {
    if (count < 100) return 1
    if (count < 500) return 2
    if (count < 1000) return 3
    if (count < 10000) return 4
    if (count < 100000) return 5
    return 6
  }

  function getPhaseName(phase) {
    const names = ["", "初心", "青铜", "赛博", "宇宙", "太阳", "创世"]
    return names[phase]
  }

  function getPhaseColor(phase) {
    const colors = [
      "",
      {
        primary: "#8B4513",
        secondary: "#A0522D",
        glow: "rgba(139, 69, 19, 0.5)",
      },
      {
        primary: "#CD7F32",
        secondary: "#FFD700",
        glow: "rgba(255, 215, 0, 0.5)",
      },
      {
        primary: "#00FFFF",
        secondary: "#FF00FF",
        glow: "rgba(0, 255, 255, 0.5)",
      },
      {
        primary: "#9400D3",
        secondary: "#4B0082",
        glow: "rgba(148, 0, 211, 0.5)",
      },
      {
        primary: "#FDB813",
        secondary: "#FF6B00",
        glow: "rgba(255, 215, 0, 0.8)",
      },
      {
        primary: "#FFFFFF",
        secondary: "#FFD700",
        glow: "rgba(255, 255, 255, 0.9)",
      },
    ]
    return colors[phase]
  }

  function drawBackground() {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))

    if (State.phase === 5) {
      // 太阳形态：明亮的天空背景
      gradient.addColorStop(0, "#FFF5E6")
      gradient.addColorStop(0.5, "#FFE5B4")
      gradient.addColorStop(1, "#87CEEB")
    } else if (State.phase === 6) {
      // 创世形态：绚烂多彩的渐变
      gradient.addColorStop(0, "#FF1493")
      gradient.addColorStop(0.3, "#4B0082")
      gradient.addColorStop(0.6, "#00BFFF")
      gradient.addColorStop(1, "#000000")
    } else if (State.phase === 4) {
      gradient.addColorStop(0, "#1a0033")
      gradient.addColorStop(0.5, "#0d001a")
      gradient.addColorStop(1, "#000000")
    } else {
      gradient.addColorStop(0, "#0a0a1a")
      gradient.addColorStop(0.5, "#050510")
      gradient.addColorStop(1, "#000005")
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    State.stars.forEach((star) => {
      star.brightness += star.speed
      const alpha = (Math.sin(star.brightness) + 1) / 2

      if (State.phase === 5) {
        // 太阳形态：显示云彩效果而不是星星
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`
        ctx.fill()
      }
    })

    if (State.phase >= 3 && State.phase !== 5) {
      drawNebula()
    }
  }

  function drawNebula() {
    const time = Date.now() * 0.001
    ctx.save()
    ctx.globalAlpha = 0.1

    for (let i = 0; i < 3; i++) {
      const x = centerX + Math.sin(time + i * 2) * 100
      const y = centerY + Math.cos(time + i * 2) * 100
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200)

      if (State.phase === 3) {
        gradient.addColorStop(0, i % 2 === 0 ? "rgba(0, 255, 255, 0.3)" : "rgba(255, 0, 255, 0.3)")
      } else {
        gradient.addColorStop(0, `hsla(${(time * 50 + i * 120) % 360}, 80%, 50%, 0.3)`)
      }
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }

    ctx.restore()
  }

  function drawMokugyo() {
    ctx.save()
    ctx.translate(centerX, centerY)

    const config = SPRING_CONFIG[State.phase]
    State.springVx += -State.springX * config.stiffness
    State.springVy += -State.springY * config.stiffness
    State.springVx *= config.damping
    State.springVy *= config.damping
    State.springX += State.springVx
    State.springY += State.springVy

    const scaleX = 1 + State.springX * 0.1
    const scaleY = 1 + State.springY * 0.1

    ctx.scale(scaleX, scaleY)

    switch (State.phase) {
      case 1:
        drawWoodMokugyo()
        break
      case 2:
        drawBronzeMokugyo()
        break
      case 3:
        drawCyberMokugyo()
        break
      case 4:
        drawCosmicMokugyo()
        break
      case 5:
        drawSunMokugyo()
        break
      case 6:
        drawCosmicSourceMokugyo()
        break
    }

    ctx.restore()
  }

  function drawWoodMokugyo() {
    const r = mokugyoRadius

    ctx.save()

    const woodGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.2)
    woodGradient.addColorStop(0, "#A0522D")
    woodGradient.addColorStop(0.3, "#8B4513")
    woodGradient.addColorStop(0.7, "#654321")
    woodGradient.addColorStop(1, "#3D2314")

    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.fillStyle = woodGradient
    ctx.fill()

    drawWoodGrain(r)

    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(60, 30, 15, 0.8)"
    ctx.lineWidth = 3
    ctx.stroke()

    const hollowGradient = ctx.createRadialGradient(0, -r * 0.1, 0, 0, -r * 0.1, r * 0.4)
    hollowGradient.addColorStop(0, "#2D1810")
    hollowGradient.addColorStop(0.5, "#3D2314")
    hollowGradient.addColorStop(1, "#4A2A1A")

    ctx.beginPath()
    ctx.ellipse(0, -r * 0.1, r * 0.35, r * 0.25, 0, 0, Math.PI * 2)
    ctx.fillStyle = hollowGradient
    ctx.fill()
    ctx.strokeStyle = "rgba(50, 25, 12, 0.9)"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  function drawWoodGrain(r) {
    ctx.save()
    ctx.clip()

    for (let i = 0; i < 15; i++) {
      const y = -r * 0.85 + i * ((r * 1.7) / 15)
      const wave = Math.sin(i * 0.5) * 10

      ctx.beginPath()
      ctx.moveTo(-r, y + wave)

      for (let x = -r; x <= r; x += 20) {
        const waveY = y + Math.sin((x + i * 20) * 0.05) * 5 + wave
        ctx.lineTo(x, waveY)
      }

      ctx.strokeStyle = `rgba(60, 30, 15, ${0.1 + Math.random() * 0.1})`
      ctx.lineWidth = 1 + Math.random()
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawBronzeMokugyo() {
    const r = mokugyoRadius
    const time = Date.now() * 0.001

    ctx.save()

    const glowIntensity = Math.sin(time * 2) * 0.2 + 0.3
    ctx.shadowColor = "#FFD700"
    ctx.shadowBlur = 30 * glowIntensity + State.glowIntensity * 50

    const bronzeGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.2)
    bronzeGradient.addColorStop(0, "#E8C87A")
    bronzeGradient.addColorStop(0.3, "#CD7F32")
    bronzeGradient.addColorStop(0.6, "#8B5A2B")
    bronzeGradient.addColorStop(1, "#5C4033")

    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.fillStyle = bronzeGradient
    ctx.fill()

    drawBronzePatina(r)
    drawInscriptions(r)

    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.strokeStyle = "#FFD700"
    ctx.lineWidth = 3
    ctx.stroke()

    const hollowGradient = ctx.createRadialGradient(0, -r * 0.1, 0, 0, -r * 0.1, r * 0.4)
    hollowGradient.addColorStop(0, "#2A1F14")
    hollowGradient.addColorStop(0.5, "#3D2B1F")
    hollowGradient.addColorStop(1, "#5C4033")

    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.1, r * 0.35, r * 0.25, 0, 0, Math.PI * 2)
    ctx.fillStyle = hollowGradient
    ctx.fill()
    ctx.strokeStyle = "#8B5A2B"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  function drawBronzePatina(r) {
    ctx.save()

    const patinaSpots = [
      { x: r * 0.5, y: r * 0.3, size: r * 0.2 },
      { x: -r * 0.4, y: -r * 0.2, size: r * 0.15 },
      { x: r * 0.2, y: -r * 0.4, size: r * 0.12 },
    ]

    patinaSpots.forEach((spot) => {
      const gradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.size)
      gradient.addColorStop(0, "rgba(0, 128, 128, 0.3)")
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()
  }

  function drawInscriptions(r) {
    ctx.save()
    ctx.font = `${r * 0.12}px serif`
    ctx.fillStyle = "rgba(255, 215, 0, 0.6)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const chars = ["福", "德", "禅", "心"]
    const angleOffset = Math.PI * 0.15

    chars.forEach((char, i) => {
      const angle = (i / chars.length) * Math.PI * 2 - Math.PI / 2 + angleOffset
      const x = Math.cos(angle) * r * 0.7
      const y = Math.sin(angle) * r * 0.55

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle + Math.PI / 2)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })

    ctx.restore()
  }

  function drawCyberMokugyo() {
    const r = mokugyoRadius
    const time = Date.now() * 0.001

    ctx.save()

    ctx.shadowColor = "#00FFFF"
    ctx.shadowBlur = 20 + State.glowIntensity * 30

    ctx.strokeStyle = "#00FFFF"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = "#FF00FF"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2)
    ctx.stroke()

    drawCyberGrid(r, time)
    drawDataFlow(r, time)

    ctx.shadowBlur = 0
    ctx.strokeStyle = "#00FFFF"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.1, r * 0.35, r * 0.25, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = "#FF00FF"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.1, r * 0.3, r * 0.2, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = "rgba(0, 255, 255, 0.1)"
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.1, r * 0.25, r * 0.15, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  function drawCyberGrid(r, time) {
    ctx.save()

    const segments = 24
    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)"
    ctx.lineWidth = 0.5

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x1 = Math.cos(angle) * r * 0.3
      const y1 = Math.sin(angle) * r * 0.25
      const x2 = Math.cos(angle) * r
      const y2 = Math.sin(angle) * r * 0.85

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    for (let i = 1; i < 5; i++) {
      const ratio = i / 5
      ctx.beginPath()
      ctx.ellipse(0, 0, r * ratio, r * 0.85 * ratio, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawDataFlow(r, time) {
    ctx.save()

    const flowCount = 8
    for (let i = 0; i < flowCount; i++) {
      const baseAngle = (i / flowCount) * Math.PI * 2
      const flowProgress = (time * 0.5 + i * 0.2) % 1

      const x = Math.cos(baseAngle) * r * flowProgress
      const y = Math.sin(baseAngle) * r * 0.85 * flowProgress

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15)
      gradient.addColorStop(0, i % 2 === 0 ? "rgba(0, 255, 255, 0.8)" : "rgba(255, 0, 255, 0.8)")
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawCosmicMokugyo() {
    const r = mokugyoRadius
    const time = Date.now() * 0.001

    ctx.save()

    State.rotation += 0.01

    drawBlackHole(r, time)
    drawAccretionDisk(r, time)
    drawGravitationalLensing(r, time)

    ctx.restore()
  }

  function drawBlackHole(r, time) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.4)
    gradient.addColorStop(0, "#000000")
    gradient.addColorStop(0.7, "#0a001a")
    gradient.addColorStop(1, "transparent")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawAccretionDisk(r, time) {
    ctx.save()

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = r * (0.5 + ring * 0.15)
      const segments = 60

      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + State.rotation * (1 + ring * 0.3)
        const wobble = Math.sin(angle * 3 + time * 2) * 5
        const x = Math.cos(angle) * (ringRadius + wobble)
        const y = Math.sin(angle) * (ringRadius * 0.4 + wobble * 0.4)

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()

      const hue = (time * 30 + ring * 40) % 360
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.8 - ring * 0.2})`
      ctx.lineWidth = 3 - ring * 0.5
      ctx.shadowColor = `hsl(${hue}, 80%, 60%)`
      ctx.shadowBlur = 20
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawGravitationalLensing(r, time) {
    ctx.save()

    const starCount = 30
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + time * 0.1
      const dist = r * (0.8 + Math.sin(time + i) * 0.2)

      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist * 0.6

      const brightness = (Math.sin(time * 3 + i * 2) + 1) / 2

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`
      ctx.beginPath()
      ctx.arc(x, y, 1 + brightness * 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawSunMokugyo() {
    const r = mokugyoRadius
    const time = Date.now() * 0.001

    ctx.save()

    // 太阳核心光晕
    ctx.shadowColor = "#FFD700"
    ctx.shadowBlur = 50 + State.glowIntensity * 100

    // 外层光晕
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5)
    glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.8)")
    glowGradient.addColorStop(0.5, "rgba(255, 165, 0, 0.3)")
    glowGradient.addColorStop(1, "rgba(255, 100, 0, 0)")

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2)
    ctx.fill()

    // 太阳主体
    const sunGradient = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r)
    sunGradient.addColorStop(0, "#FFFF99")
    sunGradient.addColorStop(0.3, "#FFD700")
    sunGradient.addColorStop(0.7, "#FF8C00")
    sunGradient.addColorStop(1, "#FF4500")

    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = sunGradient
    ctx.fill()

    // 太阳耀斑
    const rayCount = 12
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + time
      const rayLength = r * (1.2 + Math.sin(time * 2 + i) * 0.3)
      const rayWidth = r * 0.15

      ctx.save()
      ctx.translate(Math.cos(angle) * r * 0.8, Math.sin(angle) * r * 0.8)
      ctx.rotate(angle)

      const rayGradient = ctx.createLinearGradient(0, -rayWidth / 2, 0, rayWidth / 2)
      rayGradient.addColorStop(0, "rgba(255, 215, 0, 0)")
      rayGradient.addColorStop(0.5, "rgba(255, 215, 0, 0.8)")
      rayGradient.addColorStop(1, "rgba(255, 215, 0, 0)")

      ctx.fillStyle = rayGradient
      ctx.beginPath()
      ctx.moveTo(0, -rayWidth / 2)
      ctx.lineTo(rayLength, -rayWidth / 4)
      ctx.lineTo(rayLength, rayWidth / 4)
      ctx.lineTo(0, rayWidth / 2)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }

    // 太阳表面细节
    for (let i = 0; i < 5; i++) {
      const spotAngle = Math.random() * Math.PI * 2
      const spotRadius = r * (0.6 + Math.random() * 0.2)
      const spotSize = r * (0.05 + Math.random() * 0.1)

      const spotX = Math.cos(spotAngle) * spotRadius
      const spotY = Math.sin(spotAngle) * spotRadius

      const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotSize)
      spotGradient.addColorStop(0, "rgba(139, 69, 19, 0.4)")
      spotGradient.addColorStop(1, "rgba(139, 69, 19, 0)")

      ctx.fillStyle = spotGradient
      ctx.beginPath()
      ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // 太阳边界
    ctx.strokeStyle = "#FF6347"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()

    ctx.restore()
  }

  function drawCosmicSourceMokugyo() {
    const r = mokugyoRadius
    const time = Date.now() * 0.001

    ctx.save()

    State.rotation += 0.02

    // 能量核心闪烁
    const corePulse = Math.sin(time * 3) * 0.3 + 0.7
    
    // 多层环绕螺旋
    const spiralLayers = 5
    for (let layer = 0; layer < spiralLayers; layer++) {
      const layerRadius = r * (0.3 + (layer / spiralLayers) * 0.7)
      const segments = 120
      const spiralTurns = 3 + layer

      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const progress = i / segments
        const angle = progress * Math.PI * 2 * spiralTurns + State.rotation * (1 - layer * 0.1)
        const wobble = Math.sin(angle * 3 + time * 2) * (r * 0.05)

        const x = Math.cos(angle) * (layerRadius + wobble)
        const y = Math.sin(angle) * (layerRadius + wobble) * 0.6

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      const hue = (time * 60 + layer * 60) % 360
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${(1 - layer / spiralLayers) * 0.8})`
      ctx.lineWidth = 3 - (layer * 0.5)
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`
      ctx.shadowBlur = 20
      ctx.stroke()
    }

    // 中心光源
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.4)
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * corePulse})`)
    coreGradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.4 * corePulse})`)
    coreGradient.addColorStop(1, "rgba(255, 100, 200, 0)")

    ctx.fillStyle = coreGradient
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // 能量粒子暴发
    const particleCount = 20
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * 2
      const particleRadius = r * (0.5 + Math.sin(time + i) * 0.3)

      const px = Math.cos(angle) * particleRadius
      const py = Math.sin(angle) * particleRadius * 0.6

      const hue = (time * 100 + i * 18) % 360
      const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 20)
      particleGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`)
      particleGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`)

      ctx.fillStyle = particleGradient
      ctx.beginPath()
      ctx.arc(px, py, 20, 0, Math.PI * 2)
      ctx.fill()
    }

    // 边界光晕
    const boundaryGradient = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.2)
    boundaryGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
    boundaryGradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.3 * corePulse})`)
    boundaryGradient.addColorStop(1, "rgba(255, 100, 200, 0)")

    ctx.fillStyle = boundaryGradient
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  function spawnParticles(x, y, count) {
    const types = ["", "wood", "bronze", "cyber", "cosmic", "sun", "source"]
    const type = types[State.phase]

    for (let i = 0; i < count; i++) {
      State.particles.push(new Particle(x, y, type))
    }
  }

  function updateParticles() {
    State.particles = State.particles.filter((p) => p.update())
  }

  function drawParticles() {
    State.particles.forEach((p) => p.draw(ctx))
  }

  function createFloatText(x, y, text) {
    const el = document.createElement("div")
    el.className = "float-text"
    el.textContent = text
    el.style.left = x + "px"
    el.style.top = y + "px"

    const colors = ["", "#8B4513", "#FFD700", "#00FFFF", "#9400D3", "#FDB813", "#FFFFFF"]
    el.style.color = colors[State.phase]
    el.style.textShadow = `0 0 10px ${colors[State.phase]}`

    document.body.appendChild(el)

    setTimeout(() => el.remove(), 1500)
  }

  function showZenQuote() {
    const existing = document.querySelector(".zen-quote")
    if (existing) existing.remove()

    const quote = State.zenQuotes[Math.floor(Math.random() * State.zenQuotes.length)]
    const el = document.createElement("div")
    el.className = "zen-quote"
    el.textContent = quote
    document.body.appendChild(el)

    requestAnimationFrame(() => el.classList.add("show"))

    setTimeout(() => el.remove(), 4000)
  }

  function updateCounter() {
    meritCountEl.textContent = State.meritCount
    phaseNameEl.textContent = getPhaseName(State.phase)

    const colors = ["", "#8B4513", "#FFD700", "#00FFFF", "#9400D3", "#FDB813", "#FFFFFF"]
    const gradient = `linear-gradient(135deg, ${colors[State.phase]}, ${colors[State.phase]}88)`
    meritCountEl.style.background = gradient
    meritCountEl.style.webkitBackgroundClip = "text"
    meritCountEl.style.backgroundClip = "text"
  }

  function triggerCombo(count) {
    comboEl.textContent = `COMBO x${count}`
    comboEl.classList.add("active")

    clearTimeout(State.comboTimer)
    State.comboTimer = setTimeout(() => {
      comboEl.classList.remove("active")
    }, 1000)
  }

  function handleHit(x, y) {
    audioEngine.init()

    State.meritCount++
    const newPhase = getPhase(State.meritCount)

    if (newPhase !== State.phase) {
      State.phase = newPhase
      updateCounter()
    }

    const now = Date.now()
    if (now - State.lastHitTime < 200) {
      State.combo++
      if (State.combo >= 5) {
        triggerCombo(State.combo)
      }
    } else {
      State.combo = 1
    }
    State.lastHitTime = now

    State.springVx += 0.5
    State.springVy += 0.3
    State.glowIntensity = 1

    audioEngine.play(State.phase)

    const particleCount = State.phase === 4 ? 30 : State.phase === 3 ? 20 : 15
    spawnParticles(centerX, centerY, particleCount)

    createFloatText(centerX + (Math.random() - 0.5) * 100, centerY - mokugyoRadius, State.combo > 5 ? `+${State.combo}` : "+1")

    if (State.meritCount % 50 === 0) {
      showZenQuote()
    }

    updateCounter()
  }

  function handleInput(e) {
    e.preventDefault()

    let x, y
    if (e.touches) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else {
      x = e.clientX
      y = e.clientY
    }

    const dx = x - centerX
    const dy = y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < mokugyoRadius * 1.2) {
      handleHit(x, y)
    }
  }

  function setupEventListeners() {
    canvas.addEventListener("mousedown", handleInput)
    canvas.addEventListener("touchstart", handleInput, { passive: false })

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleHit(centerX, centerY)
      }
    })

    window.addEventListener("resize", () => {
      initCanvas()
    })
  }

  function gameLoop() {
    ctx.clearRect(0, 0, width, height)

    drawBackground()
    drawMokugyo()
    updateParticles()
    drawParticles()

    State.glowIntensity *= 0.95

    requestAnimationFrame(gameLoop)
  }

  function init() {
    initCanvas()
    setupEventListeners()
    updateCounter()
    gameLoop()
  }

  // 调试：快速跳到指定阶段
  window.debugPhase = function(count) {
    State.meritCount = count
    State.phase = getPhase(count)
    updateCounter()
    console.log(`已跳转到 ${count} 次点击，阶段: ${getPhaseName(State.phase)}`)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
