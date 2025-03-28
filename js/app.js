document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('interactive-banner');
  const particleContainer = document.getElementById('particle-container');
  const lineSvg = document.getElementById('line-svg');
  // theme toggle button ---
  const themeToggleButton = document.getElementById('theme-toggle');

  // Check if essential elements exist
  if (!banner || !particleContainer || !lineSvg) {
    console.error("Banner elements not found!");
    return;
  }

  const particles = [];
  const numParticles = 75; // Keep this relatively low for O(n^2) line drawing
  const interactionRadius = 90; // Increased slightly for more visible effect
  const repulsionStrength = 0.5;
  const baseSpeed = 0.2;
  const damping = 0.95; // Friction

  // Line Drawing Variables
  const maxLineDistance = 100; // Max distance to draw a line
  const lineOpacityFactor = 1.5; // Adjust fade effect (higher = fades faster)

  let bannerRect = banner.getBoundingClientRect();
  // Initialize mouse far away so particles don't jump initially
  let mouseX = -interactionRadius * 5;
  let mouseY = -interactionRadius * 5;
  let animationFrameId = null;

  // Particle Class
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * baseSpeed * 2;
      this.vy = (Math.random() - 0.5) * baseSpeed * 2;
      this.element = document.createElement('div');
      this.element.classList.add('particle');
      // Use getComputedStyle outside the constructor if possible, or store it
      this.size = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-size')) || 3;
      particleContainer.appendChild(this.element);
      this.updatePosition();
    }

    updatePosition() {
      this.element.style.transform = `translate(${Math.round(this.x - this.size / 2)}px, ${Math.round(this.y - this.size / 2)}px)`;
    }

    updatePhysics() {
      // Mouse interaction
      const dxMouse = this.x - mouseX;
      const dyMouse = this.y - mouseY;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      let forceX = 0;
      let forceY = 0;

      if (distMouse < interactionRadius && distMouse > 1) {
        const force = (1 - distMouse / interactionRadius) * repulsionStrength;
        forceX = (dxMouse / distMouse) * force; // Push away from mouse
        forceY = (dyMouse / distMouse) * force;
      }

      // Apply mouse force
      this.vx += forceX;
      this.vy += forceY;

      // Apply damping (friction)
      this.vx *= damping;
      this.vy *= damping;

      // Add slight random drift (optional, remove if unwanted)
      this.vx += (Math.random() - 0.5) * 0.05;
      this.vy += (Math.random() - 0.5) * 0.05;

      // Speed limit
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const maxSpeed = baseSpeed * 5; // Limit max speed
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      // Update position based on velocity
      this.x += this.vx;
      this.y += this.vy;

      // Boundary checks (wrapping)
      if (this.x < -this.size) this.x = bannerRect.width + this.size;
      if (this.x > bannerRect.width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = bannerRect.height + this.size;
      if (this.y > bannerRect.height + this.size) this.y = -this.size;
    }
  } // End Particle Class

  function createParticles() {
    lineSvg.innerHTML = ''; // Clear old lines
    particleContainer.querySelectorAll('.particle').forEach(p => p.remove()); // Clear old particles
    particles.length = 0; // Reset array
    bannerRect = banner.getBoundingClientRect(); // Update dimensions

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * bannerRect.width;
      const y = Math.random() * bannerRect.height;
      particles.push(new Particle(x, y));
    }
  }

  function drawLines() {
    lineSvg.innerHTML = ''; // Simple clear (less efficient but works)

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxLineDistance) {
          // const opacity = 1 - (distance / maxLineDistance); // Linear fade
          const opacity = Math.max(0, 1 - Math.pow(distance / maxLineDistance, lineOpacityFactor)); // Steeper fade

          if (opacity > 0.05) { // Don't draw nearly invisible lines
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', Math.round(p1.x));
            line.setAttribute('y1', Math.round(p1.y));
            line.setAttribute('x2', Math.round(p2.x));
            line.setAttribute('y2', Math.round(p2.y));
            line.setAttribute('stroke-opacity', opacity.toFixed(2));
            // Stroke color/width are handled by CSS (:root --particle-glow-color)
            lineSvg.appendChild(line);
          }
        }
      }
    }
  }

  function animationLoop() {
    // 1. Update physics for all particles
    for (const particle of particles) {
      particle.updatePhysics();
    }

    // 2. Update particle element positions visually AFTER physics updates
    for (const particle of particles) {
      particle.updatePosition();
    }

    // 3. Draw lines based on new positions
    drawLines();

    // Request next frame
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  // --- ADDED: Event Handler Functions ---

  function handleMouseMove(event) {
    // Get mouse position relative to the banner element
    const rect = banner.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  }

  function handleMouseLeave() {
    // Move the interaction point far away when mouse leaves banner
    mouseX = -interactionRadius * 5;
    mouseY = -interactionRadius * 5;
  }

  // Debounce resize function to avoid excessive calls
  let resizeTimeout;

  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log("Resizing...");
      // Cancel the current animation frame before recreating particles
      // This prevents potential errors if resize is rapid
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; // Clear the ID
      }
      createParticles(); // Recreate particles with new dimensions
      // Restart the animation loop ONLY if it was stopped
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animationLoop);
      }
    }, 250); // Wait 250ms after last resize event
  }


  // --- Theme Toggle Logic ---
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    // Optional: Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }

  // Apply saved theme on load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  } // Light is default, no need for 'else' unless you have specific light mode styles to remove

  // Add event listener to the button
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  } else {
    console.warn("Theme toggle button not found.");
  }

  // --- Initialization ---
  createParticles(); // Create initial particles
  // Attach event listeners correctly
  banner.addEventListener('mousemove', handleMouseMove);
  banner.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', handleResize);

  // Start the animation loop
  if (!animationFrameId) { // Only start if not already started (e.g., by resize)
    animationFrameId = requestAnimationFrame(animationLoop);
  }

}); // End DOMContentLoaded
