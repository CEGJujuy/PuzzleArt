export class Timer {
  constructor() {
    this.startTime = 0
    this.elapsedTime = 0
    this.isRunning = false
    this.isPaused = false
    this.intervalId = null
    
    this.onTick = null
  }

  start() {
    if (this.isRunning) return
    
    this.startTime = Date.now() - this.elapsedTime
    this.isRunning = true
    this.isPaused = false
    
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.elapsedTime = Date.now() - this.startTime
        const seconds = Math.floor(this.elapsedTime / 1000)
        
        if (this.onTick) {
          this.onTick(seconds)
        }
      }
    }, 1000)
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    if (this.isRunning) {
      this.isPaused = false
      this.startTime = Date.now() - this.elapsedTime
    }
  }

  stop() {
    this.isRunning = false
    this.isPaused = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  reset() {
    this.stop()
    this.elapsedTime = 0
  }

  getTime() {
    if (this.isRunning && !this.isPaused) {
      return Math.floor((Date.now() - this.startTime) / 1000)
    }
    return Math.floor(this.elapsedTime / 1000)
  }
}