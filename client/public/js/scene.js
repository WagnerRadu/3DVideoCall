import "../index.css"
import * as THREE from "three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
class Scene {
    constructor() {
        this.gltfLoader = new GLTFLoader();

        this.users3DObjects = {};

        this.width = parent.innerWidth;
        this.height = parent.innerHeight;

        this.isPov = true;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.listenToKeyEvents(window); // optional

        // this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        // this.controls.dampingFactor = 0.05;
        // this.controls.screenSpacePanning = false;
 
        this.controls.maxDistance = 0.01;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;

        this.polarRange = Math.PI / 6;
        this.controls.minPolarAngle = Math.PI / 2 - this.polarRange;
        this.controls.maxPolarAngle = Math.PI / 2 + this.polarRange;

        this.azimuthRange = Math.PI / 6;
        this.controls.minAzimuthAngle = Math.Pi / 2 + this.azimuthRange;
        this.controls.maxAzimuthAngle = Math.Pi / 2 - this.azimuthRange;

        // this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE }

        this.scene.add(new THREE.AxesHelper(100));

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        // this.camera.position.setZ(50);

        // this.renderer.setClearColor(0xFFFFDD);
        this.scene.background = new THREE.Color(0x7ea4b9);

        let canvasContainer = document.getElementById("canvas-container");
        canvasContainer.append(this.renderer.domElement);

        this.mainLight = new THREE.DirectionalLight(0xffffff, 3);
        this.mainLight.position.set(10, 10, 10);

        this.hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 3);
        this.scene.add(this.mainLight, this.hemisphereLight);

        this.addTable();

        window.addEventListener("resize", () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });

        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    addTable = () => {
        this.gltfLoader.load("../assets/table.gltf", (gltfScene) => {
            const model = gltfScene.scene;
            model.scale.set(3,2,3);
            this.scene.add(model);
        });
    }

    addUser = (id, faceTexture) => {
        this.users3DObjects[id] = {};
        this.gltfLoader.load("../assets/human_bust.gltf", (gltfScene) => {
            const model = gltfScene.scene.children[0];
            const mixer = new THREE.AnimationMixer(model);
            this.users3DObjects[id].mixer = mixer;
            const animation = gltfScene.animations[0];
            const action = mixer.clipAction(animation);
            action.setDuration(1);
            action.play();
            console.log(gltfScene);

            gltfScene.scene.traverse(function (child) {
                if (child.material && child.material.name === "Skin") {
                    if (faceTexture) {
                        const texture = new THREE.TextureLoader().load(faceTexture);
                        texture.flipY = false;
                        child.material.map = texture;
                        child.material.roughness = 1;
                    }
                }
                if (child.material && child.material.name === "Mouth") {
                    child.material.color.set(0xfc0303);
                }
                if (child.isMesh) {
                    child.receiveShadow = true;
                    child.castShadow = true;
                }
            });

            this.users3DObjects[id].object = model;
            console.log(id);
            console.log(this.users3DObjects[id].object);
            this.scene.add(this.users3DObjects[id].object);
            this.updatePositions();

            console.log("Updated positions:\n User", id, "has the following positions:", this.users3DObjects[id].position);
        });
    };

    removeUser = (id) => {
        console.log("Removing 3D avatar for user", id);
        console.log(this.users3DObjects[id].object);
        this.scene.remove(this.users3DObjects[id].object);
        delete this.users3DObjects[id];
        this.updatePositions();
    };

    updatePositions = () => {
        let radius = 10;
        let numberOfUsers = Object.keys(this.users3DObjects).length;

        let thisUser = Object.values(this.users3DObjects)[0];
        thisUser.object.position.set(radius, 2, 0);
        thisUser.object.lookAt(0, 2, 0);

        let userSeparation = (numberOfUsers > 2) ? ((Math.PI / 1.5) / (numberOfUsers - 2)) : 0;

        let i = -1;
        for (const key in this.users3DObjects) {
            if (i != -1) {
                // let angle = i * (2 * Math.PI / numberOfUsers);
                let angle = Math.PI - userSeparation * (numberOfUsers - 2) / 2 + i * userSeparation;

                let x = (radius) * Math.cos(angle);
                let z = (radius) * Math.sin(angle);
    
                console.log((key));
                console.log(this.users3DObjects[key].object);
                let human3DObject = this.users3DObjects[key].object;
                human3DObject.position.x = x;
                human3DObject.position.y = 2;
                human3DObject.position.z = z;
                human3DObject.lookAt(0, 2, 0);
            }
            i++;
        }

        let cameraAngle = 0;
        let x = radius - 1.5;
        let z = 0;

        if (this.isPov) {
            this.controls.target.set(x, 6.5, z);
            this.setOrbitAngle(Math.PI / 2, cameraAngle + Math.PI/2);
        }
        
    };

    clearScene = () => {
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            let obj = this.scene.children[i];
            this.scene.remove(obj);
        }
    };

    changePerspective = () => {
        if (this.isPov) {
            this.controls.target.set(0, 0, 0);
            this.controls.enableZoom = true;
            this.controls.minDistance = 20;
            this.controls.maxDistance = 30;

            this.controls.minPolarAngle = Math.PI / 4;
            this.controls.maxPolarAngle = Math.PI / 2;

            this.isPov = false;
            // this.updatePositions();
        } else {
            this.controls.enableZoom = false;
            this.controls.minDistance = 0;
            this.controls.maxDistance = 0.01;

            this.controls.minPolarAngle = Math.PI / 2 - this.polarRange;
            this.controls.maxPolarAngle = Math.PI / 2 + this.polarRange;

            this.isPov = true;
            this.updatePositions();
        }
        
    }

    moveMouth(id, value) {
        value = 1 / (1 + Math.E ** (6 - value / 200));

        if (this.users3DObjects[id].mixer) {
            this.users3DObjects[id].mixer.setTime(value);
        }
    }

    setOrbitAngle = (setPolar, setAzimuth) => {
        let orig = 
        [
            this.controls.minPolarAngle,
            this.controls.maxPolarAngle,
            this.controls.minAzimuthAngle,
            this.controls.maxAzimuthAngle
        ]

        this.controls.minPolarAngle = setPolar;
        this.controls.maxPolarAngle = setPolar;
        this.controls.minAzimuthAngle = setAzimuth;
        this.controls.maxAzimuthAngle = setAzimuth;
        this.controls.update();

        this.controls.minPolarAngle = orig[0];
        this.controls.maxPolarAngle = orig[1];
        this.controls.minAzimuthAngle = orig[2];
        this.controls.maxAzimuthAngle = orig[3];
        this.controls.update();
    }

}



export { Scene };