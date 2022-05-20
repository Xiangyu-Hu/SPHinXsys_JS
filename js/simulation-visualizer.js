import * as THREE from 'three';
import Stats from './jsm/libs/stats.module.js';
import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { VTKLoader } from './jsm/loaders/VTKLoader.js';

const PARTICLE_SIZE = 10;

const material = new THREE.ShaderMaterial( {
    uniforms: {
        color: { value: new THREE.Color( 0xffffff ) },
        pointTexture: { value: new THREE.TextureLoader().load( './images/particle.png' ) },
        alphaTest: { value: 0.9 }
    },
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent
} );

function getRenderedHeight() {
    const containerFluid = document.getElementById('container-fluid');
    if (containerFluid) {
        return window.innerHeight - containerFluid.clientHeight;
    }
    return window.innerHeight;
}

export class SimulationVisualizer {
    constructor() {
        this.renderer;
        this.container;
        this.scene;
        this.camera;
        this.stats;
        this.particles;
        this.controls;
        this.raycaster;
        this.pointer;
        this.INTERSECTED = [];
        this.canvas;
        this.context;
        this.texture;
        this.sprite;
        this.vtuLoader = new VTKLoader();
        this.simulationResults = [];
        this.renderedObj = {};
        this.currentIndex = 0;
    }

    init() {
        const width = window.innerWidth;
        const height = getRenderedHeight();

        this.simulationResults = [];
        this.renderedObj = {};
        this.currentIndex = 0;
        this.INTERSECTED = [];

        if (document.getElementById('simulation-results')) {
            div.removeChild(document.getElementById('simulation-results'));
        }

        this.container = document.getElementById( 'container' );
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000 );
        this.camera.position.z = 250;


        // for testing purposes: comment out if dont need it
        let boxGeometry = new THREE.BoxGeometry( 200, 200, 200, 16, 16, 16 );
        boxGeometry.deleteAttribute( 'normal' );
        boxGeometry.deleteAttribute( 'uv' );
        boxGeometry = BufferGeometryUtils.mergeVertices( boxGeometry );
        this.visualiseVtu({ points: boxGeometry.getAttribute('position').array }, 'test');
        // 

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, getRenderedHeight());
        this.container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();

        //

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.context.font = "Bold 12px Arial";
        
        // canvas contents will be used for a texture
        this.texture = new THREE.Texture(this.canvas) 
        this.texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial( { map: this.texture } );
	
        this.sprite = new THREE.Sprite( spriteMaterial );
        this.sprite.scale.set(100, 50, 1.0);
        this.scene.add(this.sprite);	


        //

        this.stats = new Stats();
        this.container.appendChild(this.stats.dom);

        //

        window.addEventListener( 'resize', this.onWindowResize.bind(this) );
        document.addEventListener( 'pointermove', this.onPointerMove.bind(this) );
        
        this.animate();
    }

    fillContext(message, index) {
        const { width } = this.context.measureText(message);
        const boxHeight = 24;
        const offset = (boxHeight) * index;
        this.context.fillStyle = "rgba(0, 0, 0, 0.95)"; // black border
        this.context.fillRect(0, 0 + offset + 8 * index, width + 8, boxHeight + 8);
        this.context.fillStyle = "rgba(255,255,255,0.95)"; // white filler
        this.context.fillRect(2, 2 + offset + 4 * index, width + 4, boxHeight + 4 );
        this.context.fillStyle = "rgba(0,0,0,1)"; // text color
        this.context.fillText(message, 4, boxHeight + offset + index * 1);
    }

    clearContext() {
        this.context.clearRect(0,0, 300, 300);
        this.texture.needsUpdate = true;
    }


    animate() {
        requestAnimationFrame((...props) => this.animate(...props));
        this.controls.update();
        this.render();
        this.stats.update();
    }

    createSimResultsElement() {
        const div = document.getElementById('container-fluid-col');
        const wrapper = document.createElement('div');
        wrapper.id = "simulation-results";
        wrapper.style.cssText = "display: inline-block;";
        this.simulationResults.forEach((item, index) => {
            const span = document.createElement('span');
            span.innerText = (index + 1).toString();
            span.onclick =  this.visualiseByIndex.bind(this, index);
            span.style.cssText = "margin-right: 5px; padding: 5px; cursor: pointer;";
            wrapper.appendChild(span);
        })

        if (document.getElementById(wrapper.id)) {
            div.removeChild(document.getElementById(wrapper.id));
        }
        div.appendChild(wrapper);
    }

    setSimulationResults(results) {
        if (!results || !results.length) return;
        this.simulationResults = results;
        this.createSimResultsElement();
        this.visualiseByIndex(results.length - 1);
    }

    visualiseData(elementOfObj) {
        const mapKeys = Object.keys(elementOfObj);
        for (let i = 0; i < mapKeys.length; i++) {
            let key = mapKeys[i];
            const data = elementOfObj[key];
    
            if (key.includes('.vtu')) {
                // set your scaling, for the beam it is better to have this scaling to have space between particls
                this.readVtu(data, key.replace('.vtu', ''), 4000);
            }
        }
    }
    
    visualiseByIndex(index) {
        if (!this.simulationResults.length) return;
        Object.keys(this.renderedObj).forEach((name, index) => {
            this.removeOldParticles(name, index);
        })
        this.currentIndex = index;
        this.visualiseData(this.simulationResults[index]);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = getRenderedHeight();

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, getRenderedHeight());
    }

    onPointerMove( event ) {
        const newX = (event.clientX / window.innerWidth) * 2 - 1;
        const newY = - ((event.clientY - 45) / getRenderedHeight()) * 2 + 1;
	    this.sprite.position.set(newX * 100, newY * 100 - 30, 1 );
        this.pointer.x = newX;
        this.pointer.y = newY;
    }

    readVtu(data, name, scalingFactor = 1) {
        this.vtuLoader.load("data:application/octet-stream;base64," + btoa(data), (result) => {
            const { points, pointData } = result;
            const scaled_points = [];
            points.forEach((item) => {
                scaled_points.push(scalingFactor * item);
            })
            this.visualiseVtu({ points: scaled_points, pointData }, name);
        });
    }

    readVtuMock() {
        fetch('./vtu_data_mock.txt')
            .then(response => response.text())
            .then(text_vtu => {
                this.readVtu(text_vtu, 'vtu_data_mock');
            })
    }

    visualiseVtu(vtu, name) {
        if (!vtu) return;
        const { points, pointData } = vtu;
        const colors = [];
        const sizes = [];
        const color = new THREE.Color();
        const scaled_points = points;

        for ( let i = 0, l = points.length / 3; i < l; i ++ ) {
            color.setHSL( 0.01 + 0.1 * ( i / l ), 1.0, 0.5 );
            color.toArray( colors, i * 3 );
            sizes[ i ] = PARTICLE_SIZE;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(scaled_points, 3) );
        geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
        geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) );

        if (pointData) {
            Object.keys(pointData).forEach((attr) => {
                const attrValues = pointData[attr];
                geometry.setAttribute(attr, new THREE.Float32BufferAttribute(attrValues, attrValues.length === points.length ? 3 : 1));
            });
        }

        const particles = new THREE.Points(geometry, material);
        particles.name = name;

        const box3 = new THREE.Box3().setFromObject(particles);
        const vector = new THREE.Vector3();
        box3.getCenter(vector);
        particles.position.set(-vector.x, -vector.y, -vector.z);
        this.scene.add(particles);
        this.renderedObj[name] = particles;
    }

    removeOldParticles(name, modelIndex) {
        this.INTERSECTED[modelIndex] = null;
        setTimeout(() => {
            this.scene.remove(this.renderedObj[name]);
            delete this.renderedObj[name];
        }, 0);
    }

    intesection(model, modelIndex) {
        const geometry = model.geometry;
        const attributes = geometry.attributes;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObject(model);

        if ( intersects.length > 0 ) {
            if ( this.INTERSECTED[modelIndex] != intersects[ 0 ].index ) {
                this.INTERSECTED[modelIndex] = intersects[ 0 ].index;
                let index = 0;
                this.context.clearRect(0, 0, 700, 480);
                Object.keys(attributes).forEach((attr) => {
                    if (attr === 'size' || attr === 'customColor') return; 
                    const { itemSize, array: values } = attributes[attr];
                    index += 1;
                    let message = `${attr}: `;
                    if (itemSize === 3) {
                        const intersected_values = [];
                        for (let i = 3; i > 0; i--) {
                            intersected_values[3 - i] = (values[this.INTERSECTED[modelIndex] * 3 - i]).toFixed(3);
                        }
                        message += `[${intersected_values.join(', ')}]`;
                    } else if (itemSize === 1) {
                        message += values[this.INTERSECTED[modelIndex]]
                    }
                    this.fillContext(message, index);
                })


                this.texture.needsUpdate = true;


                attributes.size.array[this.INTERSECTED[modelIndex]] = PARTICLE_SIZE * 2;
                attributes.size.needsUpdate = true;
            }
        // } else if ( this.INTERSECTED[modelIndex] !== null ) {
        } else {
            this.clearContext();
            attributes.size.array[this.INTERSECTED[modelIndex]] = PARTICLE_SIZE;
            attributes.size.needsUpdate = true;
            this.INTERSECTED[modelIndex] = null;
        }

        this.renderer.clear();
        this.renderer.render(this.scene, this.camera );

    }

    render() {
        if (!Object.keys(this.renderedObj).length) return;
        Object.keys(this.renderedObj).forEach((key, index) => this.intesection(this.renderedObj[key], index));
    }
}
