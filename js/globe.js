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

    // 1. Generate Global Major Technology & Financial Hubs
    const hubs = [
      { name: "Silicon Valley", lat: 37.77, lon: -122.41, ping: "1.8ms" },
      { name: "New York City", lat: 40.71, lon: -74.00, ping: "2.4ms", showLabel: true },
      { name: "London", lat: 51.50, lon: -0.12, ping: "3.2ms" },
      { name: "Frankfurt", lat: 50.11, lon: 8.68, ping: "4.1ms" },
      { name: "Dubai", lat: 25.20, lon: 55.27, ping: "5.6ms", showLabel: true },
      { name: "Delhi", lat: 28.61, lon: 77.21, ping: "2.8ms", showLabel: true },
      { name: "Bangalore", lat: 12.97, lon: 77.59, ping: "3.0ms", showLabel: true },
      { name: "Singapore", lat: 1.35, lon: 103.82, ping: "3.5ms", showLabel: true },
      { name: "Tokyo", lat: 35.67, lon: 139.65, ping: "4.8ms" },
      { name: "Sydney", lat: -33.86, lon: 151.20, ping: "6.2ms" },
      { name: "São Paulo", lat: -23.55, lon: -46.63, ping: "7.1ms" }
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
        showLabel: h.showLabel || false,
        pulseOffset: Math.random() * Math.PI * 2
      };
    });

    // 2. Generate 3D Continental Landmass Point Matrix
    this.generateContinentDots();

    // 3. Generate Intercontinental Data Arcs
    const routes = [
      [0, 1], // Silicon Valley -> NYC
      [1, 2], // NYC -> London
      [2, 3], // London -> Frankfurt
      [3, 4], // Frankfurt -> Dubai
      [4, 5], // Dubai -> Delhi
      [5, 6], // Delhi -> Bangalore
      [6, 7], // Bangalore -> Singapore
      [7, 8], // Singapore -> Tokyo
      [8, 9], // Tokyo -> Sydney
      [0, 8], // Silicon Valley -> Tokyo (Trans-Pacific)
      [1, 10], // NYC -> São Paulo
      [7, 0]  // Singapore -> Silicon Valley
    ];

    this.arcs = routes.map(([fromIdx, toIdx], i) => ({
      from: this.nodes[fromIdx],
      to: this.nodes[toIdx],
      progress: (i * 0.12) % 1,
      speed: 0.004 + (i % 3) * 0.002,
      altitude: 0.22 + (i % 4) * 0.04
    }));

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

    // --- 6. GLOBAL CYBER NODES & BEACONS WITH CITY LABELS ---
    this.nodes.forEach(node => {
      const p = this.project(node.phi, node.theta, this.rotY, this.rotX);
      if (p.visible && p.z > -r * 0.1) {
        const depthAlpha = Math.min(1, Math.max(0.4, (p.z + r * 0.2) / (r * 1.2)));

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${depthAlpha * 0.12})`;
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(56, 189, 248, ${depthAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Radar pulse animation
        const pulse = (now * 2 + node.pulseOffset) % 2;
        const pulseRadius = 4 + pulse * 14;
        const pulseAlpha = Math.max(0, 1 - pulse * 0.5) * depthAlpha * 0.7;

        ctx.strokeStyle = `rgba(6, 182, 212, ${pulseAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // City name labels on globe (only for featured cities)
        if (node.showLabel && depthAlpha > 0.5) {
          ctx.save();
          ctx.font = `600 ${Math.max(9, 10 * depthAlpha)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = `rgba(165, 180, 252, ${depthAlpha * 0.95})`;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
          ctx.shadowBlur = 4;
          
          // Text background pill
          const textWidth = ctx.measureText(node.name).width;
          const tx = p.x + 8;
          const ty = p.y - 6;
          
          ctx.fillStyle = `rgba(10, 14, 26, ${depthAlpha * 0.7})`;
          ctx.beginPath();
          ctx.roundRect(tx - 3, ty - 10, textWidth + 6, 14, 3);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.fillStyle = `rgba(165, 180, 252, ${depthAlpha * 0.95})`;
          ctx.fillText(node.name, tx, ty);
          ctx.restore();
        }
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
