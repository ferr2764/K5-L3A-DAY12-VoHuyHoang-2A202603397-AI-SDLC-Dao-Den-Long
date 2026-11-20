import * as THREE from "three";
import "./style.css";
import { Game, TUNING } from "./game.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2350);
scene.fog = new THREE.FogExp2(0x1b2350, 0.008);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

const ambient = new THREE.HemisphereLight(0xcdd3ff, 0x355a55, 1.15);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff2bd, 1.2);
sun.position.set(-20, 35, 20);
sun.castShadow = true;
scene.add(sun);

let currentNight = 1;
let game = new Game({ night: currentNight });
const island = new THREE.Mesh(
  new THREE.CylinderGeometry(40, 42, 1.2, 64),
  new THREE.MeshStandardMaterial({ color: 0x3f7867, roughness: 0.95 }),
);
island.position.y = -0.6;
island.receiveShadow = true;
scene.add(island);

const islandTop = new THREE.Mesh(
  new THREE.CylinderGeometry(39.7, 39.7, 0.12, 64),
  new THREE.MeshStandardMaterial({ color: 0x5d9772, roughness: 1 }),
);
islandTop.position.y = 0.02;
islandTop.receiveShadow = true;
scene.add(islandTop);

function createCharacter() {
  const group = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xe6b98f,
    roughness: 0.72,
    sheen: 0.12,
    clearcoat: 0.05,
  });
  const ao = new THREE.MeshStandardMaterial({
    color: 0xe8e2d0,
    roughness: 0.82,
  });
  const scarf = new THREE.MeshStandardMaterial({
    color: 0xb91832,
    roughness: 0.7,
  });
  const clothShadow = new THREE.MeshStandardMaterial({
    color: 0xcfc6ad,
    roughness: 0.88,
  });

  const legs = new THREE.Group();
  for (const x of [-0.22, 0.22]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 4, 8), ao);
    leg.position.set(x, 0.35, 0);
    leg.castShadow = true;
    legs.add(leg);
  }
  group.add(legs);

  const tunic = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.72, 6, 12), ao);
  tunic.position.y = 1.05;
  tunic.scale.set(1, 1, 0.72);
  tunic.castShadow = true;
  group.add(tunic);

  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.48, 5, 10),
      clothShadow,
    );
    sleeve.position.set(side * 0.58, 1.08, 0);
    sleeve.rotation.z = side * 0.12;
    sleeve.castShadow = true;
    group.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin);
    hand.position.set(side * 0.66, 0.68, 0);
    hand.castShadow = true;
    group.add(hand);
  }

  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 6, 16), scarf);
  sash.position.y = 0.75;
  sash.rotation.x = Math.PI / 2;
  sash.castShadow = true;
  group.add(sash);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 10), skin);
  neck.position.y = 1.56;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), skin);
  head.position.y = 1.82;
  head.scale.set(0.92, 1.05, 0.88);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.355, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
    new THREE.MeshStandardMaterial({ color: 0x17110f, roughness: 0.95 }),
  );
  hair.position.y = 1.91;
  hair.castShadow = true;
  group.add(hair);

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.88, 0.32, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8bd72, roughness: 0.9 }),
  );
  hat.position.y = 2.22;
  hat.rotation.y = Math.PI / 32;
  hat.castShadow = true;
  group.add(hat);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.12, 0.018, 5, 24),
      new THREE.MeshStandardMaterial({ color: 0x9a7a45, roughness: 1 }),
    );
    ring.position.y = 2.12 - i * 0.06;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff7b24,
      emissiveIntensity: 2,
    }),
  );
  lantern.position.set(0.48, 1.55, 0.2);
  lantern.castShadow = true;
  group.add(lantern);
  const lanternLight = new THREE.PointLight(0xffb347, 3.5, 8);
  lanternLight.position.copy(lantern.position);
  group.add(lanternLight);

  const face = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.035, 0.08, 3, 6),
    new THREE.MeshBasicMaterial({ color: 0x5b3b31 }),
  );
  face.position.set(0, 1.82, 0.34);
  face.rotation.x = Math.PI / 2;
  group.add(face);

  return group;
}

const playerMesh = createCharacter();
scene.add(playerMesh);

let environmentObjects = [];

function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.38, 2.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 }),
  );
  trunk.position.y = 1.2;
  trunk.castShadow = true;
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05 - i * 0.12, 1),
      new THREE.MeshStandardMaterial({
        color: i === 1 ? 0x49765a : 0x2f5d50,
        roughness: 1,
        flatShading: true,
      }),
    );
    crown.position.set((i - 1) * 0.38, 2.35 + i * 0.3, (i % 2) * 0.18);
    crown.scale.set(1.15, 0.9, 1.15);
    crown.castShadow = true;
    group.add(crown);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  scene.add(group);
  environmentObjects.push(group);
}

function createRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.72, 0),
    new THREE.MeshStandardMaterial({ color: 0x68706f, roughness: 1, flatShading: true }),
  );
  rock.position.set(x, 0.45 * scale, z);
  rock.scale.set(1.2, 0.65 * scale, 0.9);
  rock.rotation.set(0.12, x * 0.1, -0.08);
  rock.castShadow = true;
  scene.add(rock);
  environmentObjects.push(rock);
}

function createGrass(x, z, scale = 1) {
  const grass = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x78a66b,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.75, 5), material);
    blade.position.set((i - 2) * 0.12, 0.38, (i % 2) * 0.08);
    blade.rotation.z = (i - 2) * 0.12;
    blade.castShadow = true;
    grass.add(blade);
  }
  grass.position.set(x, 0.05, z);
  grass.scale.setScalar(scale);
  scene.add(grass);
  environmentObjects.push(grass);
}

function createFlower(x, z, color = 0xffc6d9) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x4f7e55 }),
  );
  stem.position.y = 0.25;
  group.add(stem);
  const bloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18 }),
  );
  bloom.position.y = 0.56;
  group.add(bloom);
  group.position.set(x, 0.05, z);
  scene.add(group);
  environmentObjects.push(group);
}

function rebuildEnvironment() {
  for (const object of environmentObjects) scene.remove(object);
  environmentObjects = [];

  if (currentNight === 1) {
    const trees = [
      [-29, 18, 1.1], [30, 15, 1], [-31, -5, 1.25], [27, -25, 1.15],
      [-22, -29, 0.9], [5, 31, 1.05], [-8, -34, 1.1], [34, 2, 0.95],
    ];
    trees.forEach(([x, z, s]) => createTree(x, z, s));
  } else if (currentNight === 2) {
    const islandB = new THREE.Mesh(
      new THREE.CylinderGeometry(28, 30, 1.2, 48),
      new THREE.MeshStandardMaterial({ color: 0x3f7867, roughness: 0.95 }),
    );
    islandB.position.set(70, -0.6, 0);
    islandB.receiveShadow = true;
    scene.add(islandB);
    environmentObjects.push(islandB);
    const islandBTop = new THREE.Mesh(
      new THREE.CylinderGeometry(27.7, 27.7, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0x5d9772, roughness: 1 }),
    );
    islandBTop.position.set(70, 0.02, 0);
    islandBTop.receiveShadow = true;
    scene.add(islandBTop);
    environmentObjects.push(islandBTop);
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.18, 4),
      new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 1 }),
    );
    bridge.position.set(35, 0.08, 0);
    bridge.castShadow = true;
    scene.add(bridge);
    environmentObjects.push(bridge);
    for (let x = 28; x <= 42; x += 2) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.28, 4.1),
        new THREE.MeshStandardMaterial({ color: 0x6b4a2f }),
      );
      plank.position.set(x, 0.2, 0);
      scene.add(plank);
      environmentObjects.push(plank);
    }
    [[-20, 18, 1], [18, -20, 1], [52, 18, 1], [88, -18, 1]].forEach(([x, z, s]) => createTree(x, z, s));
  } else {
    const tier1 = new THREE.Mesh(
      new THREE.RingGeometry(12, 24, 48, 1, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x667c58, roughness: 1, side: THREE.DoubleSide }),
    );
    tier1.position.set(0, 3.05, 0);
    tier1.rotation.x = -Math.PI / 2;
    scene.add(tier1);
    environmentObjects.push(tier1);
    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0x73905f, roughness: 1 }),
    );
    tier2.position.set(0, 6.05, 0);
    tier2.receiveShadow = true;
    scene.add(tier2);
    environmentObjects.push(tier2);
  }

  for (let i = 0; i < 46; i++) {
    const angle = i * 2.399;
    const radius = 8 + (i * 11 % 29);
    const cx = currentNight === 2 ? (i % 2 ? 70 : 0) : 0;
    createGrass(cx + Math.cos(angle) * radius, Math.sin(angle) * radius, 0.7 + (i % 4) * 0.12);
  }
  for (let i = 0; i < 10; i++) {
    const angle = i * 0.9;
    const radius = 10 + (i % 3) * 8;
    const cx = currentNight === 2 ? (i % 2 ? 70 : 0) : 0;
    createRock(cx + Math.cos(angle) * radius, Math.sin(angle) * radius, 0.7 + (i % 3) * 0.2);
  }
  for (let i = 0; i < 18; i++) {
    const angle = i * 1.7;
    const radius = 6 + (i % 5) * 5;
    const cx = currentNight === 2 ? (i % 2 ? 70 : 0) : 0;
    createFlower(cx + Math.cos(angle) * radius, Math.sin(angle) * radius, i % 3 === 0 ? 0xffc6d9 : 0xffe58a);
  }
}

rebuildEnvironment();

function lanternMesh(lantern) {
  const group = new THREE.Group();
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x4b3525 }),
  );
  column.position.y = 1.1;
  column.castShadow = true;
  group.add(column);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x3d3156, emissive: 0x000000 }),
  );
  lamp.position.y = 2.45;
  lamp.userData.lanternId = lantern.id;
  lamp.castShadow = true;
  group.add(lamp);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 18, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffe58a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  halo.position.y = 2.45;
  group.add(halo);
  const light = new THREE.PointLight(0xffb347, 0, 16);
  light.position.y = 2.45;
  group.add(light);
  const fuelTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x5b5f6e }),
  );
  fuelTrack.position.set(0, 3.15, 0);
  group.add(fuelTrack);
  const fuelBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.055, 0.065),
    new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  );
  fuelBar.position.set(0, 3.15, 0.01);
  group.add(fuelBar);
  group.position.set(lantern.pos[0], 0, lantern.pos[2]);
  scene.add(group);
  return { group, lamp, halo, light, fuelTrack, fuelBar };
}

let lanternObjects = new Map();
let moteObjects = new Map();
let shadeObjects = new Map();

function rebuildObjects() {
  for (const item of lanternObjects.values()) scene.remove(item.group);
  for (const item of moteObjects.values()) scene.remove(item);
  for (const item of shadeObjects.values()) scene.remove(item);
  lanternObjects = new Map(game.lanterns.map((lantern) => [lantern.id, lanternMesh(lantern)]));
  moteObjects = new Map();
  shadeObjects = new Map();
  syncObjects();
}

function syncObjects() {
  const litCount = game.lanterns.filter((lantern) => lantern.lit).length;
  ambient.intensity = 0.55 + 0.55 * (litCount / Math.max(1, game.lanterns.length));
  for (const lantern of game.lanterns) {
    const object = lanternObjects.get(lantern.id);
    if (!object) continue;
    object.group.position.set(lantern.pos[0], 0, lantern.pos[2]);
    const progress = Math.min(1, lantern.fuel / TUNING.fuel_max);
    object.lamp.material.color.set(lantern.lit ? 0xffb347 : 0x5b5f6e);
    object.lamp.material.emissive.setHex(lantern.lit ? 0xffb347 : 0x000000);
    object.lamp.material.emissiveIntensity = lantern.lit ? 3 : progress * 0.5;
    object.halo.material.opacity = lantern.lit ? (lantern.fuel < 30 ? 0.22 : 0.35) : 0;
    object.halo.scale.setScalar(lantern.lit ? 1.35 : 1);
    object.light.intensity = lantern.lit ? 18 : progress * 1.2;
    const litScale = lantern.lit ? 1 : 0.8;
    object.group.scale.set(litScale, litScale, litScale);
    const fuelRatio = lantern.lit ? Math.max(0, lantern.fuel / TUNING.fuel_max) : 0;
    object.fuelBar.scale.x = fuelRatio;
    object.fuelBar.position.x = -(1 - fuelRatio) * 0.42;
    object.fuelTrack.visible = lantern.lit;
    object.fuelBar.visible = lantern.lit;
    if (lantern.lit && lantern.fuel < TUNING.low_fuel_threshold) {
      const blink = Math.sin(performance.now() * 0.006) > 0;
      object.lamp.material.emissiveIntensity = blink ? 3.5 : 0.8;
    }
  }

  for (const [id, object] of moteObjects) {
    if (!game.motes.some((mote) => mote.id === id)) {
      scene.remove(object);
      moteObjects.delete(id);
    }
  }
  for (const mote of game.motes) {
    if (!moteObjects.has(mote.id)) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffdf78 }),
      );
      mesh.position.set(mote.pos[0], 0.6, mote.pos[2]);
      scene.add(mesh);
      moteObjects.set(mote.id, mesh);
    }
  }

  for (const [id, object] of shadeObjects) {
    if (!game.shades.some((shade) => shade.id === id)) {
      scene.remove(object);
      shadeObjects.delete(id);
    }
  }
  for (const shade of game.shades) {
    let mesh = shadeObjects.get(shade.id);
    if (!mesh) {
      mesh = new THREE.Group();
      const ink = new THREE.MeshPhysicalMaterial({
        color: 0x120a1a,
        emissive: 0x2c113d,
        emissiveIntensity: 0.9,
        roughness: 0.35,
        metalness: 0.05,
        clearcoat: 0.25,
        clearcoatRoughness: 0.5,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 12), ink);
      body.scale.set(0.9, 1.25, 0.78);
      body.position.y = 0.85;
      body.castShadow = true;
      mesh.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), ink);
      head.position.set(0, 1.72, 0);
      head.scale.set(1, 0.78, 0.82);
      head.castShadow = true;
      mesh.add(head);
      for (const side of [-1, 1]) {
        const tendril = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.11, 0.65, 5, 8),
          ink,
        );
        tendril.position.set(side * 0.55, 0.42, 0);
        tendril.rotation.z = side * 0.7;
        tendril.castShadow = true;
        mesh.add(tendril);
      }
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0x7a3cff,
      });
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMaterial);
        eye.position.set(side * 0.16, 1.74, 0.42);
        mesh.add(eye);
      }
      scene.add(mesh);
      shadeObjects.set(shade.id, mesh);
    }
    mesh.position.set(shade.pos[0], 0.9, shade.pos[2]);
    mesh.visible = true;
    mesh.traverse((child) => {
      if (child.material?.emissive) {
        child.material.emissive.setHex(shade.state === "stunned" ? 0x3a3450 : 0x2c113d);
        child.material.emissiveIntensity = shade.state === "stunned" ? 1.8 : 0.9;
      }
    });
  }
}

rebuildObjects();

const keys = new Set();
window.addEventListener("keydown", (event) => keys.add(event.code));
window.addEventListener("keyup", (event) => keys.delete(event.code));
let yaw = 0;
let previousInteract = false;
let previousPulse = false;
let previousPause = false;
let previousDash = false;
let mouseGroundMove = null;
let mouseInteract = false;
let mousePulse = false;
let buttonInteract = false;
let buttonJump = false;
let buttonDash = false;
let gameStarted = false;

const savedSettings = JSON.parse(localStorage.getItem("dao-den-long-settings") ?? '{"volume":50,"sensitivity":18}');
let mouseSensitivity = (savedSettings.sensitivity ?? 18) / 100;
let masterVolume = (savedSettings.volume ?? 50) / 100;
let colorblindMode = localStorage.getItem("dao-den-long-colorblind") === "true";
document.querySelector("#colorblind-mode").checked = colorblindMode;
document.body.classList.toggle("colorblind", colorblindMode);

document.querySelector("#volume").value = Math.round(masterVolume * 100);
document.querySelector("#sensitivity").value = Math.round(savedSettings.sensitivity ?? 18);

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playTone(frequency = 440, duration = 0.08) {
  if (!masterVolume) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = masterVolume * 0.12;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

document.querySelector("#open-settings").addEventListener("click", () => {
  document.querySelector("#settings-menu").hidden = false;
});
document.querySelector("#close-settings").addEventListener("click", () => {
  masterVolume = Number(document.querySelector("#volume").value) / 100;
  const sensitivity = Number(document.querySelector("#sensitivity").value);
  mouseSensitivity = sensitivity / 100;
  colorblindMode = document.querySelector("#colorblind-mode").checked;
  localStorage.setItem("dao-den-long-colorblind", String(colorblindMode));
  document.body.classList.toggle("colorblind", colorblindMode);
  localStorage.setItem("dao-den-long-settings", JSON.stringify({
    volume: Math.round(masterVolume * 100),
    sensitivity,
  }));
  document.querySelector("#settings-menu").hidden = true;
});
document.querySelector("#start-game").addEventListener("click", () => {
  gameStarted = true;
  currentNight = 1;
  game = new Game({ night: 1 });
  rebuildObjects();
  rebuildEnvironment();
  document.querySelector("#main-menu").hidden = true;
  if (audioContext.state === "suspended") audioContext.resume();
  playTone(660, 0.12);
});

canvas.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas) {
    yaw += event.movementX * mouseSensitivity;
  }
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouseGroundMove = true;
    mousePulse = true;
  }
  if (event.button === 2) mouseInteract = true;
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    mouseGroundMove = null;
    mousePulse = false;
  }
  if (event.button === 2) mouseInteract = false;
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

const depositButton = document.querySelector("#deposit-button");
depositButton.addEventListener("pointerdown", (event) => {
  event.preventPropagation();
  buttonInteract = true;
});

document.querySelector("#jump-button").addEventListener("pointerdown", (event) => {
  event.preventPropagation();
  buttonJump = true;
});
document.querySelector("#dash-button").addEventListener("pointerdown", (event) => {
  event.preventPropagation();
  buttonDash = true;
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getMouseMoveInput() {
  if (!mouseGroundMove) return null;
  pointer.set(0, 0);
  raycaster.setFromCamera(pointer, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundPoint = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, groundPoint)) return null;

  const dx = groundPoint.x - game.player.pos[0];
  const dz = groundPoint.z - game.player.pos[2];
  if (Math.hypot(dx, dz) < 0.35) return [0, 0];

  const theta = yaw * Math.PI / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [dx * cos - dz * sin, dx * sin + dz * cos];
}

function hud() {
  document.querySelector("#flames").textContent = game.player.flames;
  document.querySelector("#lanterns").textContent =
    `${game.lanterns.filter((lantern) => lantern.lit).length}/${game.lanterns.length}`;
  document.querySelector("#score").textContent = game.score;
  const totalSeconds = Math.max(0, Math.ceil(game.timeLeft));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const time = document.querySelector("#time");
  time.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  time.classList.toggle("danger", totalSeconds <= 30);

  const bar = document.querySelector("#mote-bar");
  bar.innerHTML = "";
  bar.setAttribute("title", `${game.player.carried}/${game.player.capacity} đom đóm`);
  bar.setAttribute("aria-label", `${game.player.carried}/${game.player.capacity} đom đóm`);
  for (let i = 0; i < game.player.capacity; i++) {
    const slot = document.createElement("span");
    slot.className = `mote-slot${i < game.player.carried ? " filled" : ""}`;
    bar.appendChild(slot);
  }
  document.querySelector("#dash-cd").textContent =
    game.player.dashCdTicks > 0
      ? `Lướt: ${(game.player.dashCdTicks / 60).toFixed(1)}s`
      : "Lướt sẵn sàng";
  document.querySelector("#pulse-cd").textContent =
    game.player.pulseCdTicks > 0
      ? `Tỏa sáng: ${(game.player.pulseCdTicks / 60).toFixed(1)}s`
      : "Tỏa sáng sẵn sàng";

  const unlit = game.lanterns
    .filter((lantern) => !lantern.lit || lantern.fuel < TUNING.fuel_max)
    .sort((a, b) =>
      Math.hypot(game.player.pos[0] - a.pos[0], game.player.pos[2] - a.pos[2]) -
      Math.hypot(game.player.pos[0] - b.pos[0], game.player.pos[2] - b.pos[2])
      || a.id.localeCompare(b.id),
    );
  const nearest = unlit[0];
  const hint = document.querySelector("#lantern-hint");
  hint.hidden = !nearest;
  if (nearest) {
    const distance = Math.hypot(
      game.player.pos[0] - nearest.pos[0],
      game.player.pos[2] - nearest.pos[2],
    );
    hint.classList.toggle("ready", distance <= TUNING.interact_radius);
    if (distance <= TUNING.interact_radius) {
      if (game.player.carried > 0) {
        hint.textContent =
          nearest.lit
            ? `Châm dầu ${nearest.id}: ${nearest.fuel.toFixed(1)} / 100`
            : `Thắp lại ${nearest.id}: 5 đom`;
      } else {
        hint.textContent =
          `Cần thêm đom đóm — ${nearest.id}: ${nearest.deposited}/${TUNING.lantern_cost}`;
      }
    } else {
      hint.textContent =
        nearest.lit
          ? `Đèn ${nearest.id}: ${nearest.fuel.toFixed(1)} dầu · ${distance.toFixed(1)} m`
          : `Đèn gần nhất ${nearest.id}: tắt · ${distance.toFixed(1)} m`;
    }
  } else {
    hint.textContent = "Tất cả đèn đã đầy dầu";
    hint.hidden = false;
    hint.classList.add("ready");
  }
}

function drawMinimap() {
  const canvas = document.querySelector("#minimap");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = 96;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0E1430";
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F2C14E";
  ctx.lineWidth = 3;
  ctx.stroke();

  const mapRadius = game.map.radius;
  const scale = radius / Math.max(mapRadius, 1);
  const project = (pos) => [
    center + pos[0] * scale,
    center + pos[2] * scale,
  ];

  for (const lantern of game.lanterns) {
    const [x, y] = project(lantern.pos);
    ctx.fillStyle = lantern.lit ? "#FFB347" : "#5B5F6E";
    ctx.beginPath();
    ctx.arc(x, y, lantern.lit ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FFF6C2";
  for (const mote of game.motes) {
    const [x, y] = project(mote.pos);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#7A3CFF";
  for (const shade of game.shades) {
    const [x, y] = project(shade.pos);
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#8FA3B8";
  for (const drifter of game.drifters) {
    if (drifter.state === "removed") continue;
    const [x, y] = project(drifter.pos);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const [playerX, playerY] = project(game.player.pos);
  ctx.fillStyle = "#E8E2D0";
  ctx.beginPath();
  ctx.moveTo(playerX, playerY - 8);
  ctx.lineTo(playerX - 6, playerY + 7);
  ctx.lineTo(playerX + 6, playerY + 7);
  ctx.closePath();
  ctx.fill();
}

const overlay = document.querySelector("#overlay");
document.querySelector("#restart").addEventListener("click", () => {
  if (game.state === "paused") {
    game.applyInput({ pause: true });
    overlay.hidden = true;
    return;
  }
  if (game.state === "won" && currentNight < 3) {
    currentNight += 1;
  }
  game = new Game({ night: currentNight });
  previousInteract = false;
  previousPulse = false;
  previousPause = false;
  overlay.hidden = true;
  document.querySelector("#restart").textContent = "Chơi lại";
  rebuildObjects();
  rebuildEnvironment();
});

document.querySelector("#overlay-settings").addEventListener("click", () => {
  document.querySelector("#settings-menu").hidden = false;
});
document.querySelector("#overlay-menu").addEventListener("click", () => {
  game = new Game({ night: 1 });
  currentNight = 1;
  gameStarted = false;
  overlay.hidden = true;
  document.querySelector("#main-menu").hidden = false;
  rebuildObjects();
  rebuildEnvironment();
});

function animate() {
  requestAnimationFrame(animate);
  let x = 0;
  let z = 0;

  // anh copilot đừng có đổi phím di chuyển của em, em code đúng rồi
  if (keys.has("KeyA")) x += 1;
  if (keys.has("KeyD")) x -= 1;
  if (keys.has("KeyW")) z += 1;
  if (keys.has("KeyS")) z -= 1;
  if (keys.has("ArrowLeft")) yaw -= 1.5;
  if (keys.has("ArrowRight")) yaw += 1.5;

  const mouseMove = getMouseMoveInput();
  if (mouseMove) {
    x = mouseMove[0];
    z = mouseMove[1];
  }

  const interact = keys.has("KeyE") || mouseInteract || buttonInteract;
  const pulse = keys.has("KeyQ") || mousePulse;
  const pause = keys.has("Escape") || keys.has("KeyP");
  const dash = keys.has("ShiftLeft") || keys.has("ShiftRight") || buttonDash;
  const jump = keys.has("Space") || buttonJump;
  if (gameStarted && (game.state === "playing" || game.state === "paused")) {
    game.applyInput({
      move: [x, z],
      cam_yaw_deg: yaw,
      interact: interact && !previousInteract,
      pulse: pulse && !previousPulse,
      dash: dash && !previousDash,
      jump: jump,
      pause: pause && !previousPause,
    });
  }
  previousInteract = interact;
  previousPulse = pulse;
  previousPause = pause;
  previousDash = dash;
  buttonInteract = false;
  buttonJump = false;
  buttonDash = false;

  playerMesh.position.set(
    game.player.pos[0],
    game.player.pos[1],
    game.player.pos[2],
  );
  if (Math.hypot(x, z) > 0.05) {
    const theta = ((yaw * Math.PI) / 180);
    const worldX = x * Math.cos(theta) + z * Math.sin(theta);
    const worldZ = -x * Math.sin(theta) + z * Math.cos(theta);
    playerMesh.rotation.y = Math.atan2(worldX, worldZ);
  }
  const cameraRadius = 7.5;
  camera.position.set(
    game.player.pos[0] - Math.sin(yaw * Math.PI / 180) * cameraRadius,
    6,
    game.player.pos[2] - Math.cos(yaw * Math.PI / 180) * cameraRadius,
  );
  camera.lookAt(game.player.pos[0], 1, game.player.pos[2]);

  syncObjects();
  hud();
  drawMinimap();
  if (game.state === "paused" && overlay.hidden) {
    document.querySelector("#overlay-title").textContent = "Tạm dừng";
    document.querySelector("#overlay-score").textContent =
      `Đêm ${currentNight} — Điểm: ${game.score}`;
    document.querySelector("#restart").textContent = "Tiếp tục";
    document.querySelector("#overlay-settings").hidden = false;
    document.querySelector("#overlay-menu").hidden = false;
    overlay.hidden = false;
  } else if (game.state !== "playing" && game.state !== "paused" && overlay.hidden) {
    document.querySelector("#overlay-title").textContent =
      game.state === "won" ? "Đảo sáng trở lại!" : "Sương đen đã nuốt lấy đảo";
    document.querySelector("#overlay-score").textContent =
      `Điểm: ${game.score}`;
    document.querySelector("#restart").textContent =
      game.state === "won" && currentNight < 3 ? "Đêm kế tiếp" : "Chơi lại";
    document.querySelector("#overlay-settings").hidden = true;
    document.querySelector("#overlay-menu").hidden = false;
    overlay.hidden = false;
  }
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
