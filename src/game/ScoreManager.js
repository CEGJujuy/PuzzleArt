export class ScoreManager {
  constructor(difficulty, pieceCount) {
    this.difficulty = difficulty
    this.pieceCount = pieceCount
    this.score = 0
    this.basePoints = this.calculateBasePoints()
    
    this.onScoreUpdate = null
  }

  calculateBasePoints() {
    // Base points depend on difficulty and piece count
    const difficultyMultiplier = this.difficulty === 'hard' ? 1.5 : 1
    const pieceMultiplier = Math.sqrt(this.pieceCount) / 2
    
    return Math.floor(100 * difficultyMultiplier * pieceMultiplier)
  }

  addPoints(points) {
    this.score += points
    this.notifyScoreUpdate()
  }

  subtractPoints(points) {
    this.score = Math.max(0, this.score - points)
    this.notifyScoreUpdate()
  }

  addTimeBonus(bonus) {
    this.score += bonus
    this.notifyScoreUpdate()
  }

  getScore() {
    return this.score
  }

  notifyScoreUpdate() {
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score)
    }
  }

  reset() {
    this.score = 0
    this.notifyScoreUpdate()
  }
}