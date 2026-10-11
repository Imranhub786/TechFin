/**
 * TechFin & Walt Global - High-Performance Interactive 3D World Visualizer
 * Inspired by modern tech engineering interfaces (CodingShuttle, Stripe, GitHub Globe).
 * 
 * Features:
 * - Full 3D interactive drag rotation with momentum and inertia (Mouse & Touch)
 * - Auto-rotation drift with smooth dampening
 * - Holographic continental dot-matrix grid (3D Spherical projection)
 * - Glowing 3D latitude & longitude wireframe rings
 * - Multi-tiered atmospheric glow & volumetric bloom
 * - Global Tech & Financial Nodes with pulsing beacon radar rings
 * - City name labels rendered on the globe (Singapore, Delhi, Bangalore, Dubai, NYC)
 * - 3D Curved data-stream arcs with glowing traveling packets
 * - High-DPI Retina display sharpness
 */

class WaltGlobalVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Rotation & Physics
    this.rotY = 0.5;
    this.rotX = 0.28;
    this.targetRotY = 0.5;
    this.targetRotX = 0.28;
    this.autoRotateSpeed = 0.0035;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.velX = 0;
    this.velY = 0;
    this.isHovered = false;

    // Globe Elements
    this.nodes = [];
    this.dots = [];
    this.arcs = [];

    this.init();
  }

  init() {
    this.setupResolution();
    window.addEventListener('resize', () => this.setupResolution());

    // 1. Generate Global Major Technology & Financial Hubs Across The World
    const hubs = [
      // --- North America ---
      { name: "New York", lat: 40.71, lon: -74.00, ping: "2.1ms" },
      { name: "San Francisco", lat: 37.77, lon: -122.41, ping: "1.4ms" },
      { name: "Los Angeles", lat: 34.05, lon: -118.24, ping: "1.9ms" },
      { name: "Seattle", lat: 47.60, lon: -122.33, ping: "2.5ms" },
      { name: "Chicago", lat: 41.88, lon: -87.63, ping: "2.3ms" },
      { name: "Toronto", lat: 43.65, lon: -79.38, ping: "3.1ms" },
      { name: "Vancouver", lat: 49.28, lon: -123.12, ping: "3.4ms" },
      { name: "Miami", lat: 25.76, lon: -80.19, ping: "2.8ms" },
      { name: "Austin", lat: 30.27, lon: -97.74, ping: "2.2ms" },
      { name: "Mexico City", lat: 19.43, lon: -99.13, ping: "4.5ms" },

      // --- South America ---
      { name: "São Paulo", lat: -23.55, lon: -46.63, ping: "6.2ms" },
      { name: "Buenos Aires", lat: -34.60, lon: -58.38, ping: "7.1ms" },
      { name: "Bogotá", lat: 4.71, lon: -74.07, ping: "5.8ms" },
      { name: "Santiago", lat: -33.45, lon: -70.67, ping: "7.4ms" },
      { name: "Lima", lat: -12.04, lon: -77.04, ping: "6.9ms" },
      { name: "Rio de Janeiro", lat: -22.91, lon: -43.17, ping: "6.5ms" },

      // --- Europe ---
      { name: "London", lat: 51.50, lon: -0.12, ping: "1.8ms" },
      { name: "Frankfurt", lat: 50.11, lon: 8.68, ping: "2.4ms" },
      { name: "Paris", lat: 48.85, lon: 2.35, ping: "2.2ms" },
      { name: "Amsterdam", lat: 52.37, lon: 4.89, ping: "1.9ms" },
      { name: "Dublin", lat: 53.35, lon: -6.26, ping: "2.7ms" },
      { name: "Zurich", lat: 47.37, lon: 8.54, ping: "3.0ms" },
      { name: "Madrid", lat: 40.42, lon: -3.70, ping: "3.4ms" },
      { name: "Stockholm", lat: 59.33, lon: 18.06, ping: "3.8ms" },
      { name: "Berlin", lat: 52.52, lon: 13.40, ping: "2.6ms" },
      { name: "Rome", lat: 41.90, lon: 12.49, ping: "3.5ms" },
      { name: "Warsaw", lat: 52.23, lon: 21.01, ping: "4.1ms" },
      { name: "Vienna", lat: 48.20, lon: 16.37, ping: "3.2ms" },

      // --- Middle East & Africa ---
      { name: "Dubai", lat: 25.20, lon: 55.27, ping: "3.6ms" },
      { name: "Riyadh", lat: 24.71, lon: 46.67, ping: "4.2ms" },
      { name: "Doha", lat: 25.28, lon: 51.53, ping: "3.9ms" },
      { name: "Cairo", lat: 30.04, lon: 31.23, ping: "5.1ms" },
      { name: "Johannesburg", lat: -26.20, lon: 28.04, ping: "8.2ms" },
      { name: "Cape Town", lat: -33.92, lon: 18.42, ping: "8.7ms" },
      { name: "Nairobi", lat: -1.29, lon: 36.82, ping: "7.5ms" },
      { name: "Lagos", lat: 6.52, lon: 3.38, ping: "7.9ms" },

      // --- Asia ---
      { name: "Delhi", lat: 28.61, lon: 77.21, ping: "2.8ms" },
      { name: "Mumbai", lat: 19.07, lon: 72.87, ping: "2.9ms" },
      { name: "Bangalore", lat: 12.97, lon: 77.59, ping: "3.0ms" },
      { name: "Hyderabad", lat: 17.38, lon: 78.48, ping: "3.2ms" },
      { name: "Singapore", lat: 1.35, lon: 103.82, ping: "2.1ms" },
      { name: "Tokyo", lat: 35.67, lon: 139.65, ping: "2.5ms" },
      { name: "Seoul", lat: 37.56, lon: 126.97, ping: "2.7ms" },
      { name: "Hong Kong", lat: 22.31, lon: 114.17, ping: "3.0ms" },
      { name: "Shanghai", lat: 31.23, lon: 121.47, ping: "3.3ms" },
      { name: "Beijing", lat: 39.90, lon: 116.40, ping: "3.5ms" },
      { name: "Taipei", lat: 25.03, lon: 121.56, ping: "3.8ms" },
      { name: "Bangkok", lat: 13.75, lon: 100.50, ping: "4.2ms" },
      { name: "Jakarta", lat: -6.20, lon: 106.84, ping: "4.7ms" },
      { name: "Kuala Lumpur", lat: 3.14, lon: 101.69, ping: "3.9ms" },

      // --- Oceania ---
      { name: "Sydney", lat: -33.86, lon: 151.20, ping: "5.4ms" },
      { name: "Melbourne", lat: -37.81, lon: 144.96, ping: "5.8ms" },
      { name: "Auckland", lat: -36.85, lon: 174.76, ping: "6.5ms" },
      { name: "Perth", lat: -31.95, lon: 115.86, ping: "6.1ms" }
    ];

    this.nodes = hubs.map(h => {
      const phi = (90 - h.lat) * (Math.PI / 180);
      const theta = (h.lon + 180) * (Math.PI / 180);
      return {
        name: h.name,
        lat: h.lat,
        lon: h.lon,
        phi,
        theta,
        ping: h.ping,
        pulseOffset: Math.random() * Math.PI * 2
      };
    });

    // 2. Generate 3D Continental Landmass Point Matrix
    this.generateContinentDots();

    // 3. Generate Intercontinental Data Arcs Between Major Global Hubs
    const routePairs = [
      ["San Francisco", "New York"],
      ["New York", "London"],
      ["London", "Frankfurt"],
      ["Frankfurt", "Paris"],
      ["London", "Amsterdam"],
      ["Dublin", "Frankfurt"],
      ["Frankfurt", "Dubai"],
      ["Dubai", "Riyadh"],
      ["Dubai", "Mumbai"],
      ["Dubai", "Delhi"],
      ["Delhi", "Bangalore"],
      ["Mumbai", "Hyderabad"],
      ["Bangalore", "Singapore"],
      ["Singapore", "Hong Kong"],
      ["Hong Kong", "Tokyo"],
      ["Tokyo", "Seoul"],
      ["Shanghai", "Beijing"],
      ["Singapore", "Sydney"],
      ["Sydney", "Melbourne"],
      ["Sydney", "Auckland"],
      ["San Francisco", "Tokyo"],
      ["Seattle", "Seoul"],
      ["Los Angeles", "Sydney"],
      ["New York", "São Paulo"],
      ["São Paulo", "Buenos Aires"],
      ["Miami", "Bogotá"],
      ["London", "Lagos"],
      ["Cairo", "Johannesburg"],
      ["Singapore", "San Francisco"]
    ];

    this.arcs = [];
    routePairs.forEach(([fromName, toName], i) => {
      const fromNode = this.nodes.find(n => n.name === fromName);
      const toNode = this.nodes.find(n => n.name === toName);
      if (fromNode && toNode) {
        this.arcs.push({
          from: fromNode,
          to: toNode,
          progress: (i * 0.07) % 1,
          speed: 0.0035 + (i % 3) * 0.0015,
          altitude: 0.18 + (i % 4) * 0.04
        });
      }
    });

    // 4. Interactive Drag & Mouse Events
    this.setupInteractivity();

    // 5. Start Animation Loop
    this.animate();
  }

  setupResolution() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: 480, height: 440 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.displayWidth = rect.width || 480;
    this.displayHeight = rect.height || 440;

    this.canvas.width = this.displayWidth * dpr;
    this.canvas.height = this.displayHeight * dpr;
    this.ctx.scale(dpr, dpr);

    this.radius = Math.min(this.displayWidth, this.displayHeight) * 0.38;
  }

  generateContinentDots() {
    this.dots = [];
    // Continental approximate bounding boxes [minLat, maxLat, minLon, maxLon]
    const continents = [
      // North America
      [15, 65, -135, -60],
      // South America
      [-50, 10, -80, -35],
      // Europe
      [36, 68, -10, 40],
      // Africa
      [-35, 35, -15, 50],
      // Asia
      [10, 70, 45, 140],
      // Australia
      [-42, -12, 115, 155]
    ];

    continents.forEach(box => {
      const [minLat, maxLat, minLon, maxLon] = box;
      const count = 55; // More dots for richer look
      for (let i = 0; i < count; i++) {
        const lat = minLat + Math.random() * (maxLat - minLat);
        const lon = minLon + Math.random() * (maxLon - minLon);
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        this.dots.push({ phi, theta, size: 1.2 + Math.random() * 0.8 });
      }
    });

    // Uniform background sphere grid dots
    for (let lat = -70; lat <= 70; lat += 20) {
      for (let lon = -180; lon < 180; lon += 30) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        this.dots.push({ phi, theta, size: 0.9, dim: true });
      }
    }
  }

  setupInteractivity() {
    const el = this.canvas;

    const onPointerDown = (clientX, clientY) => {
      this.isDragging = true;
      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
      this.velX = 0;
      this.velY = 0;
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.lastMouseX;
      const deltaY = clientY - this.lastMouseY;

      this.velX = deltaX * 0.005;
      this.velY = deltaY * 0.005;

      this.rotY += this.velX;
      this.rotX += this.velY;

      // Limit pitch tilt
      this.rotX = Math.max(-1.1, Math.min(1.1, this.rotX));

      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
    };

    const onPointerUp = () => {
      this.isDragging = false;
      el.style.cursor = 'grab';
    };

    // Mouse listeners
    el.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    // Touch listeners
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);

    el.addEventListener('mouseenter', () => {
      this.isHovered = true;
      el.style.cursor = 'grab';
    });
    el.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });
  }

  // 3D Spherical to 2D Screen projection
  project(phi, theta, rotY, rotX, radiusOffset = 0) {
    const r = this.radius * (1 + radiusOffset);

    // Cartesian coordinates
    let x = r * Math.sin(phi) * Math.cos(theta + rotY);
    let y = r * Math.cos(phi);
    let z = r * Math.sin(phi) * Math.sin(theta + rotY);

    // Pitch rotation along X-axis
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = y * cosX - z * sinX;
    const z2 = y * sinX + z * cosX;

    const cx = this.displayWidth / 2;
    const cy = this.displayHeight / 2;

    return {
      x: cx + x,
      y: cy + y2,
      z: z2,
      visible: z2 > -this.radius * 0.18
    };
  }

  animate() {
    // Smooth physics damping & auto-spin
    if (!this.isDragging) {
      this.rotY += this.autoRotateSpeed + this.velX;
      this.rotX += this.velY;
      this.velX *= 0.94;
      this.velY *= 0.94;

      // Gentle pitch bounce back
      this.rotX = Math.max(-0.95, Math.min(0.95, this.rotX));
    }

    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    const cx = w / 2;
    const cy = h / 2;
    const r = this.radius;

    ctx.clearRect(0, 0, w, h);

    // --- 1. OUTER ATMOSPHERIC NEBULA GLOW ---
    const glow = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r * 1.35);
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
    glow.addColorStop(0.35, 'rgba(6, 182, 212, 0.1)');
    glow.addColorStop(0.7, 'rgba(16, 185, 129, 0.04)');
    glow.addColorStop(1, 'transparent');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // --- 2. INNER 3D PLANET SPHERE BASE ---
    const sphereGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    sphereGrad.addColorStop(0, 'rgba(21, 29, 48, 0.88)');
    sphereGrad.addColorStop(0.75, 'rgba(10, 14, 26, 0.94)');
    sphereGrad.addColorStop(1, 'rgba(6, 10, 18, 0.98)');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner rim edge stroke with glow
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // --- 3. 3D LATITUDE & LONGITUDE WIREFRAME RINGS ---
    // Latitude rings
    [-60, -30, 0, 30, 60].forEach(lat => {
      const phi = (90 - lat) * (Math.PI / 180);
      ctx.beginPath();
      let first = true;
      for (let lon = 0; lon <= 360; lon += 6) {
        const theta = lon * (Math.PI / 180);
        const p = this.project(phi, theta, this.rotY, this.rotX);
        if (p.visible) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = lat === 0 ? 'rgba(6, 182, 212, 0.35)' : 'rgba(99, 102, 241, 0.13)';
      ctx.lineWidth = lat === 0 ? 1.4 : 0.8;
      ctx.stroke();
    });

    // Longitude meridian rings
    for (let lon = 0; lon < 360; lon += 45) {
      const theta = lon * (Math.PI / 180);
      ctx.beginPath();
      let first = true;
      for (let lat = -80; lat <= 80; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const p = this.project(phi, theta, this.rotY, this.rotX);
        if (p.visible) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // --- 4. HOLOGRAPHIC CONTINENT POINT MATRIX ---
    this.dots.forEach(dot => {
      const p = this.project(dot.phi, dot.theta, this.rotY, this.rotX);
      if (p.visible) {
        const alpha = Math.max(0.15, (p.z + r * 0.3) / (r * 1.3));
        ctx.fillStyle = dot.dim ? `rgba(99, 102, 241, ${alpha * 0.4})` : `rgba(6, 182, 212, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // --- 5. 3D CURVED DATA-STREAM ARCS ---
    const now = Date.now() * 0.001;
    this.arcs.forEach(arc => {
      arc.progress = (arc.progress + arc.speed) % 1;

      const pFrom = this.project(arc.from.phi, arc.from.theta, this.rotY, this.rotX);
      const pTo = this.project(arc.to.phi, arc.to.theta, this.rotY, this.rotX);

      // Only draw if at least one endpoint is in foreground
      if (pFrom.visible || pTo.visible) {
        const steps = 30;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          // Interpolate spherical angles
          const phiInterp = arc.from.phi + (arc.to.phi - arc.from.phi) * t;
          const thetaInterp = arc.from.theta + (arc.to.theta - arc.from.theta) * t;
          // Arc rises off globe surface in a parabolic curve
          const alt = Math.sin(t * Math.PI) * arc.altitude;
          const pt = this.project(phiInterp, thetaInterp, this.rotY, this.rotX, alt);

          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.24)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Traveling glowing photon packet
        const tPacket = arc.progress;
        const phiPacket = arc.from.phi + (arc.to.phi - arc.from.phi) * tPacket;
        const thetaPacket = arc.from.theta + (arc.to.theta - arc.from.theta) * tPacket;
        const altPacket = Math.sin(tPacket * Math.PI) * arc.altitude;
        const packetPoint = this.project(phiPacket, thetaPacket, this.rotY, this.rotX, altPacket);

        if (packetPoint.visible) {
          // Packet glow tail
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(packetPoint.x, packetPoint.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    // --- 6. GLOBAL CYBER NODES & ROTATING 3D CITY LABELS ---
    const visibleNodes = [];
    this.nodes.forEach(node => {
      const p = this.project(node.phi, node.theta, this.rotY, this.rotX);
      if (p.visible && p.z > -r * 0.12) {
        const depthAlpha = Math.min(1, Math.max(0, (p.z + r * 0.12) / (r * 1.05)));
        visibleNodes.push({ node, p, depthAlpha });
      }
    });

    // Sort back-to-front so closer elements render cleanly over distant ones
    visibleNodes.sort((a, b) => a.p.z - b.p.z);

    visibleNodes.forEach(({ node, p, depthAlpha }) => {
      if (depthAlpha <= 0.05) return;

      // Outer glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${depthAlpha * 0.22})`;
      ctx.fill();

      // Core glowing city node dot
      ctx.fillStyle = `rgba(56, 189, 248, ${depthAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Radar pulse wave animation
      const pulse = (now * 2.2 + node.pulseOffset) % 2;
      const pulseRadius = 3 + pulse * 11;
      const pulseAlpha = Math.max(0, 1 - pulse * 0.6) * depthAlpha * 0.6;
      ctx.strokeStyle = `rgba(6, 182, 212, ${pulseAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating 3D City Name Label
      if (depthAlpha > 0.18) {
        ctx.save();
        const fontSize = Math.max(8, Math.min(10.5, 7.5 + depthAlpha * 3));
        ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;

        const text = node.name;
        const textWidth = ctx.measureText(text).width;
        const tx = p.x + 6;
        const ty = p.y - 3;
        const padX = 4;
        const padY = 2;
        const boxH = fontSize + padY * 2;

        // Dark translucent glass pill background
        ctx.fillStyle = `rgba(10, 14, 26, ${depthAlpha * 0.78})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(tx - padX, ty - fontSize + 1, textWidth + padX * 2, boxH, 3);
        } else {
          ctx.rect(tx - padX, ty - fontSize + 1, textWidth + padX * 2, boxH);
        }
        ctx.fill();

        // Subtle glowing border around pill
        ctx.strokeStyle = `rgba(99, 102, 241, ${depthAlpha * 0.38})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // High-contrast glowing typography
        ctx.fillStyle = `rgba(224, 231, 255, ${depthAlpha * 0.95})`;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';
        ctx.shadowBlur = 3;
        ctx.fillText(text, tx, ty);
        ctx.restore();
      }
    });

    // --- 7. EXTERNAL SATELLITE ORBIT RING ---
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = deg * (Math.PI / 180);
      const orbitR = r * 1.18;
      // Elliptical tilted orbit
      const x = cx + orbitR * Math.cos(rad);
      const y = cy + orbitR * 0.38 * Math.sin(rad);
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- 8. SECOND TILTED ORBIT RING ---
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = deg * (Math.PI / 180);
      const orbitR = r * 1.22;
      const x = cx + orbitR * 0.42 * Math.cos(rad + 0.8);
      const y = cy + orbitR * Math.sin(rad + 0.8) * 0.35;
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.setLineDash([3, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('walt-global-canvas');
  if (canvas) {
    window.waltGlobeInstance = new WaltGlobalVisualizer('walt-global-canvas');
  }
});
