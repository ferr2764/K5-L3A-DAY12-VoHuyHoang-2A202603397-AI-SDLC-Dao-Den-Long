import * as THREE from "three";
import "./style.css";
import { Game, TUNING } from "./game.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09051a);
scene.fog = new THREE.FogExp2(0x09051a, 0.018);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

const ambient = new THREE.HemisphereLight(0x9c8cff, 0x120821, 0.55);
scene.add(ambient);

let currentNight = 1;
let game = new Game({ night: currentNight });
const island = new THREE.Mesh(
  new THREE.CylinderGeometry(22, 24, 1.2, 48),
  new THREE.MeshStandardMaterial({ color: 0x29413b, roughness: 0.95 }),
);
island.position.y = -0.6;
island.receiveShadow = true;
scene.add(island);

const islandTop = new THREE.Mesh(
  new THREE.CylinderGeometry(21.7, 21.7, 0.12, 48),
  new THREE.MeshStandardMaterial({ color: 0x4e6b55, roughness: 1 }),
);
islandTop.position.y = 0.02;
islandTop.receiveShadow = true;
scene.add(islandTop);

const playerMesh = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 0.8, 5, 12),
  new THREE.MeshStandardMaterial({ color: 0xf2b66d }),
);
body.position.y = 0.9;
body.castShadow = true;
playerMesh.add(body);
const hat = new THREE.Mesh(
  new THREE.ConeGeometry(0.85, 0.35, 24),
  new THREE.MeshStandardMaterial({ color: 0xe8c96a }),
);
hat.position.y = 1.85;
hat.castShadow = true;
playerMesh.add(hat);
const miniLantern = new THREE.PointLight(0xffbe55, 2.2, 7);
miniLantern.position.set(0, 1.2, 0.5);
playerMesh.add(miniLantern);
scene.add(playerMesh);

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
  const light = new THREE.PointLight(0xffb34d, 0, 10);
  light.position.y = 2.45;
  group.add(light);
  group.position.set(lantern.pos[0], 0, lantern.pos[2]);
  scene.add(group);
  return { group, lamp, light };
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
  ambient.intensity = 0.15 + 0.55 * (litCount / Math.max(1, game.lanterns.length));
  for (const lantern of game.lanterns) {
    const object = lanternObjects.get(lantern.id);
    if (!object) continue;
    object.group.position.set(lantern.pos[0], 0, lantern.pos[2]);
    const progress = Math.min(1, lantern.deposited / TUNING.lantern_cost);
    object.lamp.material.color.set(lantern.lit ? 0xffca66 : 0x3d3156);
    object.lamp.material.emissive.setHex(lantern.lit ? 0xff7b24 : 0x000000);
    object.light.intensity = lantern.lit ? 5 : progress * 0.8;
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
      mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.55, 0.7, 5, 12),
        new THREE.MeshStandardMaterial({
          color: 0x180725,
          emissive: 0x26083c,
          emissiveIntensity: 0.5,
        }),
      );
      mesh.castShadow = true;
      scene.add(mesh);
      shadeObjects.set(shade.id, mesh);
    }
    mesh.position.set(shade.pos[0], 0.9, shade.pos[2]);
    mesh.visible = shade.state !== "stunned";
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
let gameStarted = false;

const savedSettings = JSON.parse(localStorage.getItem("dao-den-long-settings") ?? '{"volume":50,"sensitivity":18}');
let mouseSensitivity = (savedSettings.sensitivity ?? 18) / 100;
let masterVolume = (savedSettings.volume ?? 50) / 100;

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
  for (let i = 0; i < TUNING.carry_capacity; i++) {
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

  const nearest = game.lanterns
    .filter((lantern) => !lantern.lit)
    .filter((lantern) => Math.hypot(
      game.player.pos[0] - lantern.pos[0],
      game.player.pos[2] - lantern.pos[2],
    ) <= TUNING.interact_radius)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  const hint = document.querySelector("#lantern-hint");
  hint.hidden = !nearest;
  if (nearest) {
    hint.textContent = `E — Nạp ánh sáng (${nearest.deposited}/${TUNING.lantern_cost})`;
  }
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

  const interact = keys.has("KeyE") || mouseInteract;
  const pulse = keys.has("KeyQ") || mousePulse;
  const pause = keys.has("Escape") || keys.has("KeyP");
  const dash = keys.has("ShiftLeft") || keys.has("ShiftRight");
  if (gameStarted && (game.state === "playing" || game.state === "paused")) {
    game.applyInput({
      move: [x, z],
      cam_yaw_deg: yaw,
      interact: interact && !previousInteract,
      pulse: pulse && !previousPulse,
      dash: dash && !previousDash,
      jump: keys.has("Space"),
      pause: pause && !previousPause,
    });
  }
  previousInteract = interact;
  previousPulse = pulse;
  previousPause = pause;
  previousDash = dash;

  playerMesh.position.set(
    game.player.pos[0],
    0,
    game.player.pos[2],
  );
  const cameraRadius = 7.5;
  camera.position.set(
    game.player.pos[0] - Math.sin(yaw * Math.PI / 180) * cameraRadius,
    6,
    game.player.pos[2] - Math.cos(yaw * Math.PI / 180) * cameraRadius,
  );
  camera.lookAt(game.player.pos[0], 1, game.player.pos[2]);

  syncObjects();
  hud();
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
