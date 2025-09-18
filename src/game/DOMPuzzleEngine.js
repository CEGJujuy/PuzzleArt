export class DOMPuzzleEngine {
  constructor(container, image, pieceCount, difficulty) {
    this.container = container
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
    
    this.puzzleGrid = document.getElementById('puzzle-grid')
    this.piecesContainer = document.getElementById('puzzle-pieces')
    
    this.setupEventListeners()
  }

  async initialize() {
    this.calculateDimensions()
    this.createGrid()
    this.createPieces()
    this.shufflePieces()
  }

  calculateDimensions() {
    // Calcular tamaño basado en el contenedor
    const containerRect = this.container.getBoundingClientRect()
    const availableWidth = Math.min(containerRect.width - 40, 500)
    const availableHeight = Math.min(containerRect.height - 40, 500)
    
    this.puzzleSize = Math.min(availableWidth, availableHeight)
    this.pieceSize = this.puzzleSize / this.gridSize
    
    // Configurar el grid
    this.puzzleGrid.style.width = this.puzzleSize + 'px'
    this.puzzleGrid.style.height = this.puzzleSize + 'px'
    this.puzzleGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`
    this.puzzleGrid.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`
  }

  createGrid() {
    this.puzzleGrid.innerHTML = ''
    
    // Crear slots del grid solo en modo fácil
    if (this.difficulty === 'easy') {
      for (let i = 0; i < this.pieceCount; i++) {
        const slot = document.createElement('div')
        slot.className = 'puzzle-slot'
        slot.dataset.slotId = i
        this.puzzleGrid.appendChild(slot)
      }
    }
  }

  createPieces() {
    this.pieces = []
    this.piecesContainer.innerHTML = ''
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const pieceId = row * this.gridSize + col
        
        const piece = {
          id: pieceId,
          row,
          col,
          element: this.createPieceElement(row, col, pieceId),
          isConnected: false,
          isDragging: false
        }
        
        this.pieces.push(piece)
        this.piecesContainer.appendChild(piece.element)
      }
    }
  }

  createPieceElement(row, col, pieceId) {
    const piece = document.createElement('div')
    piece.className = 'puzzle-piece'
    piece.dataset.pieceId = pieceId
    piece.style.width = this.pieceSize + 'px'
    piece.style.height = this.pieceSize + 'px'
    
    // Crear la imagen de fondo
    const img = document.createElement('div')
    img.className = 'piece-image'
    img.style.backgroundImage = `url(${this.image.src})`
    img.style.backgroundSize = `${this.puzzleSize}px ${this.puzzleSize}px`
    img.style.backgroundPosition = `-${col * this.pieceSize}px -${row * this.pieceSize}px`
    
    piece.appendChild(img)
    
    // Añadir número de pieza en modo difícil (opcional)
    if (this.difficulty === 'hard') {
      const number = document.createElement('div')
      number.className = 'piece-number'
      number.textContent = pieceId + 1
      piece.appendChild(number)
    }
    
    return piece
  }

  shufflePieces() {
    const containerRect = this.container.getBoundingClientRect()
    const gridRect = this.puzzleGrid.getBoundingClientRect()
    
    this.pieces.forEach(piece => {
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 50) {
        const x = Math.random() * (containerRect.width - this.pieceSize - 40) + 20
        const y = Math.random() * (containerRect.height - this.pieceSize - 40) + 20
        
        // En modo fácil, evitar solapar con el grid
        if (this.difficulty === 'easy') {
          const pieceRect = {
            left: x,
            top: y,
            right: x + this.pieceSize,
            bottom: y + this.pieceSize
          }
          
          const gridBounds = {
            left: gridRect.left - containerRect.left - 20,
            top: gridRect.top - containerRect.top - 20,
            right: gridRect.right - containerRect.left + 20,
            bottom: gridRect.bottom - containerRect.top + 20
          }
          
          if (!this.rectanglesOverlap(pieceRect, gridBounds)) {
            validPosition = true
          }
        } else {
          validPosition = true
        }
        
        if (validPosition) {
          piece.element.style.left = x + 'px'
          piece.element.style.top = y + 'px'
        }
        
        attempts++
      }
    })
  }

  rectanglesOverlap(rect1, rect2) {
    return rect1.left < rect2.right &&
           rect1.right > rect2.left &&
           rect1.top < rect2.bottom &&
           rect1.bottom > rect2.top
  }

  setupEventListeners() {
    // Mouse events
    this.piecesContainer.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    
    // Touch events
    this.piecesContainer.addEventListener('touchstart', this.handleTouchStart.bind(this))
    document.addEventListener('touchmove', this.handleTouchMove.bind(this))
    document.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    // Prevent default behaviors
    this.piecesContainer.addEventListener('dragstart', (e) => e.preventDefault())
    this.piecesContainer.addEventListener('selectstart', (e) => e.preventDefault())
  }

  handleMouseDown(e) {
    if (!this.isActive) return
    this.handlePointerDown(e, { x: e.clientX, y: e.clientY })
  }

  handleTouchStart(e) {
    if (!this.isActive) return
    e.preventDefault()
    const touch = e.touches[0]
    this.handlePointerDown(e, { x: touch.clientX, y: touch.clientY })
  }

  handlePointerDown(e, pos) {
    const pieceElement = e.target.closest('.puzzle-piece')
    if (!pieceElement) return
    
    const pieceId = parseInt(pieceElement.dataset.pieceId)
    const piece = this.pieces.find(p => p.id === pieceId)
    
    if (piece && !piece.isConnected) {
      this.selectedPiece = piece
      piece.isDragging = true
      piece.element.classList.add('dragging')
      
      // Mover al frente
      piece.element.style.zIndex = '1000'
      
      const rect = piece.element.getBoundingClientRect()
      const containerRect = this.container.getBoundingClientRect()
      
      this.dragOffset = {
        x: pos.x - rect.left,
        y: pos.y - rect.top
      }
    }
  }

  handleMouseMove(e) {
    if (!this.isActive) return
    this.handlePointerMove({ x: e.clientX, y: e.clientY })
  }

  handleTouchMove(e) {
    if (!this.isActive) return
    e.preventDefault()
    const touch = e.touches[0]
    this.handlePointerMove({ x: touch.clientX, y: touch.clientY })
  }

  handlePointerMove(pos) {
    if (this.selectedPiece && this.selectedPiece.isDragging) {
      const containerRect = this.container.getBoundingClientRect()
      
      const x = pos.x - containerRect.left - this.dragOffset.x
      const y = pos.y - containerRect.top - this.dragOffset.y
      
      this.selectedPiece.element.style.left = x + 'px'
      this.selectedPiece.element.style.top = y + 'px'
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
      this.selectedPiece.element.classList.remove('dragging')
      this.selectedPiece.element.style.zIndex = ''
      
      this.checkConnection(this.selectedPiece)
      this.selectedPiece = null
    }
  }

  checkConnection(piece) {
    const snapDistance = this.difficulty === 'easy' ? 40 : 30
    
    // Calcular posición correcta
    const gridRect = this.puzzleGrid.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()
    
    const correctX = (gridRect.left - containerRect.left) + (piece.col * this.pieceSize)
    const correctY = (gridRect.top - containerRect.top) + (piece.row * this.pieceSize)
    
    // Posición actual
    const currentX = parseInt(piece.element.style.left)
    const currentY = parseInt(piece.element.style.top)
    
    const distanceX = Math.abs(currentX - correctX)
    const distanceY = Math.abs(currentY - correctY)
    
    if (distanceX < snapDistance && distanceY < snapDistance) {
      // Conectar pieza
      piece.element.style.left = correctX + 'px'
      piece.element.style.top = correctY + 'px'
      piece.isConnected = true
      piece.element.classList.add('connected')
      
      if (this.onPieceConnected) {
        this.onPieceConnected()
      }
      
      // Verificar si el puzzle está completo
      if (this.pieces.every(p => p.isConnected)) {
        if (this.onPuzzleComplete) {
          this.onPuzzleComplete()
        }
      }
    }
  }

  showHint() {
    if (this.showingHint) return
    
    this.showingHint = true
    
    // Mostrar posiciones correctas
    this.pieces.forEach(piece => {
      if (!piece.isConnected) {
        piece.element.classList.add('hint')
      }
    })
    
    setTimeout(() => {
      this.showingHint = false
      this.pieces.forEach(piece => {
        piece.element.classList.remove('hint')
      })
    }, 2000)
  }

  getConnectedPiecesCount() {
    return this.pieces.filter(piece => piece.isConnected).length
  }

  pause() {
    this.isActive = false
    this.container.classList.add('paused')
  }

  resume() {
    this.isActive = true
    this.container.classList.remove('paused')
  }

  destroy() {
    this.isActive = false
    this.puzzleGrid.innerHTML = ''
    this.piecesContainer.innerHTML = ''
  }
}