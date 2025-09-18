import { PuzzleEngine } from './PuzzleEngine.js'
import { Timer } from './Timer.js'
import { ScoreManager } from './ScoreManager.js'

export class GameManager {
  constructor(config) {
    this.config = config
    this.canvas = document.getElementById('game-canvas')
    this.ctx = this.canvas.getContext('2d')
    
    this.timer = new Timer()
    this.scoreManager = new ScoreManager(config.difficulty, config.pieces)
    this.puzzleEngine = null
    
    this.isGameActive = false
    this.isPaused = false
    
    this.onVictory = null
    
    this.setupCanvas()
    this.setupUI()
  }

  setupCanvas() {
    const container = this.canvas.parentElement
    const containerWidth = container.clientWidth - 40 // Account for padding
    
    // Calculate optimal canvas size
    let maxSize
    if (window.innerWidth > 1200) {
      maxSize = Math.min(containerWidth, 600) // Desktop: max 600px
    } else if (window.innerWidth > 768) {
      maxSize = Math.min(containerWidth, 500) // Tablet: max 500px
    } else {
      maxSize = Math.min(containerWidth, window.innerWidth - 30) // Mobile: fit screen with margin
    }
    
    // Get device pixel ratio for HD rendering
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // Set display size
    this.canvas.style.width = maxSize + 'px'
    this.canvas.style.height = maxSize + 'px'
    
    // Set actual canvas size for HD rendering
    this.canvas.width = maxSize * devicePixelRatio
    this.canvas.height = maxSize * devicePixelRatio
    
    // Scale the context to match device pixel ratio
    this.ctx.scale(devicePixelRatio, devicePixelRatio)
    
    // Enable image smoothing for better quality
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    // Store display size for calculations
    this.displaySize = maxSize
    this.pixelRatio = devicePixelRatio
  }

  setupUI() {
    // Setup reference image
    const referenceImg = document.getElementById('reference-img')
    referenceImg.src = this.config.imageUrl
    
    // Update pieces count
    const piecesCount = document.getElementById('pieces-count')
    piecesCount.textContent = `0/${this.config.pieces}`
    
    // Setup timer display
    this.timer.onTick = (time) => {
      document.getElementById('timer').textContent = this.formatTime(time)
    }
    
    // Setup score display
    this.scoreManager.onScoreUpdate = (score) => {
      document.getElementById('score').textContent = score
    }
  }

  async start() {
    try {
      // Load image
      const image = await this.loadImage(this.config.imageUrl)
      
      // Initialize puzzle engine
      this.puzzleEngine = new PuzzleEngine(
        this.canvas,
        image,
        this.config.pieces,
        this.config.difficulty
      )
      
      // Pass pixel ratio to puzzle engine
      this.puzzleEngine.pixelRatio = this.pixelRatio
      
      // Setup puzzle events
      this.puzzleEngine.onPieceConnected = () => {
        this.scoreManager.addPoints(100)
        this.updatePiecesCount()
      }
      
      this.puzzleEngine.onPuzzleComplete = () => {
        this.completePuzzle()
      }
      
      // Start the game
      await this.puzzleEngine.initialize()
      this.isGameActive = true
      this.timer.start()
      
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error al cargar la imagen. Por favor, intenta con otra imagen.')
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  updatePiecesCount() {
    const connected = this.puzzleEngine.getConnectedPiecesCount()
    const total = this.config.pieces
    document.getElementById('pieces-count').textContent = `${connected}/${total}`
  }

  completePuzzle() {
    this.isGameActive = false
    this.timer.stop()
    
    // Calculate final score
    const timeBonus = this.calculateTimeBonus()
    this.scoreManager.addTimeBonus(timeBonus)
    
    // Trigger victory
    if (this.onVictory) {
      setTimeout(() => {
        this.onVictory()
      }, 1000) // Small delay for celebration effect
    }
  }

  calculateTimeBonus() {
    const time = this.timer.getTime()
    const maxBonus = 1000
    const timeLimit = 300 // 5 minutes for max bonus
    
    if (time < timeLimit) {
      return Math.floor(maxBonus * (timeLimit - time) / timeLimit)
    }
    return 0
  }

  showHint() {
    if (this.puzzleEngine && this.isGameActive && !this.isPaused) {
      this.puzzleEngine.showHint()
      this.scoreManager.subtractPoints(50) // Penalty for using hint
    }
  }

  togglePause() {
    if (!this.isGameActive) return
    
    this.isPaused = !this.isPaused
    const pauseBtn = document.getElementById('pause-btn')
    
    if (this.isPaused) {
      this.timer.pause()
      this.puzzleEngine.pause()
      pauseBtn.textContent = '▶️ Continuar'
    } else {
      this.timer.resume()
      this.puzzleEngine.resume()
      pauseBtn.textContent = '⏸️ Pausa'
    }
  }

  getStats() {
    return {
      time: this.formatTime(this.timer.getTime()),
      score: this.scoreManager.getScore()
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  destroy() {
    if (this.timer) {
      this.timer.stop()
    }
    if (this.puzzleEngine) {
      this.puzzleEngine.destroy()
    }
    this.isGameActive = false
  }
}