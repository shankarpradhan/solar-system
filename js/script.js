const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ========== LIGHTING IMPROVEMENTS ==========
const sunLight = new THREE.PointLight(0xffffff, 2, 100);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(0, 1, 1);
scene.add(fillLight);

// ========== SUN ==========
const sunGeometry = new THREE.SphereGeometry(6, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffff33,
  emissive: 0xffaa00,
  emissiveIntensity: 2
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);
sunLight.position.copy(sun.position);

// ========== PLANETS ==========
const planetInfo = {
  mercury: { 
    radius: 1.2, distance: 15, color: 0xbbbbbb, speed: 0.04, roughness: 0.8,
    description: "Mercury is the smallest planet in our solar system and closest to the Sun."
  },
  venus: { 
    radius: 1.5, distance: 20, color: 0xe6c229, speed: 0.015, roughness: 0.7,
    description: "Venus is the second planet from the Sun and Earth's closest planetary neighbor."
  },
  earth: { 
    radius: 1.6, distance: 28, color: 0x3498db, speed: 0.01, roughness: 0.3,
    description: "Earth is the third planet from the Sun and the only known astronomical object to harbor life."
  },
  mars: { 
    radius: 1.3, distance: 38, color: 0xe74c3c, speed: 0.008, roughness: 0.6,
    description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System."
  },
  jupiter: { 
    radius: 3.5, distance: 50, color: 0xf39c12, speed: 0.002, roughness: 0.5,
    description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System."
  },
  saturn: { 
    radius: 3.0, distance: 65, color: 0xf1c40f, speed: 0.0009, roughness: 0.4, ring: true,
    description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter."
  },
  uranus: { 
    radius: 2.5, distance: 80, color: 0x1abc9c, speed: 0.0004, roughness: 0.2,
    description: "Uranus is the seventh planet from the Sun and has the third-largest diameter in our solar system."
  }
};

const planetMeshes = {};
const orbitLines = [];

Object.keys(planetInfo).forEach(name => {
  const planet = planetInfo[name];
  
  const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: planet.roughness,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);
  
  const angle = Math.random() * Math.PI * 2;
  mesh.position.x = Math.cos(angle) * planet.distance;
  mesh.position.z = Math.sin(angle) * planet.distance;
  scene.add(mesh);
  
  if (planet.ring) {
    const ringGeometry = new THREE.RingGeometry(
      planet.radius * 1.4, 
      planet.radius * 2.2, 
      64
    );
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xcdc9c3,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }
  
  planetMeshes[name] = mesh;
  
  const orbitGeometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(theta) * planet.distance,
      0,
      Math.sin(theta) * planet.distance
    ));
  }
  orbitGeometry.setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true,
    opacity: 0.3
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.visible = false;
  scene.add(orbitLine);
  orbitLines.push(orbitLine);
});

// ========== CAMERA ==========
camera.position.set(0, 40, 120);
camera.lookAt(0, 0, 0);

// ========== SEARCH FUNCTIONALITY ==========
const search = document.getElementById('search');
const planetList = document.getElementById('planet-list');

search.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const matches = Object.keys(planetInfo).filter(name => 
    name.includes(query)
  );
  
  if (query.length > 0 && matches.length > 0) {
    planetList.innerHTML = matches.map(name => 
      `<div onclick="openPlanetPage('${name}')">
        ${name.charAt(0).toUpperCase() + name.slice(1)}
      </div>`
    ).join('');
    planetList.style.display = 'block';
  } else {
    planetList.style.display = 'none';
  }
});

// ========== ZOOM FUNCTIONALITY ==========
let targetPlanet = null;
let zoomProgress = 0;
let isZoomed = false;
let isZoomingOut = false;
const defaultCameraPosition = { x: 0, y: 40, z: 120 };

window.zoomToPlanet = function(name) {
  targetPlanet = planetMeshes[name];
  zoomProgress = 0;
  isZoomed = true;
  isZoomingOut = false;
  planetList.style.display = 'none';
  search.value = '';
  document.getElementById('info').textContent = `Viewing: ${name.charAt(0).toUpperCase() + name.slice(1)}`;
};

window.openPlanetPage = function(name) {
  const currentUrl = window.location.href;
  const planetPage = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name.charAt(0).toUpperCase() + name.slice(1)}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          background: #000; 
          color: white;
          padding: 20px;
        }
        .planet-icon {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          margin: 20px auto;
          background: #${planetInfo[name].color.toString(16).padStart(6, '0')};
          box-shadow: 0 0 20px #${planetInfo[name].color.toString(16).padStart(6, '0')};
        }
        .info {
          max-width: 600px;
          margin: 0 auto;
          text-align: left;
          padding: 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .back-btn {
          padding: 10px 20px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>${name.charAt(0).toUpperCase() + name.slice(1)}</h1>
      <div class="planet-icon"></div>
      <div class="info">
        <p>${planetInfo[name].description}</p>
        <p>Distance from Sun: ${planetInfo[name].distance} million km</p>
        <p>Radius: ${planetInfo[name].radius} Earth radii</p>
      </div>
      <button class="back-btn" onclick="window.location.href = '${currentUrl}'">Back to Solar System</button>
    </body>
    </html>
  `;
  
  const newWindow = window.open();
  newWindow.document.write(planetPage);
  newWindow.document.close();
  
  planetList.style.display = 'none';
  search.value = '';
};

document.getElementById('zoomOutBtn').addEventListener('click', () => {
  if (isZoomed || targetPlanet) {
    targetPlanet = null;
    isZoomingOut = true;
    zoomProgress = 0;
    document.getElementById('info').textContent = 'Click any planet to zoom in, or search and click to view details';
  }
});

// ========== ORBIT VISIBILITY TOGGLE ==========
let orbitsVisible = false;
document.getElementById('toggleOrbitsBtn').addEventListener('click', () => {
  orbitsVisible = !orbitsVisible;
  orbitLines.forEach(orbit => orbit.visible = orbitsVisible);
  document.getElementById('toggleOrbitsBtn').textContent = 
    orbitsVisible ? 'Hide Orbits' : 'Show Orbits';
});

// ========== RAYCASTING FOR PLANET CLICKS ==========
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  if (event.target.closest('#planet-list')) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(Object.values(planetMeshes));
  
  if (intersects.length > 0) {
    const planetName = Object.keys(planetMeshes).find(
      name => planetMeshes[name] === intersects[0].object
    );
    zoomToPlanet(planetName);
  }
});

// ========== ANIMATION LOOP ==========
function animate() {
  requestAnimationFrame(animate);
  
  // Animate planets
  Object.keys(planetMeshes).forEach(name => {
    const planet = planetMeshes[name];
    const data = planetInfo[name];
    
    planet.position.x = Math.cos(Date.now() * 0.001 * data.speed) * data.distance;
    planet.position.z = Math.sin(Date.now() * 0.001 * data.speed) * data.distance;
    planet.rotation.y += 0.01;
  });
  
  sun.rotation.y += 0.005;
  
  // Handle camera movement
  if (targetPlanet) {
    zoomProgress += 0.01;
    const targetPosition = {
      x: targetPlanet.position.x * 1.5,
      y: targetPlanet.position.y + 5,
      z: targetPlanet.position.z * 1.5 + 10
    };
    
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x, 
      targetPosition.x, 
      Math.min(zoomProgress, 1)
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y, 
      targetPosition.y, 
      Math.min(zoomProgress, 1)
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z, 
      targetPosition.z, 
      Math.min(zoomProgress, 1)
    );
    
    camera.lookAt(targetPlanet.position);
  } 
  else if (isZoomingOut) {
    zoomProgress += 0.01;
    
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x, 
      defaultCameraPosition.x, 
      Math.min(zoomProgress, 1)
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y, 
      defaultCameraPosition.y, 
      Math.min(zoomProgress, 1)
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z, 
      defaultCameraPosition.z, 
      Math.min(zoomProgress, 1)
    );
    
    if (zoomProgress >= 1) {
      isZoomingOut = false;
      isZoomed = false;
    }
    camera.lookAt(0, 0, 0);
  }
  
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();