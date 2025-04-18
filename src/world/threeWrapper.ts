import * as THREE from "three";
import { IInitActor, IUpdateActor } from "../engine/engine";
import { EventManager } from "../engine/events";
import { GameState } from "../engine/gameState";

export class ThreeWrapper implements IUpdateActor {
    inState: boolean = true;
    id: string = "three";

    public readonly camera: THREE.PerspectiveCamera;
    public readonly scene: THREE.Scene;
    public readonly renderer: THREE.WebGLRenderer;

    constructor(settings: any = {}) {
        const canvas = document.getElementById("canvas-box");

        if (!canvas) {
            throw console.error("Could not load canvas for game engine.");
        }

        let canvasRect = canvas.getBoundingClientRect();
        canvasRect.width;
        canvasRect.height;

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
        });

        this.scene = new THREE.Scene();

        const canvasSizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        this.camera = new THREE.PerspectiveCamera(
            settings.fov ?? 75,
            canvasSizes.width / canvasSizes.height,
            settings.near ?? 0.1,
            settings.far ?? 1024,
        );
        this.camera.position.z = 30;
        this.camera.position.y = 10;
        this.camera.rotateX(Math.PI / 2);

        // TODO move this to an engine event handler system.
        window.addEventListener("resize", () => {
            canvasSizes.width = window.innerWidth;
            canvasSizes.height = window.innerHeight;

            this.camera.aspect = canvasSizes.width / canvasSizes.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(canvasSizes.width, canvasSizes.height);
        });

        this.renderer.setClearColor(settings.background ?? 0xe232222, 1);
        this.renderer.setSize(canvasSizes.width, canvasSizes.height);
    }

    // init(state: GameState, eventManager: EventManager) {}

    update(state: GameState, elapsedTime: number) {
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}
