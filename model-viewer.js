/* global AFRAME, THREE */
AFRAME.registerComponent('model-viewer', {
  schema: {
    gltfModel: {default: ''},
    title: {default: ''}
  },
  
  init: function () {
    var el = this.el;

    el.setAttribute('renderer', {colorManagement: true});
    el.setAttribute('cursor', {rayOrigin: 'mouse', fuse: false});
    el.setAttribute('background', '');

    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.initCameraRig();
    this.initEntities();
    this.initBackground();

    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('wheel', this.onMouseWheel);

    this.modelEl.addEventListener('model-loaded', this.onModelLoaded);
  },

  initCameraRig: function () {
    var cameraRigEl = this.cameraRigEl = document.createElement('a-entity');
    var cameraEl = this.cameraEl = document.createElement('a-entity');

    cameraEl.setAttribute('camera', {fov: 60});
    cameraEl.setAttribute('look-controls', {
      mouseEnabled: false,
      touchEnabled: false
    });

    cameraRigEl.appendChild(cameraEl);
    this.el.appendChild(cameraRigEl);
  },

  initBackground: function () {
    var backgroundEl = this.backgroundEl = document.querySelector('a-entity');
    backgroundEl.setAttribute('geometry', {primitive: 'sphere', radius: 65});
    backgroundEl.setAttribute('material', {
      shader: 'background-gradient',
      colorTop: '#37383c',
      colorBottom: '#757575',
      side: 'back'
    });
  },

  initEntities: function () {
    var containerEl = this.containerEl = document.createElement('a-entity');
    var modelPivotEl = this.modelPivotEl = document.createElement('a-entity');
    var modelEl = this.modelEl = document.createElement('a-entity');
    var shadowEl = this.shadowEl = document.createElement('a-entity');
    var titleEl = this.titleEl = document.createElement('a-entity');
    var lightEl = this.lightEl = document.createElement('a-entity');
    var sceneLightEl = this.sceneLightEl = document.createElement('a-entity');

    sceneLightEl.setAttribute('light', {
      type: 'hemisphere',
      intensity: 3.14
    });

    modelPivotEl.id = 'modelPivot';

    this.el.appendChild(sceneLightEl);

    modelEl.setAttribute('rotation', '0 -30 0');
    modelEl.setAttribute('animation-mixer', '');
    modelEl.setAttribute('shadow', 'cast: true; receive: false');
    modelEl.setAttribute('gltf-model', this.data.gltfModel);

    modelPivotEl.appendChild(modelEl);

    shadowEl.setAttribute('rotation', '-90 -30 0');
    shadowEl.setAttribute('geometry', 'primitive: plane; width: 1.0; height: 1.0');
    shadowEl.setAttribute('material', 'src: #shadow; transparent: true; opacity: 0.40');

    modelPivotEl.appendChild(shadowEl);

    titleEl.id = 'title';
    titleEl.setAttribute('text', 'value: ' + this.data.title + '; width: 6');
    titleEl.setAttribute('visible', 'false');

    this.containerEl.appendChild(titleEl);

    lightEl.id = 'light';
    lightEl.setAttribute('position', '-2 4 2');
    lightEl.setAttribute('light', {
      type: 'directional',
      castShadow: true,
      shadowMapHeight: 1024,
      shadowMapWidth: 1024,
      shadowCameraLeft: -7,
      shadowCameraRight: 5,
      shadowCameraBottom: -5,
      shadowCameraTop: 5,
      intensity: 1.57,
      target: 'modelPivot'
    });

    this.containerEl.appendChild(lightEl);
    this.containerEl.appendChild(modelPivotEl);

    this.el.appendChild(containerEl);
  },

  onMouseWheel: function (evt) {
    var modelPivotEl = this.modelPivotEl;
    var modelScale = this.modelScale || modelPivotEl.object3D.scale.x;
    modelScale -= evt.deltaY / 100;
    modelScale = Math.min(Math.max(0.8, modelScale), 2.0);
    modelPivotEl.object3D.scale.set(modelScale, modelScale, modelScale);
    this.modelScale = modelScale;
  },

  onMouseUp: function (evt) {
    this.leftRightButtonPressed = false;
    if (evt.buttons === undefined || evt.buttons !== 0) { return; }
    this.oldClientX = undefined;
    this.oldClientY = undefined;
  },

  onMouseMove: function (evt) {
    if (this.leftRightButtonPressed) {
      this.dragModel(evt);
    } else {
      this.rotateModel(evt);
    }
  },

  dragModel: function (evt) {
    var dX;
    var dY;
    var modelPivotEl = this.modelPivotEl;
    if (!this.oldClientX) { return; }
    dX = this.oldClientX - evt.clientX;
    dY = this.oldClientY - evt.clientY;
    modelPivotEl.object3D.position.y += dY / 200;
    modelPivotEl.object3D.position.x -= dX / 200;
    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  },

  rotateModel: function (evt) {
    var dX;
    var dY;
    var modelPivotEl = this.modelPivotEl;
    if (!this.oldClientX) { return; }
    dX = this.oldClientX - evt.clientX;
    dY = this.oldClientY - evt.clientY;
    modelPivotEl.object3D.rotation.y -= dX / 100;
    modelPivotEl.object3D.rotation.x -= dY / 200;
    modelPivotEl.object3D.rotation.x = Math.min(Math.max(-Math.PI / 2, modelPivotEl.object3D.rotation.x), Math.PI / 2);
    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  },

  onModelLoaded: function () {
    this.centerAndScaleModel();
  },

  centerAndScaleModel: function () {
    var box;
    var size;
    var center;
    var scale;
    var modelEl = this.modelEl;
    var shadowEl = this.shadowEl;
    var titleEl = this.titleEl;
    var gltfObject = modelEl.getObject3D('mesh');

    modelEl.object3D.position.set(0, 0, 0);
    modelEl.object3D.scale.set(1.0, 1.0, 1.0);
    this.cameraRigEl.object3D.position.z = 3.0;

    modelEl.object3D.updateMatrixWorld();
    box = new THREE.Box3().setFromObject(gltfObject);
    size = box.getSize(new THREE.Vector3());

    scale = 1.6 / size.y;
    scale = 2.0 / size.x < scale ? 2.0 / size.x : scale;
    scale = 2.0 / size.z < scale ? 2.0 / size.z : scale;

    modelEl.object3D.scale.set(scale, scale, scale);

    modelEl.object3D.updateMatrixWorld();
    box = new THREE.Box3().setFromObject(gltfObject);
    center = box.getCenter(new THREE.Vector3());
    size = box.getSize(new THREE.Vector3());

    shadowEl.object3D.scale.y = size.x;
    shadowEl.object3D.scale.x = size.y;
    shadowEl.object3D.position.y = -size.y / 2;
    shadowEl.object3D.position.z = -center.z;
    shadowEl.object3D.position.x = -center.x;

    titleEl.object3D.position.x = 2.2 - center.x;
    titleEl.object3D.position.y = size.y + 0.5;
    titleEl.object3D.position.z = -2;
    titleEl.object3D.visible = true;

    modelEl.object3D.position.x = -center.x;
    modelEl.object3D.position.y = -center.y;
    modelEl.object3D.position.z = -center.z;
  },

  onMouseDown: function (evt) {
    if (evt.buttons) { this.leftRightButtonPressed = evt.buttons === 3; }
    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  }
});