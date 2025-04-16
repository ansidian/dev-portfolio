document.addEventListener('DOMContentLoaded', () => {

  const mobileMaxWidth = 600;

  if (window.innerWidth <= mobileMaxWidth) {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      canvas.style.display = 'none'
    }
  }

  // get references to essential DOM elements
  const banner = document.getElementById('interactive-banner');
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d'); // get the 2d drawing context for the canvas
  const themeToggleButton = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon'); // Get the image element

  // verify that the banner and canvas elements were found
  if (!banner || !canvas || !ctx) {
    console.error("Banner or Canvas elements not found!");
    return; // stop execution if elements are missing
  }

  // --- configuration & state variables ---

  // particle array and settings
  const particles = []; // stores all active particle objects
  const numParticles = 120; // number of particles to create
  const particleAccentProbabilityConfig = 0.4; // chance (0 to 1) a particle is accent color
  const particleJitterMagnitudeX = 0.020;
  const particleJitterMagnitudeY = 0.015;
  const minParticleSizeConfig = 1; // minimum particle size in pixels
  const maxParticleSizeConfig = 5; // maximum particle size in pixels


  // physics and interaction settings
  const interactionRadius = 120; // radius around the mouse cursor where particles react
  const baseSpeed = 0.15;         // initial random speed factor for particles
  const damping = 0.995;          // friction factor applied each frame (closer to 1 = less friction)
  const repulsionStrengthMouse = 0.3; // how strongly particles are pushed away from the mouse
  const particleRepulsionStrength = 0.00; // how strongly particles push each other away
  const minSeparationDistance = 0;      // minimum distance before particle-particle repulsion starts
  const separationThresholdSq = minSeparationDistance * minSeparationDistance; // squared for efficiency in distance checks

  // line drawing settings
  const maxLineDistance = 150; // maximum distance between particles or particle-to-mouse to draw a line
  const maxLineDistanceSq = maxLineDistance * maxLineDistance; // squared for efficiency
  const lineOpacityFactor = 1.5; // controls how quickly line opacity fades with distance (higher = fades faster)

  // dynamic state variables
  let bannerRect = banner.getBoundingClientRect(); // dimensions and position of the banner/canvas container
  let mouseX = -interactionRadius * 5; // initialize mouse X far offscreen to avoid initial jump
  let mouseY = -interactionRadius * 5; // initialize mouse Y far offscreen
  let animationFrameId = null;         // stores the ID for the requestAnimationFrame loop

  // spatial grid variables for optimization
  let grid = [];      // 2d array representing the spatial grid
  let gridCols = 0;   // number of columns in the grid
  let gridRows = 0;   // number of rows in the grid
  const gridCellSize = maxLineDistance; // size of grid cells, based on max interaction distance

  // --- theme and style variables ---

  // helper function to read css custom properties (variables)
  function getCssVariable(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  // variables to store current theme-dependent styles read from css
  let particleColor = getCssVariable('--particle-color');
  let particleAccentColor = getCssVariable('--accent-color');
  let lineColor = getCssVariable('--particle-glow-color');
  let lineThickness = parseFloat(getCssVariable('--particle-line-thickness')) || 1;

  // function to update javascript style variables when the theme changes
  function updateThemeVariables() {
    particleColor = getCssVariable('--particle-color');
    particleAccentColor = getCssVariable('--accent-color');
    lineColor = getCssVariable('--particle-glow-color');
    lineThickness = parseFloat(getCssVariable('--particle-line-thickness')) || 1;
  }


  // --- particle class definition ---

  // defines the structure and initial state of a single particle
  class Particle {
    // static counter to assign unique ids for optimization checks
    static nextId = 0;

    constructor(x, y) {
      this.id = Particle.nextId++; // assign a unique id
      this.x = x;             // current x position
      this.y = y;             // current y position
      this.vx = (Math.random() - 0.5) * baseSpeed; // initial x velocity
      this.vy = (Math.random() - 0.5) * baseSpeed; // initial y velocity

      // calculate random size within the configured range
      this.size = Math.random() * (maxParticleSizeConfig - minParticleSizeConfig) + minParticleSizeConfig;

      // determine accent status using the config variable defined above
      this.isAccent = Math.random() < particleAccentProbabilityConfig;
    }
  }


  // --- canvas and grid setup functions ---
  // adjusts canvas dimensions and re-initializes the spatial grid
  function resizeCanvas() {
    bannerRect = banner.getBoundingClientRect(); // get current banner dimensions
    // set the canvas internal resolution to match its displayed size
    canvas.width = bannerRect.width;
    canvas.height = bannerRect.height;

    // recalculate grid dimensions and structure based on the new canvas size
    initializeGrid();

    // update theme variables (in case styles are size-dependent, though unlikely here)
    updateThemeVariables();
    console.log(`canvas resized to: ${canvas.width}x${canvas.height}`);
  }

  // sets up the grid data structure based on current dimensions
  function initializeGrid() {
    // calculate grid columns and rows based on canvas size and cell size
    gridCols = Math.ceil(bannerRect.width / gridCellSize);
    gridRows = Math.ceil(bannerRect.height / gridCellSize);
    // create the 2d array structure
    grid = new Array(gridRows);
    for (let i = 0; i < gridRows; i++) {
      grid[i] = new Array(gridCols);
      // initialize each cell as an empty array to hold particles
      for (let j = 0; j < gridCols; j++) {
        grid[i][j] = [];
      }
    }
    // reset the unique id counter when grid/particles are recreated
    Particle.nextId = 0;
  }

  // clears and repopulates the spatial grid with current particle positions
  function updateGrid() {
    // clear out particles from all grid cells
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        // check row existence for safety during resize edge cases
        if (!grid[r]) grid[r] = new Array(gridCols);
        grid[r][c] = []; // reset the cell to an empty array
      }
    }

    // place each particle into its corresponding grid cell
    for (const particle of particles) {
      // clamp coordinates to be safely within grid bounds
      const effectiveX = Math.max(0, Math.min(particle.x, bannerRect.width - 1));
      const effectiveY = Math.max(0, Math.min(particle.y, bannerRect.height - 1));
      // calculate the particle's grid column and row
      const col = Math.floor(effectiveX / gridCellSize);
      const row = Math.floor(effectiveY / gridCellSize);

      // add the particle to the correct cell if within grid bounds
      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
        // ensure cell array exists for safety during resize edge cases
        if (!grid[row][col]) grid[row][col] = [];
        grid[row][col].push(particle);
      }
    }
  }


  // --- physics and force calculation ---

  // calculates forces acting on particles (mouse repulsion, particle-particle repulsion)
  function calculateAllForces() {
    const minDistForMouseCalcSq = 3 * 3; // squared minimum distance to avoid extreme forces near mouse

    // iterate through each particle to calculate forces acting upon it
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      // --- 1. mouse interaction force ---
      const dxMouse = p1.x - mouseX;
      const dyMouse = p1.y - mouseY;
      const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;

      // apply repulsion force if particle is within interaction radius of the mouse
      if (distMouseSq < interactionRadius * interactionRadius && distMouseSq > minDistForMouseCalcSq) {
        const distMouse = Math.sqrt(distMouseSq);
        // force decreases linearly with distance from the mouse
        const forceMagnitude = (1 - distMouse / interactionRadius) * repulsionStrengthMouse;
        const forceX = (dxMouse / distMouse) * forceMagnitude; // normalized direction * magnitude
        const forceY = (dyMouse / distMouse) * forceMagnitude;
        // apply force directly to velocity
        p1.vx += forceX;
        p1.vy += forceY;
      }

      // --- 2. particle-particle repulsion force (using spatial grid) ---
      // determine the grid cell of the current particle (p1)
      const p1Col = Math.floor(Math.max(0, Math.min(p1.x, bannerRect.width - 1)) / gridCellSize);
      const p1Row = Math.floor(Math.max(0, Math.min(p1.y, bannerRect.height - 1)) / gridCellSize);

      // check particle's own cell and 8 neighboring cells
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const checkRow = p1Row + rowOffset;
          const checkCol = p1Col + colOffset;

          // ensure the neighboring cell is within grid boundaries
          if (checkRow >= 0 && checkRow < gridRows && checkCol >= 0 && checkCol < gridCols) {
            // check for cell existence (safety for resize edge cases)
            if (!grid[checkRow] || !grid[checkRow][checkCol]) continue;

            // iterate through particles (p2) in the neighboring cell
            for (const p2 of grid[checkRow][checkCol]) {
              // skip self-comparison and avoid double-counting pairs by using unique id
              if (p2.id <= p1.id) continue;

              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distSq = dx * dx + dy * dy;

              // apply repulsion if particles are closer than the minimum separation distance
              if (distSq < separationThresholdSq && distSq > 0.01) { // add small > 0 check
                const dist = Math.sqrt(distSq);
                // force decreases linearly as distance approaches minSeparationDistance
                const forceMag = (1 - dist / minSeparationDistance) * particleRepulsionStrength;
                const effectiveForceMag = Math.max(0, forceMag); // ensure force is repulsive
                const forceX = (dx / dist) * effectiveForceMag; // normalized direction * magnitude
                const forceY = (dy / dist) * effectiveForceMag;

                // apply force symmetrically to both particles (newton's 3rd law)
                p1.vx += forceX;
                p1.vy += forceY;
                p2.vx -= forceX;
                p2.vy -= forceY;
              }
            }
          }
        }
      }
    }
  }


  // --- particle creation ---
  // initializes or re-initializes the particle system
  function createParticles() {
    particles.length = 0; // clear the existing particle array

    // resize canvas (which also updates bannerRect and initializes the grid)
    resizeCanvas();

    // create the specified number of particles with random positions
    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * bannerRect.width;
      const y = Math.random() * bannerRect.height;
      // the particle constructor now handles setting the isAccent and size properties
      particles.push(new Particle(x, y));
    }
    const accentCount = particles.filter(p => p.isAccent).length;
    console.log(`created ${numParticles} particles (${accentCount} accent).`);
  }


  // --- canvas drawing ---
  // renders the current state of particles and lines onto the canvas
  function drawCanvas() {
    // clear the entire canvas before drawing the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // set styles for drawing lines (always use the glow/line color)
    ctx.lineWidth = lineThickness;
    ctx.strokeStyle = lineColor;

    // check if the mouse cursor is likely within the banner area
    const mouseIsActive = mouseX > -interactionRadius && mouseY > -interactionRadius;

    // iterate through each particle to draw lines and the particle itself
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      // --- draw particle-to-particle lines (using spatial grid) ---
      const p1Col = Math.floor(Math.max(0, Math.min(p1.x, bannerRect.width - 1)) / gridCellSize);
      const p1Row = Math.floor(Math.max(0, Math.min(p1.y, bannerRect.height - 1)) / gridCellSize);

      // check neighboring cells for potential line connections
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const checkRow = p1Row + rowOffset;
          const checkCol = p1Col + colOffset;

          // ensure neighbor cell is valid
          if (checkRow >= 0 && checkRow < gridRows && checkCol >= 0 && checkCol < gridCols) {
            if (!grid[checkRow] || !grid[checkRow][checkCol]) continue;

            // iterate through particles (p2) in the neighbor cell
            for (const p2 of grid[checkRow][checkCol]) {
              // avoid drawing line to self or double-drawing lines using unique id
              if (p2.id <= p1.id) continue;

              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distanceSq = dx * dx + dy * dy;

              // draw line if distance is within the maximum limit
              if (distanceSq < maxLineDistanceSq) {
                const distance = Math.sqrt(distanceSq);
                // calculate opacity based on distance (fades as distance increases)
                const opacity = Math.max(0, 1 - Math.pow(distance / maxLineDistance, lineOpacityFactor));

                // only draw line if opacity is above a small threshold
                if (opacity > 0.05) {
                  // set line opacity using globalAlpha (efficient for canvas)
                  ctx.globalAlpha = opacity;
                  // draw the line segment
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
                }
              }
            }
          }
        }
      }

      // --- draw particle-to-cursor lines ---
      if (mouseIsActive) {
        const dxMouse = p1.x - mouseX;
        const dyMouse = p1.y - mouseY;
        const distanceMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;

        // draw line if distance to mouse is within the maximum limit
        if (distanceMouseSq < maxLineDistanceSq) {
          const distanceMouse = Math.sqrt(distanceMouseSq);
          // calculate opacity similarly to particle-particle lines
          const opacityMouse = Math.max(0, 1 - Math.pow(distanceMouse / maxLineDistance, lineOpacityFactor));

          // only draw if opacity is sufficient
          if (opacityMouse > 0.05) {
            ctx.globalAlpha = opacityMouse; // set opacity
            // draw the line segment
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }
      }
    } // end main particle loop for line drawing

    // reset global alpha to default (fully opaque) for drawing particles
    ctx.globalAlpha = 1.0;

    // --- draw all particles ---
    // iterate through all particles
    for (const particle of particles) {
      // set the fill color based on whether the particle is an accent particle
      ctx.fillStyle = particle.isAccent ? particleAccentColor : particleColor;
      ctx.beginPath(); // begin path for each particle
      // draw a circle for the particle using its unique size
      ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill(); // fill the circle
    }
  }


  // --- animation loop ---
  // the main loop called recursively via requestAnimationFrame
  function animationLoop() {
    // 1. update the spatial grid with current particle positions
    updateGrid();

    // 2. calculate all forces acting on the particles
    calculateAllForces();

    // 3. update particle physics (velocity, position, boundaries)
    for (const particle of particles) {
      // apply damping (friction)
      particle.vx *= damping;
      particle.vy *= damping;

      // optional: add subtle random drift/jitter
      particle.vx += (Math.random() - 0.5) * particleJitterMagnitudeX;
      particle.vy += (Math.random() - 0.5) * particleJitterMagnitudeY;

      // enforce speed limit
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      const maxSpeed = baseSpeed * 5; // define a maximum speed
      if (speed > maxSpeed) {
        // scale velocity components down if speed limit is exceeded
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }

      // update position based on velocity
      particle.x += particle.vx;
      particle.y += particle.vy;

      // handle boundary checks (wrap particles around edges)
      // this now correctly uses the particle's individual size
      const buffer = particle.size * 2;
      if (particle.x < -buffer) particle.x = bannerRect.width + buffer;
      if (particle.x > bannerRect.width + buffer) particle.x = -buffer;
      if (particle.y < -buffer) particle.y = bannerRect.height + buffer;
      if (particle.y > bannerRect.height + buffer) particle.y = -buffer;
    }

    // 4. draw the updated state onto the canvas
    drawCanvas();

    // request the next frame, continuing the loop
    animationFrameId = requestAnimationFrame(animationLoop);
  }


  // --- event handlers ---
  // updates mouse coordinates relative to the banner/canvas
  function handleMouseMove(event) {
    // recalculate bannerRect here to get the current position relative to the viewport
    bannerRect = banner.getBoundingClientRect();
    // now calculate mouse position relative to the banner's current top-left corner
    mouseX = event.clientX - bannerRect.left;
    mouseY = event.clientY - bannerRect.top;
  }

  // moves the mouse interaction point far away when the cursor leaves the banner
  function handleMouseLeave() {
    mouseX = -interactionRadius * 5;
    mouseY = -interactionRadius * 5;
  }

  // handles window resize events, debounced for performance
  let resizeTimeout;

  function handleResize() {
    // clear any pending resize action
    clearTimeout(resizeTimeout);
    // set a timeout to execute after a short delay to avoid rapid firing
    resizeTimeout = setTimeout(() => {
      console.log("resizing...");
      // stop the current animation loop before recreating elements
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // recreate particles; this function now also handles canvas resize and grid reset
      createParticles();

      // restart the animation loop if it was stopped
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animationLoop);
      }
    }, 250); // 250ms debounce delay
  }

  function updateThemeIcon() {
    if (!themeIcon) return; // Exit if icon element not found

    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
      themeIcon.src = 'img/light-mode.png'; // Show light icon in dark mode
      themeIcon.alt = 'Switch to light mode';
    } else {
      themeIcon.src = 'img/dark-mode.png'; // Show dark icon in light mode
      themeIcon.alt = 'Switch to dark mode';
    }
  }

  // toggles the color theme and updates relevant js variables
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    updateThemeVariables();
    updateThemeIcon();
  }

  // --- initialization ---
  // apply saved theme preference on page load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  // update js theme variables to match the initial theme (light or dark)
  updateThemeIcon();
  updateThemeVariables();

  // attach event listener to the theme toggle button
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  } else {
    console.warn("theme toggle button not found.");
  }

  // create the initial set of particles and set initial canvas size
  createParticles();

  // attach mouse and resize event listeners
  banner.addEventListener('mousemove', handleMouseMove);
  banner.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', handleResize);

  // start the animation loop if it's not already running
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(animationLoop);
  }
});
