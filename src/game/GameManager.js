import { DOMPuzzleEngine } from './DOMPuzzleEngine.js'
import { Timer } from './Timer.js'
import { ScoreManager } from './ScoreManager.js'

export class GameManager {
  constructor(config) {
    this.config = config
    this.puzzleContainer = document.getElementById('puzzle-board')
    
    this.timer = new Timer()
    this.scoreManager = new ScoreManager(config.difficulty, config.pieces)
    this.puzzleEngine = null
    
    this.isGameActive = false
    this.isPaused = false
    
    this.onVictory = null
    
    this.setupUI()
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
      this.puzzleEngine = new DOMPuzzleEngine(
        this.puzzleContainer,
        image,
        this.config.pieces,
        this.config.difficulty
      )
      
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