// Singleton module, There should only ever be one of these at a time it will share the game state data with all instances.
import { error } from "console";
import * as THREE from "three";

interface State {
    canvasRect: DOMRect;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
}

type RuleFunction = (state: any) => void;
type UpdateRuleFunction = (state: any, elapsedTime: number) => void;

export class Engine {
    gameState: any;
    rules: RuleFunction[] = [];
    initRules: RuleFunction[] = [];
    updateRules: UpdateRuleFunction[] = [];
    running = false;

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
            throw error("Could not load canvas for game engine.");
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

        this.gameState = {
            canvasRect: canvasRect,
            renderer: renderer,
            scene: scene,
            camera: camera,
        };

        window.addEventListener("resize", () => {
            canvasSizes.width = window.innerWidth;
            canvasSizes.height = window.innerHeight;

            this.gameState.camera.aspect =
                canvasSizes.width / canvasSizes.height;
            this.gameState.camera.updateProjectionMatrix();

            this.gameState.renderer.setSize(
                canvasSizes.width,
                canvasSizes.height,
            );
            // gameState.renderer.render();
        });

        this.gameState.renderer.setClearColor(
            settings.background ?? 0xe232222,
            1,
        );
        this.gameState.renderer.setSize(canvasSizes.width, canvasSizes.height);
    }

    /**
     * start
     */
    public start() {
        this.running = true;
        this.initRules.forEach((rule) => {
            rule(this.gameState);
        });

        this.rules.forEach((rule) => {
            rule(this.gameState);
        });

        const clock = new THREE.Clock();

        const renderLoop = () => {
            const elapsedTime = clock.getDelta();

            // run update rules.
            this.updateRules.forEach((rule) => {
                rule(this.gameState, elapsedTime);
            });

            // Render scene
            this.gameState.renderer.render(
                this.gameState.scene,
                this.gameState.camera,
            );

            // get next render frame
            window.requestAnimationFrame(renderLoop);
        };

        renderLoop();
    }

    public stop() {
        this.running = false;
    }

    public addUpdateRule(rule: UpdateRuleFunction) {
        this.updateRules.push(rule);
    }

    public addInitRule(rule: RuleFunction) {
        this.initRules.push(rule);
    }

    public addRule(rule: RuleFunction, runRate: number) {
        let msRunRate = runRate * 1000;
        if (runRate > 0) {
            let innerRule = (gameState: State) => {
                return new Promise(() => {
                    if (!this.running) {
                        return;
                    }

                    rule(gameState);
                    setTimeout(rule, msRunRate);
                });
            };

            this.rules.push(innerRule);
        } else {
            this.rules.push((gameState) => {
                return new Promise(() => {
                    rule(gameState);
                });
            });
        }
    }
}
