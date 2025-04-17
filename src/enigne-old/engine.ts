// Singleton module, There should only ever be one of these at a time it will share the game state data with all instances.
import * as THREE from "three";
import { Train } from "../train/train";
import { WorldManager } from "../world/world";

export interface GameState {
    // canvasRect: DOMRect;
    // renderer: THREE.WebGLRenderer;
    // scene: THREE.Scene;
    // camera: THREE.PerspectiveCamera;

    world: WorldManager;

    grid: Map<string, any>;
    train: Train | undefined;

    running: boolean;
}

export interface InitActorData {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
}

export interface IActor {
    init?: () => void;
    update?: (state: GameState, elapsedTime: number) => void;
    clean?: () => void;
}

type InitFunction = (init: InitActorData) => void;
type UpdateFunction = (state: GameState, elapsedTime: number) => void;
type CleanupFunction = () => void;

export class Engine {
    initData: InitActorData;
    gameState: GameState;
    // rules: RuleFunction[] = [];
    initActing: InitFunction[] = [];
    updateRules: UpdateFunction[] = [];
    // running = false;

    actors: IActor[];

    /**
     *
     * @param {} settings Contains the following optional fields:
     *      - fov: Field of view
     *      - near: near camera range
     *      - far: far camera range
     *      - background: background color
     * @returns Engine module.
     */
    public constructor(settings: any = {}) {
        const canvas = document.getElementById("canvas-box");

        if (!canvas) {
            throw console.error("Could not load canvas for game engine.");
        }

        let canvasRect = canvas.getBoundingClientRect();
        canvasRect.width;
        canvasRect.height;

        let renderer = new THREE.WebGLRenderer({
            canvas: canvas,
        });

        let scene = new THREE.Scene();

        const canvasSizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        let camera = new THREE.PerspectiveCamera(
            settings.fov ?? 75,
            canvasSizes.width / canvasSizes.height,
            settings.near ?? 0.1,
            settings.far ?? 1024,
        );
        camera.position.z = 30;
        camera.position.y = 10;
        camera.rotateX(Math.PI / 2);

        // this.gameState = {
        //     canvasRect: canvasRect,
        //     renderer: renderer,
        //     scene: scene,
        //     camera: camera,
        // };

        this.initData = {
            scene: scene,
            renderer: renderer,
            camera: camera,
        };

        this.initData.renderer.setClearColor(
            settings.background ?? 0xe232222,
            1,
        );
        this.initData.renderer.setSize(canvasSizes.width, canvasSizes.height);
    }

    /**
     * start
     */
    public start() {
        this.gameState.running = true;
        // this.gameState.forEach((rule) => {
        //     rule(this.gameState);
        // });

        // this.rules.forEach((rule) => {
        //     rule(this.gameState);
        // });

        const clock = new THREE.Clock();

        const renderLoop = () => {
            const elapsedTime = clock.getDelta();

            // run update rules.
            this.updateRules.forEach((rule) => {
                rule(this.gameState, elapsedTime);
            });

            // Render scene
            this.initData.renderer.render(
                this.initData.scene,
                this.initData.camera,
            );

            // get next render frame
            if (this.gameState.running) {
                window.requestAnimationFrame(renderLoop);
            }
        };

        renderLoop();
    }

    public stop() {
        this.gameState.running = false;
    }

    // public addUpdateRule(rule: UpdateFunction) {
    //     this.updateRules.push(rule);
    // }

    // public addInitRule(rule: InitFunction) {
    //     this.initRules.push(rule);
    // }

    // public addRule(rule: RuleFunction, runRate: number) {
    //     let msRunRate = runRate * 1000;
    //     if (runRate > 0) {
    //         let innerRule = (gameState: GameState) => {
    //             return new Promise(() => {
    //                 if (!this.running) {
    //                     return;
    //                 }

    //                 rule(gameState);
    //                 setTimeout(rule, msRunRate);
    //             });
    //         };

    //         this.rules.push(innerRule);
    //     } else {
    //         this.rules.push((gameState) => {
    //             return new Promise(() => {
    //                 rule(gameState);
    //             });
    //         });
    //     }
    // }
}
