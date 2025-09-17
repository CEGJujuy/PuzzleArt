export class TutorialManager {
  constructor() {
    this.modal = document.getElementById('tutorial-modal')
    this.currentStep = 1
    this.totalSteps = 3
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Close button
    document.getElementById('close-tutorial').addEventListener('click', () => {
      this.hide()
    })

    // Navigation buttons
    document.getElementById('prev-step').addEventListener('click', () => {
      this.previousStep()
    })

    document.getElementById('next-step').addEventListener('click', () => {
      this.nextStep()
    })

    // Step dots
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.goToStep(index + 1)
      })
    })

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide()
      }
    })

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('show')) {
        this.hide()
      }
    })
  }

  show() {
    this.modal.classList.add('show')
    this.currentStep = 1
    this.updateStep()
    document.body.style.overflow = 'hidden'
  }

  hide() {
    this.modal.classList.remove('show')
    document.body.style.overflow = ''
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++
      this.updateStep()
    } else {
      this.hide()
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--
      this.updateStep()
    }
  }

  goToStep(step) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step
      this.updateStep()
    }
  }

  updateStep() {
    // Update step content
    document.querySelectorAll('.tutorial-step').forEach((step, index) => {
      step.classList.toggle('active', index + 1 === this.currentStep)
    })

    // Update step dots
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index + 1 === this.currentStep)
    })

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-step')
    const nextBtn = document.getElementById('next-step')

    prevBtn.disabled = this.currentStep === 1
    nextBtn.textContent = this.currentStep === this.totalSteps ? 'Comenzar' : 'Siguiente'
  }
}