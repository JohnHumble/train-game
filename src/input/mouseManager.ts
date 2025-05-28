import * as THREE from "three";
import { EventManager, EventPublisher } from "../engine/events";
import { GameState } from "../engine/gameState";

export const WORLD_MOUSE_EVENT_CHANNEL = "world-mouse-event-channel";
export const UI_MOUSE_EVENT_CHANNEL = "ui-mouse-event-channel";

export type MouseWorldEvent = {
    onWorld: boolean;
    click: boolean;
    justClicked: boolean;
    position: THREE.Vector3 | undefined;
    mouseEvent: MouseEvent;
};

export class MouseManager {
    mousePublisher: EventPublisher<MouseWorldEvent>;

    onWorld: boolean;
    clicked: boolean;
    justClicked: boolean;
    position: THREE.Vector3 | undefined;

    raycaster: THREE.Raycaster;

    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.clicked = false;
    }

    public init(state: GameState, eventManager: EventManager) {
        this.mousePublisher = eventManager.createPublisher<MouseWorldEvent>(
            WORLD_MOUSE_EVENT_CHANNEL,
            this.constructor.name,
        );

        eventManager.registerSubscriber(WORLD_MOUSE_EVENT_CHANNEL, (event) => {
            console.log(event.data);
        });

        let onMouseMove = (event: MouseEvent) => {
            // TODO check if over ui
            this.justClicked = false;
            this.position = getTilePosition(event, state, this.raycaster);
            if (this.position) {
                this.onWorld = true;
                this.publishMouseEvent(event);
            } else {
                this.onWorld = false;
                this.publishMouseEvent(event);
            }
        };

        let onMouseDown = (event: MouseEvent) => {
            // TODO check if over ui
            if (!this.clicked) {
                this.justClicked = true;
            } else {
                this.justClicked = false;
            }

            this.clicked = true;
            this.publishMouseEvent(event);
        };

        let onMouseUp = (event: MouseEvent) => {
            // TODO check if over ui
            this.justClicked = false;
            this.clicked = false;
            this.publishMouseEvent(event);
        };

        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
    }

    private publishMouseEvent(event: MouseEvent) {
        this.mousePublisher.publish({
            onWorld: this.onWorld,
            click: this.clicked,
            justClicked: this.justClicked,
            position: this.position,
            mouseEvent: event,
        });
    }
}

function getTilePosition(
    event: MouseEvent,
    state: GameState,
    raycaster: THREE.Raycaster,
): THREE.Vector3 | undefined {
    let threeWrapper = state.get("three");
    let camera: THREE.PerspectiveCamera = threeWrapper.camera;
    let scene: THREE.Scene = threeWrapper.scene;

    let mouse = getMouseVec(event, state);

    // update raycaster
    raycaster.setFromCamera(mouse, camera);

    // get intersects
    const intersects = raycaster.intersectObjects(scene.children);

    // TODO check that intersects contains the ground plane
    let groundIntersect = getGroundIntersect(intersects);
    if (groundIntersect) {
        // change color of material for now
        let x = Math.round(groundIntersect.point.x / 2) * 2;
        let z = Math.round(groundIntersect.point.z / 2) * 2;

        let y = groundIntersect.point.y;

        return new THREE.Vector3(x, y, z);
    }
    return undefined;
}

function getMouseVec(event: MouseEvent, state: GameState) {
    let canvasRect: DOMRect = state.get("three").canvasRect;

    let scrollX = window.scrollX;
    let scrollY = window.scrollY;

    let x =
        ((event.clientX - canvasRect.left - scrollX) / window.innerWidth) * 2 -
        1;
    let y =
        ((-event.clientY + canvasRect.top - scrollY) / window.innerHeight) * 2 +
        1;

    return new THREE.Vector2(x, y);
}

function getGroundIntersect(intersects: any) {
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name == "ground-plane") {
            return intersects[i];
        }
    }
    return undefined;
}
