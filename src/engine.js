// Singleton module, There should only ever be one of these at a time it will share the game state data with all instances.
import * as THREE from "three";

/**
 *
 * @param {} settings Contains the following optional fields:
 *      - fov: Field of view
 *      - near: near camera range
 *      - far: far camera range
 *      - background: background color
 * @returns Engine module.
 */
export default function makeEngine(settings = {}) {
    /**
     * State that is loaded into each rule.
     *
     * State is initialized with the following data:
     *  - scene: THREE.js scene
     *  - camera: THREE.js camera
     */
    let gameState = {};

    // free rules.
    let rules = [];

    // initialize rules.
    let initRules = [];

    // update rules.
    let updateRules = [];

    // running flag.
    let running = false;

    // THREE setup.
    const canvas = document.getElementById("canvas-box");
    if (!canvas) {
        console.log("could not load canvas.");
        return;
    }

    gameState.canvasRect = canvas.getBoundingClientRect();
    gameState.canvasRect.width;
    gameState.canvasRect.height;

    gameState.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
    });

    gameState.scene = new THREE.Scene();

    const canvasSizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    };

    gameState.camera = new THREE.PerspectiveCamera(
        settings.fov ?? 75,
        canvasSizes.width / canvasSizes.height,
        settings.near ?? 0.1,
        settings.far ?? 1024,
    );
    gameState.camera.position.z = 30;
    gameState.camera.position.y = 10;
    gameState.camera.rotateX(Math.PI / 2);

    window.addEventListener("resize", () => {
        canvasSizes.width = window.innerWidth;
        canvasSizes.height = window.innerHeight;

        gameState.camera.aspect = canvasSizes.width / canvasSizes.height;
        gameState.camera.updateProjectionMatrix();

        gameState.renderer.setSize(canvasSizes.width, canvasSizes.height);
        // gameState.renderer.render();
    });

    gameState.renderer.setClearColor(settings.background ?? 0xe232222, 1);
    gameState.renderer.setSize(canvasSizes.width, canvasSizes.height);

    function start() {
        running = true;
        initRules.forEach((rule) => {
            rule();
        });

        rules.forEach((rule) => {
            rule();
        });

        const clock = new THREE.Clock();

        const renderLoop = () => {
            const elapsedTime = clock.getDelta();

            // run update rules.
            updateRules.forEach((rule) => {
                rule(elapsedTime);
            });

            // Render scene
            gameState.renderer.render(gameState.scene, gameState.camera);

            // get next render frame
            window.requestAnimationFrame(renderLoop);
        };

        renderLoop();
    }

    function stop() {
        running = false;
    }

    function addInitRule(ruleFunction) {
        initRules.push(() => {
            ruleFunction(gameState);
        });
    }

    function addRule(ruleFunction, runRate) {
        let msRunRate = runRate * 1000;
        if (runRate > 0) {
            let rule = () => {
                return new Promise(() => {
                    if (!running) {
                        return;
                    }

                    ruleFunction(gameState);
                    setTimeout(rule, msRunRate);
                });
            };

            rules.push(rule);
        } else {
            rules.push(() => {
                return new Promise(() => {
                    ruleFunction(gameState);
                });
            });
        }
    }

    function addUpdateRule(ruleFunction) {
        updateRules.push((deltaSeconds) => {
            ruleFunction(gameState, deltaSeconds);
        });
    }

    return {
        start: start,
        addUpdateRule: addUpdateRule,
        stop: stop,
        addInitRule: addInitRule,
        addRule: addRule,
        addUpdateRule: addUpdateRule,
    };
}
