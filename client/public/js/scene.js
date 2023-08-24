import "../index.css"
import * as THREE from "three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js"

class Scene {
    constructor() {
        this.gltfLoader = new GLTFLoader();

        this.usersMap = {};

        this.width = parent.innerWidth;
        this.height = parent.innerHeight * 0.8;

        this.nextUserPos = -10;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            // canvas: document.getElementById("background"),
            antialias: true
        })



        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.camera.position.setZ(30);

        this.renderer.setClearColor(0xFFFFDD);

        let canvasContainer = document.getElementById("canvas-container");
        canvasContainer.append(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0x404040, 50);
        this.scene.add(this.ambientLight);

        window.addEventListener("resize", () => {
            this.width = window.innerWidth;
            this.height = Math.floor(window.innerHeight * 0.8);
            this.camera.aspect = this.width / this.height;
            this.renderer.setSize(this.width, this.height);
        });

        // this.geometry = new THREE.TorusGeometry(10,3,16,100);
        // this.geometry = new THREE.ConeGeometry( 5, 10, 8, 1);
        // this.material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: false });
        // this.torus = new THREE.Mesh(this.geometry, this.material);
        // this.scene.add(this.torus);

        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        // this.torus.rotation.x += 0.01;
        // this.torus.rotation.y += 0.01;
        // this.torus.rotation.z += 0.01;

        this.renderer.render(this.scene, this.camera);
    }

    addUser = (id, faceTexture) => {

        this.gltfLoader.load("../assets/human_bust.gltf", (gltfScene) => {
            console.log(gltfScene);
            // console.log(gltfScene.materials.getMaterialByName);

            gltfScene.scene.traverse(function (child) {

                if (child.material && child.material.name === "Skin") {

                    // child.material = new THREE.MeshBasicMaterial( { wireframe: true } );

                    const texture = new THREE.TextureLoader().load(faceTexture);

                    texture.flipY = false;
                    child.material.map = texture;
                    // child.material.shading = THREE.SmoothShading;
                }
            });

            gltfScene.scene.scale.set(5, 5, 5);
            // gltfScene.scene.rotation.y = 2;
            gltfScene.scene.position.x = this.nextUserPos;
            this.nextUserPos += 20;
            this.scene.add(gltfScene.scene);
        });

        // let geometry = new THREE.ConeGeometry( 5, 10, 8, 1);
        // let material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: false });
        // let userHead = new THREE.Mesh(geometry, material);
        // userHead.position.set(this.nextUserPos, 0, 0);
        // this.usersMap[id] = {};
        // this.usersMap[id].userHead = userHead;
        // this.scene.add(userHead);
        // this.nextUserPos += 10;

        // let userPosition = new THREE.Vector3(this.nextUserPos, 0, 0);


    }


}



export { Scene };