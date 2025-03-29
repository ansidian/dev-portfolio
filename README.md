# Personal Portfolio Website

[![Deploy Status](https://img.shields.io/github/deployments/ansidian/dev-portfolio/github-pages?label=GitHub%20Pages&logo=github)](https://ansidian.github.io/dev-portfolio/) <!-- Optional: Replace with your actual deployment badge if using Actions -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Optional: Add license badge -->

This repository contains the source code for my personal portfolio website, designed to showcase my projects, skills, and experience as a Full Stack
Web Developer.

**Live Demo:** [https://ansidian.github.io/dev-portfolio/](https://ansidian.github.io/dev-portfolio/)

## ✨ Features

* **Interactive Particle Banner:** A visually engaging fullscreen banner using HTML Canvas API.
    * Particles dynamically connect with lines.
    * Particles interact with mouse movement (repulsion effect).
    * Optimized using a spatial grid for efficient neighbor checks.
    * Customizable particle count, colors (accent/base), speed, size, and interaction parameters.
* **Light/Dark Theme Toggle:** Switch between light and dark modes with a persistent preference stored using `localStorage`.
* **Responsive Design:** Adapts to various screen sizes (further testing/refinement might be needed, particularly for mobile).

## 📸 Screenshot
      
[![Portfolio Site Screenshot](https://github.com/ansidian/dev-portfolio/releases/download/assets/portfolio-site.gif)](#)

## 🛠️ Technologies Used

* **Frontend:**
    * HTML5 (Semantic markup)
    * CSS3
        * Custom Properties (Variables) for easy theming and configuration.
        * Flexbox/Grid
    * JavaScript (ES6+)
        * DOM Manipulation
        * **Canvas API** for the interactive banner rendering and animation.
        * `requestAnimationFrame` for smooth animations.
        * Event Listeners (mouse movement, resize, clicks).
        * `localStorage` for theme persistence.
* **Development/Tooling:**
    * Git & GitHub

## 🔧 Code Highlights (Canvas Animation - `js/app.js`)

* **Particle Class:** Defines the properties (position, velocity, size, color type) and state for each particle.
* **Canvas Setup & Resize:** Handles canvas dimension adjustments and recalculates parameters on window resize.
* **Spatial Grid Optimization:** Uses a grid (`initializeGrid`, `updateGrid`) to efficiently find nearby particles for drawing lines and calculating
  repulsion, avoiding O(n^2) complexity.
* **Physics Simulation:** Implements basic physics including velocity, damping (friction), mouse repulsion, and boundary wrapping.
* **Rendering (`drawCanvas`):** Draws particles and lines connecting them (and to the mouse cursor) based on proximity, fading lines with distance.
* **Animation Loop (`animationLoop`):** Uses `requestAnimationFrame` for smooth, efficient updates and rendering.
* **Theme Integration:** Reads CSS custom properties (`getCssVariable`) to dynamically style particles and lines according to the current theme.

## 🔮 Future Improvements / TODO

*   [ ] Populate the "About Me" section with relevant content.
*   [ ] Add more projects to the showcase.
*   [ ] Implement the "Live Demo" link for the Dolphins Swim Academy project.
*   [ ] Add more detailed responsive styling adjustments if needed.
*   [ ] Potentially add animations or transitions to section appearances.
*   [ ] Further optimize canvas performance if issues arise on lower-end devices.

## 📫 Contact

Andy Su

* **GitHub:** [@ansidian](https://github.com/ansidian)
* **LinkedIn:** [linkedin.com/in/andysu96](https://www.linkedin.com/in/andysu96/)

---

_Feel free to explore the code, raise issues, or suggest improvements!_
