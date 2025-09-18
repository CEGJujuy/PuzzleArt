export class PuzzleEngine {
  constructor(canvas, image, pieceCount, difficulty) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.image = image
    this.pieceCount = pieceCount
    this.difficulty = difficulty
    
    this.pieces = []
    this.selectedPiece = null
    this.dragOffset = { x: 0, y: 0 }
    this.gridSize = Math.sqrt(pieceCount)
    
    this.onPieceConnected = null
    this.onPuzzleComplete = null
    
    this.isActive = true
    this.showingHint = false
    
    this.setupEventListeners()
  }

  async initialize() {
    this.calculateDimensions()
    this.createPieces()
    this.shufflePieces()
    this.render()
  }

  calculateDimensions() {
    // Get canvas size
    const canvasDisplaySize = this.canvas.width / (window.devicePixelRatio || 1)
    
    // Reserve more space for puzzle area and pieces around it
    const puzzlePadding = 40 // Space around the puzzle area
    const piecesArea = 60 // Extra space for pieces to be placed around
    
    // Calculate puzzle size considering both puzzle area and pieces space
    const availableSize = canvasDisplaySize - (puzzlePadding * 2)
    this.puzzleSize = Math.min(availableSize * 0.6, 300) // Puzzle takes 60% of available space, max 300px
    this.pieceSize = this.puzzleSize / this.gridSize
    
    // Use square puzzle area
    this.imageWidth = this.puzzleSize
    this.imageHeight = this.puzzleSize
    
    // Center the puzzle in the canvas
    this.puzzleX = (canvasDisplaySize - this.imageWidth) / 2
    this.puzzleY = (canvasDisplaySize - this.imageHeight) / 2
  }

  createPieces() {
    this.pieces = []
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const piece = {
          id: row * this.gridSize + col,
          row,
          col,
          correctX: this.puzzleX + col * (this.imageWidth / this.gridSize),
          correctY: this.puzzleY + row * (this.imageHeight / this.gridSize),
          currentX: 0,
          currentY: 0,
          width: this.imageWidth / this.gridSize,
          height: this.imageHeight / this.gridSize,
          isConnected: false,
          isDragging: false
        }
        
        this.pieces.push(piece)
      }
    }
  }

  shufflePieces() {
    const canvasDisplaySize = this.canvas.width / (window.devicePixelRatio || 1)
    const margin = 20
    const shuffleArea = {
      x: margin,
      y: margin,
      width: canvasDisplaySize - margin * 2,
      height: canvasDisplaySize - margin * 2
    }
    
    this.pieces.forEach(piece => {
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 50) {
        piece.currentX = shuffleArea.x + Math.random() * (shuffleArea.width - piece.width)
        piece.currentY = shuffleArea.y + Math.random() * (shuffleArea.height - piece.height)
        
        // Check if position overlaps with puzzle area (in easy mode)
        if (this.difficulty === 'easy') {
          const puzzleArea = {
            x: this.puzzleX - 20,
            y: this.puzzleY - 20,
            width: this.imageWidth + 40,
            height: this.imageHeight + 40
          }
          
          if (!this.rectanglesOverlap(piece, puzzleArea)) {
            validPosition = true
          }
        } else {
          validPosition = true
        }
        
        attempts++
      }
    })
  }

  rectanglesOverlap(rect1, rect2) {
    return rect1.currentX < rect2.x + rect2.width &&
           rect1.currentX + rect1.width > rect2.x &&
           rect1.currentY < rect2.y + rect2.height &&
           rect1.currentY + rect1.height > rect2.y
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault())
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault())
  }

  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect()
    const devicePixelRatio = window.devicePixelRatio || 1
    const scaleX = (this.canvas.width / devicePixelRatio) / rect.width
    const scaleY = (this.canvas.height / devicePixelRatio) / rect.height
    
    let clientX, clientY
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  handleMouseDown(e) {
    if (!this.isActive) return
    this.handlePointerDown(this.getEventPos(e))
  }

  handleTouchStart(e) {
    if (!this.isActive) return
    this.handlePointerDown(this.getEventPos(e))
  }

  handlePointerDown(pos) {
    // Find the topmost piece at this position
    let topPiece = null
    let topIndex = -1
    
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i]
      if (this.isPointInPiece(pos, piece) && !piece.isConnected) {
        topPiece = piece
        topIndex = i
        break
      }
    }
    
    if (topPiece) {
      this.selectedPiece = topPiece
      this.selectedPiece.isDragging = true
      
      // Move piece to top of render order
      this.pieces.splice(topIndex, 1)
      this.pieces.push(topPiece)
      
      this.dragOffset = {
        x: pos.x - topPiece.currentX,
        y: pos.y - topPiece.currentY
      }
      
      this.render()
    }
  }

  handleMouseMove(e) {
    if (!this.isActive) return
    this.handlePointerMove(this.getEventPos(e))
  }

  handleTouchMove(e) {
    if (!this.isActive) return
    this.handlePointerMove(this.getEventPos(e))
  }

  handlePointerMove(pos) {
    if (this.selectedPiece && this.selectedPiece.isDragging) {
      this.selectedPiece.currentX = pos.x - this.dragOffset.x
      this.selectedPiece.currentY = pos.y - this.dragOffset.y
      this.render()
    }
  }

  handleMouseUp(e) {
    if (!this.isActive) return
    this.handlePointerUp()
  }

  handleTouchEnd(e) {
    if (!this.isActive) return
    this.handlePointerUp()
  }

  handlePointerUp() {
    if (this.selectedPiece) {
      this.selectedPiece.isDragging = false
      this.checkConnection(this.selectedPiece)
      this.selectedPiece = null
      this.render()
    }
  }

  isPointInPiece(point, piece) {
    return point.x >= piece.currentX &&
           point.x <= piece.currentX + piece.width &&
           point.y >= piece.currentY &&
           point.y <= piece.currentY + piece.height
  }

  checkConnection(piece) {
    const snapDistance = this.difficulty === 'easy' ? 30 : 20
    const distanceX = Math.abs(piece.currentX - piece.correctX)
    const distanceY = Math.abs(piece.currentY - piece.correctY)
    
    if (distanceX < snapDistance && distanceY < snapDistance) {
      piece.currentX = piece.correctX
      piece.currentY = piece.correctY
      piece.isConnected = true
      
      if (this.onPieceConnected) {
        this.onPieceConnected()
      }
      
      // Check if puzzle is complete
      if (this.pieces.every(p => p.isConnected)) {
        if (this.onPuzzleComplete) {
          this.onPuzzleComplete()
        }
      }
    }
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Ensure high quality rendering
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    // Draw background
    this.ctx.fillStyle = '#f8f9fa'
    this.ctx.fillRect(0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1))
    
    // Draw puzzle outline in easy mode
    if (this.difficulty === 'easy') {
      this.drawPuzzleOutline()
    }
    
    // Draw pieces
    this.pieces.forEach(piece => {
      this.drawPiece(piece)
    })
    
    // Draw hint if showing
    if (this.showingHint) {
      this.drawHint()
    }
  }

  drawPuzzleOutline() {
    this.ctx.save()
    this.ctx.strokeStyle = '#666'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    
    // Draw outer border
    this.ctx.strokeRect(this.puzzleX, this.puzzleY, this.imageWidth, this.imageHeight)
    
    // Draw grid lines
    for (let i = 1; i < this.gridSize; i++) {
      // Vertical lines
      const x = this.puzzleX + i * (this.imageWidth / this.gridSize)
      this.ctx.beginPath()
      this.ctx.moveTo(x, this.puzzleY)
      this.ctx.lineTo(x, this.puzzleY + this.imageHeight)
      this.ctx.stroke()
      
      // Horizontal lines
      const y = this.puzzleY + i * (this.imageHeight / this.gridSize)
      this.ctx.beginPath()
      this.ctx.moveTo(this.puzzleX, y)
      this.ctx.lineTo(this.puzzleX + this.imageWidth, y)
      this.ctx.stroke()
    }
    
    this.ctx.setLineDash([])
    this.ctx.restore()
  }

  drawPiece(piece) {
    this.ctx.save()
    
    // Ensure high quality image rendering
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    // Draw shadow
    if (!piece.isConnected) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      this.ctx.shadowBlur = piece.isDragging ? 15 : 8
      this.ctx.shadowOffsetX = piece.isDragging ? 3 : 2
      this.ctx.shadowOffsetY = piece.isDragging ? 3 : 2
    }
    
    // Calculate source coordinates
    const srcX = piece.col * (this.image.width / this.gridSize)
    const srcY = piece.row * (this.image.height / this.gridSize)
    const srcWidth = this.image.width / this.gridSize
    const srcHeight = this.image.height / this.gridSize
    
    // Draw the piece
    this.ctx.drawImage(
      this.image,
      srcX, srcY, srcWidth, srcHeight,
      piece.currentX, piece.currentY, piece.width, piece.height
    )
    
    // Draw border
    this.ctx.shadowColor = ''
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    
    this.ctx.strokeStyle = piece.isConnected ? '#4CAF50' : '#333'
    this.ctx.lineWidth = piece.isConnected ? 2 : 1
    this.ctx.strokeRect(piece.currentX, piece.currentY, piece.width, piece.height)
    
    this.ctx.restore()
  }

  showHint() {
    if (this.showingHint) return
    
    this.showingHint = true
    this.render()
    
    setTimeout(() => {
      this.showingHint = false
      this.render()
    }, 2000)
  }

  drawHint() {
    // Highlight unconnected pieces' correct positions
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'
    this.ctx.strokeStyle = '#4CAF50'
    this.ctx.lineWidth = 2
    
    this.pieces.forEach(piece => {
      if (!piece.isConnected) {
        this.ctx.fillRect(piece.correctX, piece.correctY, piece.width, piece.height)
        this.ctx.strokeRect(piece.correctX, piece.correctY, piece.width, piece.height)
      }
    })
    
    this.ctx.restore()
  }

  getConnectedPiecesCount() {
    return this.pieces.filter(piece => piece.isConnected).length
  }

  pause() {
    this.isActive = false
  }

  resume() {
    this.isActive = true
  }

  destroy() {
    this.isActive = false
    // Remove event listeners would go here if needed
  }
}