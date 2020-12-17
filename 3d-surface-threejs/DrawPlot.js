import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';
import Dat from './jsm/libs/dat.gui.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';

const sin = arg => Math.sin(arg);
const cos = arg => Math.cos(arg);
const pow = (arg1, arg2) => Math.pow(arg1, arg2);

function mipmap( size, color ) {

    const imageCanvas = document.createElement( "canvas" );
    const context = imageCanvas.getContext( "2d" );

    imageCanvas.width = imageCanvas.height = size;

    context.fillStyle = "#444";
    context.fillRect( 0, 0, size, size );

    context.fillStyle = color;
    context.fillRect( 0, 0, size / 2, size / 2 );
    context.fillRect( size / 2, size / 2, size / 2, size / 2 );
    return imageCanvas;

}

const loadTexturesWithMipMaps = async () =>
{
    const path = '/mips/sized/name.png';
    const maxLevel = 10;
    let mipmaps = new Array(maxLevel);

    const loadTextureAsync = async url => {
        return new Promise(resolve => {
            new THREE.TextureLoader()
                .load(url, texture => { resolve(texture); });
        });
    };

    // load mipmaps
    const pendings = []; // Promise[]
    for (let level = 0; level <= maxLevel; ++level) {
        const url = path.replace('name', Math.pow(2, maxLevel - level));

        const mipmapLevel = level;
        pendings.push(loadTextureAsync(url)
            .then(texture => {
                mipmaps[mipmapLevel] = mipmapLevel === 0
                    ? texture
                    : texture.image;
            })
        )
    }

    await Promise.all(pendings);

    const texture = mipmaps.shift();
    texture.mipmaps = mipmaps;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.mapping = THREE.UVMapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.repeat.set(7, 7);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    return texture;

};


// target: THREE.Vector3
const KleinFigure = (v, u, target) =>
{
    u *= 2 * Math.PI;
    v *= 2 * Math.PI;

    let x, y, z;
    if (u < Math.PI) {
        x = 3 * cos(u) * (1 + sin(u)) + (2 * (1 - cos(u) / 2)) * cos(u) * cos(v);
        z = -8 * sin(u) - 2 * (1 - cos(u) / 2) * sin(u) * cos(v);
    } else {
        x = 3 * cos(u) * (1 + sin(u)) + (2 * (1 - cos(u) / 2)) * cos(v + Math.PI);
        z = -8 * sin(u);
    }

    y = -2 * (1 - cos(u) / 2) * sin(v);

    target.set(x, y, z);
};

// tangentsU, tangentsV: THREE.Vector3
const KleinFigureDerivetive = (v, u, tangentsU, tangentsV) =>
{
    u *= 2 * Math.PI;
    v *= 2 * Math.PI;

    let dxdu, dydu, dzdu,
        dxdv, dydv, dzdv;

    if (u < Math.PI) {
        dxdu = 2 * sin(u) * cos(u) * cos(v) - sin(u) * (3 * sin(u) + 2 * cos(v) + 3) + 3 * pow(cos(u), 2);
        dxdv = (cos(u) - 2) * cos(u) * sin(v);
        dzdu = pow(cos(u), 2) * cos(v) - 2 * cos(u) * (cos(v) + 4) - pow(sin(u), 2) * cos(v);
        dzdv = sin(u) * (-(cos(u) - 2)) * sin(v);
    } else {
        dxdu = sin(u) * (cos(v + Math.PI) - 3 * (sin(u) + 1)) + 3 * pow(cos(u), 2);
        dxdv = (cos(u) - 2) * sin(v + Math.PI);
        dzdu = -v * cos(u);
        dzdv = 0;
    }

    dydu = -sin(u) * sin(v);
    dydv = (cos(u) - 2) * cos(v);

    tangentsU.set(dxdu, dydu, dzdu);
    tangentsV.set(dxdv, dydv, dzdv);
};

export const DrawPlot = containerId => {

    let container,
        camera, scene, figure, renderer,
        stats, controls,
        datGui;

    let options = {
        isWireframe: false,
        isAnimation: false,
        geometry: {
            slices: 30,
            stacks: 30
        },
        pointLightPos: {
            phi: 200 * Math.PI,
            radius: 200
        },
        testVal: 314
    };

    init().catch(console.error);
    //animationLoop();

    function createTangentsVector()
    {
        console.log(options.testVal/100);

        let tangentsU = new THREE.Vector3();
        let tangentsV = new THREE.Vector3();
        KleinFigureDerivetive(Math.PI, options.testVal/100, tangentsU, tangentsV);

        addArray(tangentsU, "tangentsU", 200, 0xffff00)
        addArray(tangentsV, "tangentsV", 200, 0xff00ff)

        function addArray(vec, objName, length, color)
        {
            const dir = vec.clone();
            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();

            const origin = dir.clone().negate();
            const tangentsArrow = new THREE.ArrowHelper(dir, origin, length, color, 50, 30);
            tangentsArrow.name = objName;
            removeObject(tangentsArrow);
            scene.add(tangentsArrow);
        }

    }

    async function init() {

        createScene();
        createLight();
        createCamera();
        await createFigure();
        createTangentsVector();
        createGui();
        createRenderer();

        // Add controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.keys = {LEFT: 0, RIGHT: 0, UP: 0, BOTTOM: 0};

        // Add statistics of FPS and Ping
        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('keydown', onWindowKeyDown, false);

        setTimeout(enableAnimation, 10, options.isAnimation);
    }

    function createScene() {
        scene = new THREE.Scene();

        // Set the background color
        scene.background = new THREE.Color('black');
    }

    function createLight()
    {
        const getCirclePos = (r, phi) => {
            return {
                x: r * cos(phi),
                y: r * sin(phi)
            }
        };

        const directLight = new THREE.DirectionalLight(0xffcccc, 3.0);
        directLight.position.set(19, -267, -245);
        directLight.name = "directLight";
        removeObject(directLight);
        scene.add(directLight);

        //const directLightHelper = new THREE.DirectionalLightHelper(directLight, 100);
        //directLightHelper.name = "directLightHelper";
        //removeObject(directLightHelper);
        //scene.add(directLightHelper);

        //{
        //    const dir = new THREE.Vector3(-19, 267, 245);
        //    //normalize the direction vector (convert to vector of length 1)
        //    dir.normalize();

        //    const origin = new THREE.Vector3(19, -267, -245);
        //    const arrowHelper = new THREE.ArrowHelper(dir, origin, 200, 0xffff00, 50, 30);
        //    scene.add(arrowHelper);
        //}

        const pointLight = new THREE.PointLight(0xffffff, 3.0, 500);
        const pos = getCirclePos(options.pointLightPos.radius, options.pointLightPos.phi / 100);
        pointLight.position.set(14 + pos.x, 480, pos.y);
        pointLight.name = "pointLight";
        removeObject(pointLight);
        scene.add(pointLight);

        //const sphereSize = 5;
        //const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize, 0xfcd440);
        //pointLightHelper.name = "pointLightHelper";
        //removeObject(pointLightHelper);
        //scene.add(pointLightHelper);

        const ambientLight = new THREE.AmbientLight(0xffcccc, 0.5);
        ambientLight.name = "ambientLight";
        removeObject(ambientLight);
        scene.add(ambientLight);
    }

    function createCamera()
    {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
        camera.position.y = 400;

        scene.add(camera);
    }

    async function createFigure() {

        const texture = await loadTexturesWithMipMaps();
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
            wireframe: options.isWireframe
        });

        const geometry = new THREE.ParametricBufferGeometry(
            KleinFigure,
            options.geometry.slices,
            options.geometry.stacks
        );

        figure = new THREE.Mesh(geometry, material);
        figure.position.set(0, 0, 0);
        figure.scale.multiplyScalar(1);
        figure.name = 'Klein';

        removeObject(figure);
        scene.add(figure);
    }

    function createGui() {

        datGui = new Dat.GUI({ autoPlace: true });
        datGui.domElement.id = 'gui';

        // Create folder and Add Options 
        const fig = datGui.addFolder('Figure');

        fig.add(options, 'isWireframe').onChange((newVal) => {
            figure.material.wireframe = newVal;
            requestAnimationFrame(animationLoop);
        });

        fig.add(options, 'isAnimation').onChange((isAnimation) => {
            enableAnimation(isAnimation)
        });

        fig.open();

        const geom = datGui.addFolder('Geometry');
        geom.add(figure.geometry.parameters, 'slices', 1, 50).onChange(async (newSlices) => {
            options.geometry.slices = parseInt(newSlices);
            await createFigure();
            requestAnimationFrame(animationLoop);
        });
        geom.add(figure.geometry.parameters, 'stacks', 1, 50).onChange(async (newStacks) => {
            options.geometry.stacks = parseInt(newStacks);
            await createFigure();
            requestAnimationFrame(animationLoop);
        });
        geom.add(options, 'testVal', 0, 628).onChange((newtestVal) => {
            options.testVal = parseInt(newtestVal);
            createTangentsVector();
            requestAnimationFrame(animationLoop);
        });
        geom.add(options.pointLightPos, 'phi', 0, 200 * Math.PI).onChange(newPhi => {
            options.pointLightPos.phi = parseInt(newPhi);
            updateLight();
        });
        geom.open();
    }

    function createRenderer() {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animationLoop);

        container = document.getElementById(containerId);
        container.appendChild(renderer.domElement);
    }



    function enableAnimation(isOn) {
        if (isOn) {
            renderer.setAnimationLoop(animationLoop);
            controls.removeEventListener('change', null);
        } else {
            renderer.setAnimationLoop(null);
            controls.addEventListener('change', render);
        }
        requestAnimationFrame(animationLoop);
    }

    function updateLight() {
        createLight();
        render();
    }

    function removeObject(obj) {
        const selectedObject = scene.getObjectByName(obj.name);
        if (selectedObject) {
            scene.remove(selectedObject);
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onWindowKeyDown(event) {
        const keyCode = event.keyCode;
        let phiStep = 0;

        if (keyCode === 37) {
            phiStep = -10;
        } else if (keyCode === 38) {
            phiStep = 10;
        } else if (keyCode === 39) {
            phiStep = 10;
        } else if (keyCode === 40) {
            phiStep = -10;
        }

        options.pointLightPos.phi += phiStep;
        updateLight();
    }

    function animationLoop() {
        //requestAnimationFrame(animationLoop);
        //update();
        render();
        controls.update();
        stats.update();
    }

    function update() {
        const timer = Date.now() * 0.0001;

        camera.position.x = cos(timer) * 1000;
        camera.position.z = sin(timer) * 1000;

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