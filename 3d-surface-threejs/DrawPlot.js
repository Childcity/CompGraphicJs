import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import { Curves } from './jsm/curves/CurveExtras.js';
import { ParametricGeometries } from './jsm/geometries/ParametricGeometries.js';

let KleinFigure = ( v, u, target ) => {

    u *= Math.PI;
    v *= 2 * Math.PI;

    u = u * 2;
    var x, y, z;
    if ( u < Math.PI ) {

        x = 3 * Math.cos( u ) * ( 1 + Math.sin( u ) ) + ( 2 * ( 1 - Math.cos( u ) / 2 ) ) * Math.cos( u ) * Math.cos( v );
        z = - 8 * Math.sin( u ) - 2 * ( 1 - Math.cos( u ) / 2 ) * Math.sin( u ) * Math.cos( v );

    } else {

        x = 3 * Math.cos( u ) * ( 1 + Math.sin( u ) ) + ( 2 * ( 1 - Math.cos( u ) / 2 ) ) * Math.cos( v + Math.PI );
        z = - 8 * Math.sin( u );

    }

    y = - 2 * ( 1 - Math.cos( u ) / 2 ) * Math.sin( v );

    target.set( x, y, z );

};

export const DrawPlot = () => {

    let camera, scene, renderer, stats;

    init();
    animate();

    function init() {

        const container = document.getElementById( 'container' );

        camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 2000 );
        camera.position.y = 400;

        scene = new THREE.Scene();

        //

        const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
        scene.add( ambientLight );

        const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
        camera.add( pointLight );
        scene.add( camera );

        //

        const map = new THREE.TextureLoader().load( 'index.png' );
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;

        const material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );

        //

        let geometry, object;

        geometry = new THREE.ParametricBufferGeometry( KleinFigure, 15, 15 );
        object = new THREE.Mesh( geometry, material );
        object.position.set( 0, 0, 200 );
        object.scale.multiplyScalar( 10 );
        scene.add( object );

        //

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        stats = new Stats();
        container.appendChild( stats.dom );

        window.addEventListener( 'resize', onWindowResize, false );

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function animate() {
        requestAnimationFrame( animate );
        render();
        stats.update();
    }

    function render() {

        const timer = Date.now() * 0.0001;

        camera.position.x = Math.cos( timer ) * 1000;
        camera.position.z = Math.sin( timer ) * 1000;

        camera.lookAt( scene.position );

        scene.traverse( function ( object ) {

            if ( object.isMesh === true ) {

                object.rotation.x = timer * 5;
                object.rotation.y = timer * 2.5;

            }

        } );

        renderer.render( scene, camera );

    }
};