import './style.css'
import { GameManager } from './game/GameManager.js'
import { TutorialManager } from './ui/TutorialManager.js'
import { UIManager } from './ui/UIManager.js'

class PuzzleArtApp {
  constructor() {
    this.gameManager = null
    this.tutorialManager = new TutorialManager()
    this.uiManager = new UIManager()
    
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.showTutorialIfFirstTime()
  }

  setupEventListeners() {
    // Tutorial events
    document.getElementById('tutorial-btn').addEventListener('click', () => {
      this.tutorialManager.show()
    })

    // Setup screen events
    this.setupImageSelection()
    this.setupPieceSelection()
    this.setupDifficultySelection()
    this.setupImageUpload()

    // Game control events
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.startGame()
    })

    document.getElementById('new-game-btn').addEventListener('click', () => {
      this.showSetupScreen()
    })

    document.getElementById('play-again-btn').addEventListener('click', () => {
      this.startGame()
    })

    document.getElementById('new-puzzle-btn').addEventListener('click', () => {
      this.showSetupScreen()
    })

    // Game events
    document.getElementById('hint-btn').addEventListener('click', () => {
      if (this.gameManager) {
        this.gameManager.showHint()
      }
    })

    document.getElementById('pause-btn').addEventListener('click', () => {
      if (this.gameManager) {
        this.gameManager.togglePause()
      }
    })
  }

  setupImageSelection() {
    const imageOptions = document.querySelectorAll('.image-option')
    imageOptions.forEach(option => {
      option.addEventListener('click', () => {
        imageOptions.forEach(opt => opt.classList.remove('selected'))
        option.classList.add('selected')
        this.updateStartButton()
      })
    })
  }

  setupPieceSelection() {
    const pieceButtons = document.querySelectorAll('.piece-btn')
    pieceButtons.forEach(button => {
      button.addEventListener('click', () => {
        pieceButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')
      })
    })
  }

  setupDifficultySelection() {
    const difficultyButtons = document.querySelectorAll('.difficulty-btn')
    difficultyButtons.forEach(button => {
      button.addEventListener('click', () => {
        difficultyButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')
      })
    })
  }

  setupImageUpload() {
    const uploadInput = document.getElementById('image-upload')
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          // Clear previous selections
          document.querySelectorAll('.image-option').forEach(opt => 
            opt.classList.remove('selected')
          )
          
          // Store custom image
          this.customImageUrl = e.target.result
          this.updateStartButton()
        }
        reader.readAsDataURL(file)
      }
    })
  }

  updateStartButton() {
    const hasImage = document.querySelector('.image-option.selected') || this.customImageUrl
    const startButton = document.getElementById('start-game-btn')
    startButton.disabled = !hasImage
  }

  getGameConfig() {
    const selectedImage = document.querySelector('.image-option.selected')
    const selectedPieces = document.querySelector('.piece-btn.active')
    const selectedDifficulty = document.querySelector('.difficulty-btn.active')

    return {
      imageUrl: this.customImageUrl || selectedImage?.dataset.image,
      pieces: parseInt(selectedPieces.dataset.pieces),
      difficulty: selectedDifficulty.dataset.difficulty
    }
  }

  startGame() {
    const config = this.getGameConfig()
    
    if (this.gameManager) {
      this.gameManager.destroy()
    }

    this.gameManager = new GameManager(config)
    this.gameManager.onVictory = () => {
      this.showVictoryScreen()
    }

    this.uiManager.showScreen('game-screen')
    this.gameManager.start()
  }

  showSetupScreen() {
    this.uiManager.showScreen('setup-screen')
    if (this.gameManager) {
      this.gameManager.destroy()
      this.gameManager = null
    }
  }

  showVictoryScreen() {
    const stats = this.gameManager.getStats()
    document.getElementById('final-time').textContent = stats.time
    document.getElementById('final-score').textContent = stats.score
    this.uiManager.showScreen('victory-screen')
  }

  showTutorialIfFirstTime() {
    const hasSeenTutorial = localStorage.getItem('puzzleart-tutorial-seen')
    if (!hasSeenTutorial) {
      setTimeout(() => {
        this.tutorialManager.show()
        localStorage.setItem('puzzleart-tutorial-seen', 'true')
      }, 500)
    }
  }
}

// Initialize the app
new PuzzleArtApp()