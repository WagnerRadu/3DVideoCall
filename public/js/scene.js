import "../style.css"
import * as THREE from "three";

class Scene {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("background"),
        })

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.camera.position.setZ(30);

        this.ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(this.ambientLight);

        this.geometry = new THREE.TorusGeometry(10,3,16,100);
        this.material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: true });
        this.torus = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.torus);

        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        this.torus.rotation.x += 0.01;
        this.torus.rotation.y += 0.01;
        this.torus.rotation.z += 0.01;

        this.renderer.render( this.scene, this.camera );
    }
}

export { Scene };