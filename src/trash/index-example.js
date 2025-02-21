import makeEngine from "../engine.js";
import * as THREE from "three";

var engine = makeEngine({
    background: 0xffffff,
});

// Add game state data.
engine.addInitRule((state) => {
    state.message = "happy";
}, 0);

engine.addInitRule((state) => {
    const material = new THREE.MeshToonMaterial();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    state.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.x = 2;
    pointLight.position.y = 2;
    pointLight.position.z = 2;
    state.scene.add(pointLight);

    state.box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), material);
    state.torus = new THREE.Mesh(
        new THREE.TorusGeometry(5, 1.5, 16, 100),
        material,
    );
    state.scene.add(state.torus, state.box);
});

// run a rule periodically.
engine.addRule((state) => {
    console.log(state.message);
}, 1.0);

engine.addUpdateRule((state, deltaTime) => {
    state.box.rotation.x += deltaTime;
    state.box.rotation.y += deltaTime;
    state.box.rotation.z += deltaTime;

    state.torus.rotation.x += deltaTime;
    state.torus.rotation.y += deltaTime;
    state.torus.rotation.z += deltaTime;
});

engine.start();
