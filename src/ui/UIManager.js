export class UIManager {
  constructor() {
    this.currentScreen = 'setup-screen'
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active')
    })

    // Show target screen
    const targetScreen = document.getElementById(screenId)
    if (targetScreen) {
      targetScreen.classList.add('active')
      this.currentScreen = screenId
    }
  }

  getCurrentScreen() {
    return this.currentScreen
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add('show')
      document.body.style.overflow = 'hidden'
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove('show')
      document.body.style.overflow = ''
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    // Add to page
    document.body.appendChild(notification)

    // Show with animation
    setTimeout(() => {
      notification.classList.add('show')
    }, 100)

    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  updateGameStats(stats) {
    if (stats.time !== undefined) {
      const timerElement = document.getElementById('timer')
      if (timerElement) {
        timerElement.textContent = stats.time
      }
    }

    if (stats.score !== undefined) {
      const scoreElement = document.getElementById('score')
      if (scoreElement) {
        scoreElement.textContent = stats.score
      }
    }

    if (stats.pieces !== undefined) {
      const piecesElement = document.getElementById('pieces-count')
      if (piecesElement) {
        piecesElement.textContent = stats.pieces
      }
    }
  }
}