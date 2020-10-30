import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';
import Dat from './jsm/libs/dat.gui.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';

import { ParametricGeometries } from './jsm/geometries/ParametricGeometries.js';


// target: THREE.Vector3
const KleinFigure = (v, u, target) => {

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

    let camera, scene, figure, renderer,
        stats, controls,
        datGui;

    let options = {
        isWireframe: true,
        isAnimation: true,
        geometry: {
            slices: 15,
            stacks: 15
        }
    }

    init();
    //animationLoop();

    function init() {

        createScene();
        createCamera();
        createFigure();
        createGui();
        createRenderer();

        // Add controls
        controls = new OrbitControls(camera, renderer.domElement);

        // Add statistics of FPS and Ping
        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
    }

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
        map.anisotropy = 4;

        const material = new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide, wireframe: options.isWireframe });
        //const material = new THREE.MeshBasicMaterial({ wireframeLinewidth: 1, wireframe: true });

        const geometry = new THREE.ParametricBufferGeometry(KleinFigure, 
            options.geometry.slices,
            options.geometry.stacks);

        figure = new THREE.Mesh(geometry, material);
        figure.position.set(0, 100, 200);
        figure.scale.multiplyScalar(20);
        figure.name = 'Klein'

        const removeObjectIfExist = (objName) => {
            const selectedObject = scene.getObjectByName(objName);
            if (selectedObject) {
                scene.remove(selectedObject);
            }
        }

        removeObjectIfExist(figure.name);
        scene.add(figure);
    }

    function createGui() {
        datGui = new Dat.GUI({ autoPlace: true });
        datGui.domElement.id = 'gui';

        // Create folder and Add Options 
        const fig = datGui.addFolder('Figure');

        fig.add(options, 'isWireframe').onChange((newVal) => {
            figure.material.wireframe = newVal
            requestAnimationFrame(animationLoop);
        });

        fig.add(options, 'isAnimation').onChange((isAnimation) => {
            if (isAnimation) {
                renderer.setAnimationLoop(animationLoop);
                controls.removeEventListener('change', null);
            } else {
                renderer.setAnimationLoop(null);
                controls.addEventListener('change', render);
            }
            requestAnimationFrame(animationLoop);
        });

        fig.open();

        var geom = datGui.addFolder('Geometry');
        geom.add(figure.geometry.parameters, 'slices', 1, 50).onChange((newSlices) => {
            options.geometry.slices = parseInt(newSlices);
            createFigure();
            requestAnimationFrame(animationLoop);
        });
        geom.add(figure.geometry.parameters, 'stacks', 1, 50).onChange((newStacks) => {
            options.geometry.stacks = parseInt(newStacks);
            createFigure();
            requestAnimationFrame(animationLoop);
        });
        geom.open();
    }

    function createRenderer() {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animationLoop);

        const container = document.getElementById(containerId);
        container.appendChild(renderer.domElement);
    }



    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animationLoop() {
        //requestAnimationFrame(animationLoop);
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