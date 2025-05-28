import { EventManager } from "../engine/events";
import { GameState } from "../engine/gameState";
import * as THREE from "three";

export class CameraControl {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    shift: boolean;
    out: boolean;
    in: boolean;

    // mouseDown: boolean;
    // previousMousePos: THREE.Vector2;

    constructor() {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.shift = false;
        // this.mouseDown = false;
    }

    init(state: GameState, eventManager: EventManager) {}

    public update(state: GameState, elapsedTime: number) {
        let camera: THREE.PerspectiveCamera = state.get("three").camera;
        let speed = 0.5;
        let rotSpeed = Math.PI / 128;

        if (this.up) {
            if (this.shift) {
                camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotSpeed);
            } else {
                translateCameraUpDown(camera, -speed);
            }
        }
        if (this.down) {
            if (this.shift) {
                camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotSpeed);
            } else {
                translateCameraUpDown(camera, speed);
            }
        }

        if (this.left) {
            if (this.shift) {
                camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotSpeed);

                console.log(camera.rotation);
            } else {
                camera.translateOnAxis(new THREE.Vector3(1, 0, 0), -speed);
            }
        }
        if (this.right) {
            if (this.shift) {
                camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -rotSpeed);
            } else {
                camera.translateOnAxis(new THREE.Vector3(1, 0, 0), speed);
            }
        }
        if (this.out) {
            camera.translateOnAxis(new THREE.Vector3(0, 0, 1), speed);
        }
        if (this.in) {
            camera.translateOnAxis(new THREE.Vector3(0, 0, 1), -speed);
        }

        window.addEventListener("keydown", (event) => {
            if (event.key === "Shift") {
                this.shift = true;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                this.up = true;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.down = true;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                this.left = true;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                this.right = true;
            }
            if (event.key === " ") {
                event.preventDefault();
                this.out = true;
            }
            if (event.key === "Enter") {
                this.in = true;
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key === "Shift") {
                this.shift = false;
            }
            if (event.key === "ArrowUp") {
                this.up = false;
            }
            if (event.key === "ArrowDown") {
                this.down = false;
            }
            if (event.key === "ArrowLeft") {
                this.left = false;
            }
            if (event.key === "ArrowRight") {
                this.right = false;
            }
            if (event.key === " ") {
                this.out = false;
            }
            if (event.key === "Enter") {
                this.in = false;
            }
        });

        // // TODO move these to the mouse manager
        // window.addEventListener("mousedown", (event) => {
        //     this.mouseDown = true;
        // });
        // window.addEventListener("mouseup", (event) => {
        //     this.mouseDown = false;
        // });
        // window.addEventListener("mousemove", (event) => {
        //     if (this.shift && this.mouseDown) {
        //         let ratio = 0.00001 * camera.position.y;
        //         translateCameraUpDown(camera, -event.movementY * ratio);
        //         camera.translateOnAxis(
        //             new THREE.Vector3(1, 0, 0),
        //             -event.movementX * ratio,
        //         );
        //     }
        // });
    }
}

function translateCameraUpDown(camera: THREE.PerspectiveCamera, speed: number) {
    let camRot = camera.rotation.z;
    let speedX = Math.sin(camRot) * speed;
    let speedZ = Math.cos(camRot) * speed;
    camera.position.x += speedX;
    camera.position.z += speedZ;
}
