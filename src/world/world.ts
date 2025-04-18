import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GameState } from "../engine/gameState";
import { EventManager } from "../engine/events";

export class WorldManager {
    ambientLight: THREE.AmbientLight;
    sunLight: THREE.DirectionalLight;
    groundPlane: THREE.Mesh;
    controls: any;

    threeWrapId: string = "three";

    constructor() {}

    init(state: GameState, eventManager: EventManager) {
        // lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.ambientLight = ambientLight;

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.y = 10;
        sunLight.rotateX(Math.PI / 6);
        sunLight.rotateY(Math.PI / 6);
        this.sunLight = sunLight;

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
        this.groundPlane = groundPlane;

        let scene = state.get(this.threeWrapId).scene;
        scene.add(this.ambientLight, this.sunLight, this.groundPlane);

        this.controls = new OrbitControls(
            state.get(this.threeWrapId).camera,
            state.get(this.threeWrapId).renderer.domElement,
        );
    }

    public update(state: GameState, elapsedTime: number) {
        this.controls.update();
    }
}

// export function initializeCamera(engine: Engine) {
//     // add camera controls
//     engine.addInitRule((state: GameState) => {

//         );
//     });

//     // camera controls
//     engine.addUpdateRule((state, _) => {
//         state.controls.update();
//     });
// }
