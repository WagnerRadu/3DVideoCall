import "../index.css"
import * as THREE from "three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Scene {
    constructor() {
        this.gltfLoader = new GLTFLoader();

        this.users3DObjects = {};

        this.width = parent.innerWidth;
        // this.height = parent.innerHeight * 0.8;
        this.height = parent.innerHeight;

        this.nextUserPos = -20;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);



        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.listenToKeyEvents(window); // optional

        // //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        // this.controls.minDistance = 500;
        this.controls.maxDistance = 50;

        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 2;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.camera.position.setZ(50);

        this.renderer.setClearColor(0xFFFFDD);

        let canvasContainer = document.getElementById("canvas-container");
        canvasContainer.append(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0x404040, 50);
        this.scene.add(this.ambientLight);

        // this.scene.add(new THREE.AxesHelper(100));

        window.addEventListener("resize", () => {
            this.width = window.innerWidth;
            // this.height = Math.floor(window.innerHeight * 0.8);
            this.height = window.innerHeight;
            this.camera.aspect = this.width / this.height;
            this.renderer.setSize(this.width, this.height);
        });
        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    addUser = (id, faceTexture) => {
        let human3DObject = null;
        this.gltfLoader.load("../assets/human_bust.gltf", (gltfScene) => {
            console.log(gltfScene);
            // console.log(gltfScene.materials.getMaterialByName);

            gltfScene.scene.traverse(function (child) {

                if (child.material && child.material.name === "Skin") {

                    // child.material = new THREE.MeshBasicMaterial( { wireframe: true } );
                    if (faceTexture) {
                        const texture = new THREE.TextureLoader().load(faceTexture);

                        texture.flipY = false;
                        child.material.map = texture;
                    }
                    // child.material.shading = THREE.SmoothShading;
                }
                if (child.isMesh) {
                    child.receiveShadow = true;
                    child.castShadow = true;
                }
                if (child.type === "Group") {
                    human3DObject = child;
                }
            });

            this.users3DObjects[id] = human3DObject;
            console.log(id);
            console.log(this.users3DObjects[id]);
            this.scene.add(this.users3DObjects[id]);
            this.updatePositions();

            console.log("Updated positions:\n User", id, "has the following positions:", this.users3DObjects[id].position);
        });
    };

    removeUser = (id) => {
        console.log("Removing 3D avatar for user", id);
        console.log(this.users3DObjects[id]);
        this.scene.remove(this.users3DObjects[id]);
        delete this.users3DObjects[id];
        this.updatePositions();
    };

    updatePositions = () => {
        let radius = 30;
        let numberOfUsers = Object.keys(this.users3DObjects).length;

        // this.clearScene();
        this.scene.add(new THREE.AxesHelper(100));

        let i = 1;
        for (const key in this.users3DObjects) {
            let angle = i * (2 * Math.PI / numberOfUsers);

            let x = (radius) * Math.cos(angle);
            let z = (radius) * Math.sin(angle);

            console.log((key));
            console.log(this.users3DObjects[key]);
            let human3DObject = this.users3DObjects[key];
            human3DObject.position.x = x;
            human3DObject.position.z = z;
            human3DObject.lookAt(0, 0, 0);
            // this.scene.add(human3DObject);

            i++;
        }
    };

    clearScene = () => {
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            let obj = this.scene.children[i];
            this.scene.remove(obj);
        }
    };

    resetCamera = () => {
        this.camera.position.set(0, 0, 50);
        this.camera.lookAt(0, 0, 0)
    }
}



export { Scene };