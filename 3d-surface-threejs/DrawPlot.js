import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

import { Curves } from './jsm/curves/CurveExtras.js';
import { ParametricGeometries } from './jsm/geometries/ParametricGeometries.js';


// target: THREE.Vector3
let KleinFigure = (v, u,  target) => {

    u *= 2 * Math.PI;
    v *= 2 * Math.PI;

    let x, y, z;
    if (u < Math.PI) {

        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
        z = - 8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);

    } else {

        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
        z = - 8 * Math.sin(u);

    }

    y = - 2 * (1 - Math.cos(u) / 2) * Math.sin(v);

    target.set(x, y, z);

};

export const DrawPlot = (containerId) => {

    let camera, scene, renderer, stats, controls;

    init();
    //animate();

    function createScene() {
        scene = new THREE.Scene();

        // Set the background color
        scene.background = new THREE.Color('black');

        // Create Light
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
        scene.add(ambientLight);
    }

    function createCamera() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
        camera.position.y = 400;

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        camera.add(pointLight);

        scene.add(camera);
    }

    function createFigure() {
        const map = new THREE.TextureLoader().load('index.png');
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;

        //const material = new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide });
        const material = new THREE.MeshBasicMaterial({ wireframeLinewidth: 1, wireframe: true });

        //

        let geometry = new THREE.ParametricBufferGeometry(KleinFigure, 15, 15);
        let object = new THREE.Mesh(geometry, material);
        object.position.set(0, 100, 200);
        object.scale.multiplyScalar(10);

        scene.add(object);
    }

    function createRenderer() {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animationLoop);

        const container = document.getElementById(containerId);
        container.appendChild(renderer.domElement);
    }

    function init() {

        createScene();
        createCamera();
        createFigure();
        createRenderer();

        // Add controls
        controls = new OrbitControls( camera, renderer.domElement );

        // Add statistics of FPS and Ping
        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function animationLoop() {
        //requestAnimationFrame(animate);
        update();
        render();
        controls.update();
        stats.update();
    }

    function update() {
        const timer = Date.now() * 0.0001;

        camera.position.x = Math.cos(timer) * 1000;
        camera.position.z = Math.sin(timer) * 1000;

        camera.lookAt(scene.position);

        scene.traverse(function (object) {
            if (object.isMesh === true) {
                object.rotation.x = timer * 5;
                object.rotation.y = timer * 2.5;
            }
        });
    }

    function render() {
        renderer.render(scene, camera);
    }
};