import { Object3D, Object3DEventMap } from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

const loader = new GLTFLoader();

export type modelsType = { [key: string]: any };
export var models: modelsType = {};

export function loadModels() {
    return new Promise<void>((resolve) => {
        loader.load("assets/train-track.glb", function (gltf) {
            console.log("loaded assets");

            // extract meshes out of model and save them to the state
            // let models = {};

            gltf.scene.children.forEach((mesh) => {
                models[mesh.name] = mesh;
            });

            resolve();
        });
    });
}
