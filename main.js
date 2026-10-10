import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { MaterialManager } from './js/materials.js';
import { BrushEngine, BRUSH_PRESETS } from './js/brushEngine.js';
import { SymmetryController } from './js/symmetry.js';
import { EnvironmentManager } from './js/environment.js';
import { DrawController } from './js/drawController.js';
import { SceneExporter } from './js/exporter.js';
import { StudioAudioFeedback } from './js/audioFeedback.js';

class AetherSculptApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.turntableActive = false;

    this.initThree();
    this.initModules();
    this.initKeyboardMovement();
    this.initEvents();
    this.initUI();
    this.initSidebarToggles();
    this.animate();
  }

  initThree() {
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      8000
    );
    this.camera.position.set(0, 15, 45);

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

const canvas = this.renderer.domElement;
canvas.addEventListener('contextmenu', e => e.preventDefault());

let pinchStartDist = 0;
canvas.addEventListener('gesturestart', e => {
  pinchStartDist = e.scale;
});
canvas.addEventListener('gesturechange', e => {
  const delta = e.scale - pinchStartDist;
  const factor = 5; 
  const newDist = Math.max(3, Math.min(50, this.drawController.drawDistance + delta * factor));
  this.drawController.setDrawDistance(newDist);
  const depthSlider = document.getElementById('plane-depth');
  if (depthSlider) {
    depthSlider.value = newDist;
    depthSlider.dispatchEvent(new Event('input'));
  }
  pinchStartDist = e.scale;
});

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 5, 0);
    this.controls.mouseButtons = {
      LEFT: -1, 
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: -1 
    };

    this.isLooking = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.cameraEuler.setFromQuaternion(this.camera.quaternion, 'YXZ');

    this.keys = {};

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.65, 
      0.4,  
      0.2   
    );
    this.composer.addPass(bloomPass);
    this.bloomPass = bloomPass;

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  initKeyboardMovement() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'].includes(e.code)) {
        this.keys[e.code] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'].includes(e.code)) {
        this.keys[e.code] = false;
      }
    });
  }

  updateMovement(delta) {
    
    const isBoosted = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || 
                      this.keys['ControlLeft'] || this.keys['ControlRight'];
    const moveSpeed = (isBoosted ? 65 : 30) * delta;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const up = this.camera.up.clone().normalize();

    const moveVector = new THREE.Vector3();

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.sub(forward);

    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.sub(right);

    if (this.keys['KeyE']) moveVector.add(up);
    if (this.keys['KeyQ']) moveVector.sub(up);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(moveSpeed);
      this.camera.position.add(moveVector);

      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.controls.target.copy(this.camera.position).addScaledVector(dir, 20);
    }
  }

  initSidebarToggles() {
    const toggleMaterialsBtn = document.getElementById('toggle-materials-btn');
    const toggleSpatialBtn = document.getElementById('toggle-spatial-btn');

    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');

    const closeLeftBtn = document.getElementById('close-left-sidebar');
    const closeRightBtn = document.getElementById('close-right-sidebar');

    if (toggleMaterialsBtn && leftSidebar) {
      toggleMaterialsBtn.addEventListener('click', () => {
        const isCollapsed = leftSidebar.classList.contains('collapsed');
        if (isCollapsed) {
          leftSidebar.classList.remove('collapsed');
          toggleMaterialsBtn.classList.add('active');
        } else {
          leftSidebar.classList.add('collapsed');
          toggleMaterialsBtn.classList.remove('active');
        }
        this.audioFeedback.playClickSound();
      });
    }

    if (closeLeftBtn && leftSidebar && toggleMaterialsBtn) {
      closeLeftBtn.addEventListener('click', () => {
        leftSidebar.classList.add('collapsed');
        toggleMaterialsBtn.classList.remove('active');
        this.audioFeedback.playClickSound();
      });
    }

    if (toggleSpatialBtn && rightSidebar) {
      toggleSpatialBtn.addEventListener('click', () => {
        const isCollapsed = rightSidebar.classList.contains('collapsed');
        if (isCollapsed) {
          rightSidebar.classList.remove('collapsed');
          toggleSpatialBtn.classList.add('active');
        } else {
          rightSidebar.classList.add('collapsed');
          toggleSpatialBtn.classList.remove('active');
        }
        this.audioFeedback.playClickSound();
      });
    }

    if (closeRightBtn && rightSidebar && toggleSpatialBtn) {
      closeRightBtn.addEventListener('click', () => {
        rightSidebar.classList.add('collapsed');
        toggleSpatialBtn.classList.remove('active');
        this.audioFeedback.playClickSound();
      });
    }
  }

  initModules() {
    this.audioFeedback = new StudioAudioFeedback();
    this.materialManager = new MaterialManager();
    this.brushEngine = new BrushEngine(this.materialManager, this.camera);
    this.symmetryController = new SymmetryController();
    this.envManager = new EnvironmentManager(this.scene);
    this.drawController = new DrawController(
      this.scene,
      this.camera,
      this.renderer,
      this.brushEngine,
      this.materialManager,
      this.symmetryController,
      this.envManager
    );
    
    this.touchRotateMode = false;
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    const dom = this.renderer.domElement;
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    dom.addEventListener('pointerdown', (e) => {
      
      if (e.pointerType === 'touch' && this.touchRotateMode) {
        this.isLooking = true;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
        this.cameraEuler.setFromQuaternion(this.camera.quaternion, 'YXZ');
        return;
      }
      if (e.button === 0) { 
        this.drawController.startStroke(e.clientX, e.clientY);
        this.audioFeedback.playStrokeSound(520);
      } else if (e.button === 2) { 
        this.isLooking = true;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
        this.cameraEuler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      }
    });

    dom.addEventListener('pointermove', (e) => {
      this.drawController.updateCursorGizmo(e.clientX, e.clientY);

      if (this.drawController.isDrawing) {
        this.drawController.continueStroke(e.clientX, e.clientY);
      }

      if (this.isLooking) {
        const deltaX = e.clientX - this.prevMousePos.x;
        const deltaY = e.clientY - this.prevMousePos.y;
        this.prevMousePos = { x: e.clientX, y: e.clientY };

        const lookSpeed = 0.003;
        this.cameraEuler.y -= deltaX * lookSpeed;
        this.cameraEuler.x -= deltaY * lookSpeed;
        this.cameraEuler.x = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, this.cameraEuler.x));

        this.camera.quaternion.setFromEuler(this.cameraEuler);

        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.controls.target.copy(this.camera.position).addScaledVector(dir, 20);
      }
    });

    dom.addEventListener('pointerup', (e) => {
      if (e.button === 0) {
        this.drawController.endStroke();
      } else if (e.button === 2) {
        this.isLooking = false;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isLooking = false;
    });

    const rotateModeBtn = document.getElementById('rotate-mode-btn');
    if (rotateModeBtn) {
      rotateModeBtn.addEventListener('click', () => {
        this.touchRotateMode = !this.touchRotateMode;
        rotateModeBtn.classList.toggle('active', this.touchRotateMode);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.drawController.redo();
        } else {
          this.drawController.undo();
        }
        this.audioFeedback.playClickSound();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.drawController.redo();
        this.audioFeedback.playClickSound();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        document.body.classList.toggle('zen-mode');
      } else if (e.key >= '1' && e.key <= '7') {
        const presetButtons = Array.from(document.querySelectorAll('.brush-btn'));
        const targetBtn = presetButtons[parseInt(e.key) - 1];
        if (targetBtn) {
          targetBtn.click();
        }
      } else if (e.key === '[' || e.key === ']') {
        const slider = document.getElementById('brush-size');
        if (slider) {
          let curr = parseFloat(slider.value);
          curr = e.key === '[' ? Math.max(0.05, curr - 0.1) : Math.min(3.0, curr + 0.1);
          slider.value = curr.toFixed(2);
          slider.dispatchEvent(new Event('input'));
        }
      }
    });
  }

  initUI() {
    
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.brushEngine.setPreset(btn.dataset.preset);
        this.audioFeedback.playClickSound();
      });
    });

    document.querySelectorAll('.mat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.materialManager.setMaterialType(btn.dataset.material);
        this.audioFeedback.playClickSound();
      });
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.materialManager.setColor(swatch.dataset.color);
        document.getElementById('custom-color').value = swatch.dataset.color;
        this.audioFeedback.playClickSound();
      });
    });

    const colorPicker = document.getElementById('custom-color');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.materialManager.setColor(e.target.value);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      });
    }

    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');
    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (brightnessVal) brightnessVal.textContent = `${val}%`;
        this.materialManager.setBrightness(val / 100);
      });
    }

    const brightDimBtn = document.getElementById('bright-dim-btn');
    const brightNormBtn = document.getElementById('bright-normal-btn');
    const brightVividBtn = document.getElementById('bright-vivid-btn');

    if (brightDimBtn && brightnessSlider) {
      brightDimBtn.addEventListener('click', () => {
        brightnessSlider.value = 40;
        brightnessSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('#left-sidebar .mini-btn').forEach(b => b.classList.remove('active'));
        brightDimBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    if (brightNormBtn && brightnessSlider) {
      brightNormBtn.addEventListener('click', () => {
        brightnessSlider.value = 100;
        brightnessSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('#left-sidebar .mini-btn').forEach(b => b.classList.remove('active'));
        brightNormBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    if (brightVividBtn && brightnessSlider) {
      brightVividBtn.addEventListener('click', () => {
        brightnessSlider.value = 200;
        brightnessSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('#left-sidebar .mini-btn').forEach(b => b.classList.remove('active'));
        brightVividBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    const sizeSlider = document.getElementById('brush-size');
    const sizeVal = document.getElementById('size-val');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (sizeVal) sizeVal.textContent = val;
        this.brushEngine.setSize(val);
      });
    }

    document.querySelectorAll('.sym-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.symmetryController.setMode(btn.dataset.symmetry);
        this.audioFeedback.playClickSound();
      });
    });

    const depthSlider = document.getElementById('plane-depth');
    const depthVal = document.getElementById('depth-val');
    const distanceLabel = document.getElementById('distance-label');

    document.querySelectorAll('.canvas-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.canvas-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.drawController.setCanvasMode(mode);

        if (mode === 'camera') {
          if (distanceLabel) distanceLabel.textContent = 'Distance in Front';
          if (depthSlider) {
            depthSlider.min = '3';
            depthSlider.max = '50';
            depthSlider.value = this.drawController.drawDistance;
          }
          if (depthVal) depthVal.textContent = `${this.drawController.drawDistance.toFixed(1)}m`;
        } else {
          if (distanceLabel) distanceLabel.textContent = 'Plane Position';
          if (depthSlider) {
            depthSlider.min = '-25';
            depthSlider.max = '25';
            depthSlider.value = this.drawController.planeOffset;
          }
          if (depthVal) depthVal.textContent = `${this.drawController.planeOffset.toFixed(1)}m`;
        }
        this.audioFeedback.playClickSound();
      });
    });

    if (depthSlider) {
      depthSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (depthVal) depthVal.textContent = `${val.toFixed(1)}m`;
        if (this.drawController.canvasMode === 'camera') {
          this.drawController.setDrawDistance(val);
        } else {
          this.drawController.setPlaneOffset(val);
        }
      });
    }
    
    const resetPlaneBtn = document.getElementById('reset-plane-btn');
    if (resetPlaneBtn) {
      resetPlaneBtn.addEventListener('click', () => {
        if (this.drawController.canvasMode === 'camera') {
          
          this.drawController.setDrawDistance(6);
          if (depthSlider) { depthSlider.value = 6; depthSlider.dispatchEvent(new Event('input')); }
        } else {
          
          this.drawController.setPlaneOffset(0);
          if (depthSlider) { depthSlider.value = 0; depthSlider.dispatchEvent(new Event('input')); }
        }
        this.audioFeedback.playClickSound();
      });
    }

    const depthCloseBtn = document.getElementById('depth-close-btn');
    const depthMidBtn = document.getElementById('depth-mid-btn');
    const depthFarBtn = document.getElementById('depth-far-btn');

    if (depthCloseBtn && depthSlider) {
      depthCloseBtn.addEventListener('click', () => {
        depthSlider.value = 6;
        depthSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('.depth-shortcuts .mini-btn').forEach(b => b.classList.remove('active'));
        depthCloseBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    if (depthMidBtn && depthSlider) {
      depthMidBtn.addEventListener('click', () => {
        depthSlider.value = 15;
        depthSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('.depth-shortcuts .mini-btn').forEach(b => b.classList.remove('active'));
        depthMidBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    if (depthFarBtn && depthSlider) {
      depthFarBtn.addEventListener('click', () => {
        depthSlider.value = 30;
        depthSlider.dispatchEvent(new Event('input'));
        document.querySelectorAll('.depth-shortcuts .mini-btn').forEach(b => b.classList.remove('active'));
        depthFarBtn.classList.add('active');
        this.audioFeedback.playClickSound();
      });
    }

    document.querySelectorAll('.env-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.envManager.applyPreset(btn.dataset.env);
        this.audioFeedback.playClickSound();
      });
    });

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => {
      this.drawController.undo();
      this.audioFeedback.playClickSound();
    });

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) redoBtn.addEventListener('click', () => {
      this.drawController.redo();
      this.audioFeedback.playClickSound();
    });

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your current drawing?')) {
        this.drawController.clear();
        this.audioFeedback.playClickSound();
      }
    });

    const turntableBtn = document.getElementById('turntable-btn');
    if (turntableBtn) turntableBtn.addEventListener('click', () => {
      this.turntableActive = !this.turntableActive;
      turntableBtn.classList.toggle('active', this.turntableActive);
      this.audioFeedback.playClickSound();
    });

    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-dropdown-menu');
    const exportGltfBtn = document.getElementById('export-gltf-btn');
    const exportObjBtn = document.getElementById('export-obj-btn');
    const exportPngBtn = document.getElementById('export-png-btn');

    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('show');
      });

      window.addEventListener('click', () => {
        exportMenu.classList.remove('show');
      });
    }

    if (exportGltfBtn) {
      exportGltfBtn.addEventListener('click', () => {
        SceneExporter.exportToGLTF(this.drawController.strokeHistory, this.scene);
        this.audioFeedback.playClickSound();
      });
    }

    if (exportObjBtn) {
      exportObjBtn.addEventListener('click', () => {
        SceneExporter.exportToOBJ(this.drawController.strokeHistory);
        this.audioFeedback.playClickSound();
      });
    }

    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', () => {
        SceneExporter.exportScreenshot(this.renderer, this.scene, this.camera, this.composer);
        this.audioFeedback.playClickSound();
      });
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    this.updateMovement(delta);

    if (this.turntableActive) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 2.0;
    } else {
      this.controls.autoRotate = false;
    }

    this.controls.update();

    try {
      this.composer.render();
    } catch (e) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => new AetherSculptApp());
} else {
  new AetherSculptApp();
}
