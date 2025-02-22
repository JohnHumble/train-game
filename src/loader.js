import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

export function loadModels(engine) {
    engine.addInitRule((state) => {
        loader.load("assets/train-track.glb", function (gltf) {
            console.log("loaded assets");

            // extract meshes out of model and save them to the state
            let models = {};
            gltf.scene.children.forEach((mesh) => {
                models[mesh.name] = mesh;
            });
            state.models = models;
        });
    });
}
