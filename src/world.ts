import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Engine, GameState } from "./enigne/engine";

export function initializeWorld(engine: Engine) {
    // add world objects.
    engine.addInitRule((state: GameState) => {
        // lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        state.ambientLight = ambientLight;

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.y = 10;
        sunLight.rotateX(Math.PI / 6);
        sunLight.rotateY(Math.PI / 6);
        state.sunLight = sunLight;

        // materials
        const groundMaterial = new THREE.MeshBasicMaterial();

        // Ground
        const groundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1024, 1024, 64, 64),
            groundMaterial,
        );
        groundPlane.rotateX(-Math.PI / 2);
        groundPlane.position.y = -0.1;
        groundPlane.name = "ground-plane";
        state.groundPlane = groundPlane;

        state.scene.add(state.ambientLight, state.sunLight, state.groundPlane);
    });
}

export function initializeCamera(engine: Engine) {
    // add camera controls
    engine.addInitRule((state: GameState) => {
        state.controls = new OrbitControls(
            state.camera,
            state.renderer.domElement,
        );
    });

    // camera controls
    engine.addUpdateRule((state, _) => {
        state.controls.update();
    });
}
