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
  // --- Configuration & Dynamic Calculation Variables ---
  const particles = [];
  const numParticles = 90; // Keep this relatively low for O(n^2) line drawing

  // --- Physics & Interaction ---
  const interactionRadius = 90; // Increased slightly for more visible effect
  const repulsionStrength = 0.5;
  const baseSpeed = 0.2;
  const damping = 0.97; // Friction
  const repulsionStrengthMouse = 0.3;   // Mouse repulsion strength
  const particleRepulsionStrength = 0.04; // <<< NEW: Particle-particle repulsion strength (tune this!)
  const minSeparationDistance = 8;    // <<< NEW: Min distance for particle repulsion (tune this!)

  // Line Drawing Variables
  const maxLineDistance = 100; // Max distance to draw a line
  const lineOpacityFactor = 1.5; // Adjust fade effect (higher = fades faster)

  let bannerRect = banner.getBoundingClientRect();

  // Initialize mouse far away so particles don't jump initially
  let mouseX = -interactionRadius * 5;
  let mouseY = -interactionRadius * 5;
  let animationFrameId = null;

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * baseSpeed * 2;
      this.vy = (Math.random() - 0.5) * baseSpeed * 2;
      this.element = document.createElement('div');
      this.element.classList.add('particle');
      this.size = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-size')) || 3;
      particleContainer.appendChild(this.element);
      this.updatePosition(); // Initial position
    }

    updatePosition() {
      // Center the particle div on its logical x,y
      this.element.style.transform = `translate(${Math.round(this.x - this.size / 2)}px, ${Math.round(this.y - this.size / 2)}px)`;
    }

    // Physics update is now handled outside in the animationLoop after calculateAllForces
  } // End Particle Class

  // --- NEW: Force Calculation Function ---
  function calculateAllForces() {
    // ... (Keep the calculateAllForces function exactly as you provided in the previous message) ...
    // It handles mouse repulsion and particle-particle repulsion, applying forces directly to p1.vx/vy and p2.vx/vy
    const minDistForMouseCalc = 3 * 3; // Squared min distance for mouse force stability
    const separationThresholdSq = minSeparationDistance * minSeparationDistance; // Squared for efficiency

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      // --- 1. Mouse Interaction ---
      const dxMouse = p1.x - mouseX;
      const dyMouse = p1.y - mouseY;
      const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;

      // Apply mouse repulsion force directly to velocity
      // Use the correct strength variable: repulsionStrengthMouse
      if (distMouseSq < interactionRadius * interactionRadius && distMouseSq > minDistForMouseCalc) {
        const distMouse = Math.sqrt(distMouseSq);
        // Use repulsionStrengthMouse here!
        const forceMagnitude = (1 - distMouse / interactionRadius) * repulsionStrengthMouse;
        const forceX = (dxMouse / distMouse) * forceMagnitude;
        const forceY = (dyMouse / distMouse) * forceMagnitude;
        p1.vx += forceX; // Add mouse force to velocity
        p1.vy += forceY;
      }

      // --- 2. Particle-Particle Repulsion (Optimized Loop) ---
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        // Apply particle-particle repulsion force directly to velocities
        if (distSq < separationThresholdSq && distSq > 0.01) { // Add small > 0 check
          const dist = Math.sqrt(distSq);
          // Using linear falloff as defined before
          const forceMag = (1 - dist / minSeparationDistance) * particleRepulsionStrength;
          const effectiveForceMag = Math.max(0, forceMag); // Ensure repulsive

          const forceX = (dx / dist) * effectiveForceMag;
          const forceY = (dy / dist) * effectiveForceMag;

          // Apply force to both particles (Newton's 3rd Law)
          p1.vx += forceX;
          p1.vy += forceY;
          p2.vx -= forceX; // Apply equal and opposite force
          p2.vy -= forceY;
        }
      }
    } // End force calculation loop
  }

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

    while (lineSvg.firstChild) {
      lineSvg.removeChild(lineSvg.firstChild);
    }

    const mouseIsActive = mouseX > -interactionRadius && mouseY > -interactionRadius; // Check if mouse has entered the banner at least once

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      // --- 1. Particle-to-Particle Lines ---
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distanceSq = dx * dx + dy * dy; // Use squared distance for comparison

        if (distanceSq < maxLineDistance * maxLineDistance) {
          const distance = Math.sqrt(distanceSq); // Calculate actual distance only if needed
          const opacity = Math.max(0, 1 - Math.pow(distance / maxLineDistance, lineOpacityFactor));

          if (opacity > 0.05) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', Math.round(p1.x));
            line.setAttribute('y1', Math.round(p1.y));
            line.setAttribute('x2', Math.round(p2.x));
            line.setAttribute('y2', Math.round(p2.y));
            line.setAttribute('stroke-opacity', opacity.toFixed(2));
            // Optional: Add a class for particle-particle lines if needed later
            // line.classList.add('particle-line');
            lineSvg.appendChild(line);
          }
        }
      } // End particle-to-particle loop (j)

      // --- 2. Particle-to-Cursor Lines (NEW SECTION) ---
      // Only draw lines to cursor if it's likely within the interaction area
      if (mouseIsActive) {
        const dxMouse = p1.x - mouseX;
        const dyMouse = p1.y - mouseY;
        const distanceMouseSq = dxMouse * dxMouse + dyMouse * dyMouse; // Use squared distance

        // Check if particle is close enough to the mouse cursor
        if (distanceMouseSq < maxLineDistance * maxLineDistance) {
          const distanceMouse = Math.sqrt(distanceMouseSq);
          // Use the same opacity calculation, or you could vary it
          const opacityMouse = Math.max(0, 1 - Math.pow(distanceMouse / maxLineDistance, lineOpacityFactor));

          if (opacityMouse > 0.05) {
            const lineToMouse = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            lineToMouse.setAttribute('x1', Math.round(p1.x));
            lineToMouse.setAttribute('y1', Math.round(p1.y));
            lineToMouse.setAttribute('x2', Math.round(mouseX)); // Connect to mouse X
            lineToMouse.setAttribute('y2', Math.round(mouseY)); // Connect to mouse Y
            lineToMouse.setAttribute('stroke-opacity', opacityMouse.toFixed(2));
            // Optional: Add a class to style mouse lines differently
            // lineToMouse.classList.add('mouse-line');
            lineSvg.appendChild(lineToMouse);
          }
        }
      } // End particle-to-cursor check

    } // End main particle loop (i)
  }

  function animationLoop() {
    // --- NEW: Calculate forces first ---
    calculateAllForces(); // Calculate mouse and particle-particle forces

    // --- Then update physics & position ---
    for (const particle of particles) {
      // --- Apply forces, damping, speed limit, boundary checks ---

      // Apply damping (friction) AFTER forces are added
      particle.vx *= damping;
      particle.vy *= damping;

      // Add slight random drift (optional)
      particle.vx += (Math.random() - 0.5) * 0.03; // Reduced random jitter slightly
      particle.vy += (Math.random() - 0.5) * 0.03;

      // Speed limit
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      const maxSpeed = baseSpeed * 5;
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }

      // Update position based on final velocity
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Boundary checks (wrapping) - Use particle size for buffer
      const buffer = particle.size;
      if (particle.x < -buffer) particle.x = bannerRect.width + buffer;
      if (particle.x > bannerRect.width + buffer) particle.x = -buffer;
      if (particle.y < -buffer) particle.y = bannerRect.height + buffer;
      if (particle.y > bannerRect.height + buffer) particle.y = -buffer;

      // --- Update visual position ---
      particle.updatePosition(); // Update the element's transform style
    }

    // 3. Draw lines based on new positions (includes lines to cursor now)
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

})
; // End DOMContentLoaded
