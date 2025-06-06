import * as THREE from "three";
import { trackPlaceableFactory } from "../track/trackPlaceable";
import { models } from "../loader";
import { GameState } from "../engine/gameState";
import { Event, EventManager, EventPublisher } from "../engine/events";
import { getGridKey, GRID_ID, MapGrid } from "./mapGrid";
import { Train } from "../train/train";
import {
    WORLD_MOUSE_EVENT_CHANNEL,
    MouseWorldEvent,
} from "../input/mouseManager";
import { ToyboxPlaceEvent } from "../input/toybox";

// need to keep track of current placeable object

export const ERASE_MODE = "erase";
export const PLACE_MODE = "place";
export const SELECT_MODE = "select";

export interface PlaceableObject {
    getModels: () => THREE.Object3D[];
    tiles: [number, number][];
    setTransparent: () => void;
    setOpaque: () => void;
    getPaths: () => [number, number][][];
    action: (() => void) | undefined;
}

export interface Placeable {
    make: (x: number, y: number, z: number, rot: number) => PlaceableObject;
    updateDummyPos: (x: number, y: number, z: number, rot: number) => void;
    getDummyObj: () => THREE.Mesh;
    getDummyTiles: () => [number, number][];
    dummyTransparent: () => void;
    dummyOpaque: () => void;
}

export type PlaceEvent = {
    location: THREE.Vector3;
    rotation: number;
    item: string;
};

export class PlaceableManager {
    // Manage placing objects into the game world

    mode: string;

    placeables: { [key: string]: Placeable };
    placementPublisher: EventPublisher<PlaceEvent>;
    placementRotation: number;
    placementPosition: THREE.Vector3;
    currentPlaceable: string;

    pastObj: PlaceableObject | undefined;

    constructor() {
        this.mode = SELECT_MODE;
        this.pastObj = undefined;

        this.currentPlaceable = "strait";
        this.placementRotation = 0;
        this.placementPosition = new THREE.Vector3();
    }

    public init(state: GameState, eventManager: EventManager) {
        let scene = state.get("three").scene;
        this.placeables = trackPlaceableFactory(models, scene);
        let grid: MapGrid = state.get(GRID_ID);

        this.placementPublisher = eventManager.createPublisher(
            "placement",
            "placement input",
        );

        eventManager.registerSubscriber(
            "placeable-type",
            (event: Event<ToyboxPlaceEvent>) => {
                if (event.data.mode === "rot") {
                    this.placementRotation += Math.PI / 2;
                    if (this.placementRotation >= Math.PI * 2) {
                        this.placementRotation = 0;
                    }
                    this.updateDummyPosColor(grid);
                } else if (event.data.mode === PLACE_MODE) {
                    this.mode = PLACE_MODE;
                    this.placeables[
                        this.currentPlaceable
                    ].getDummyObj().visible = true;
                    this.switchPlaceable(event.data.type, grid);
                } else if (event.data.mode === SELECT_MODE) {
                    this.mode = SELECT_MODE;
                    this.placeables[
                        this.currentPlaceable
                    ].getDummyObj().visible = false;
                } else if (event.data.mode === ERASE_MODE) {
                    this.mode = ERASE_MODE;
                    this.placeables[
                        this.currentPlaceable
                    ].getDummyObj().visible = false;
                }
            },
        );

        // eventManager.registerSubscriber("placement", logPlaceEvents);
        eventManager.registerSubscriber(
            "placement",
            (event: Event<PlaceEvent>) => {
                let placeable = this.placeables[event.data.item].make(
                    event.data.location.x,
                    event.data.location.y,
                    event.data.location.z,
                    event.data.rotation,
                );
                if (placeable.tiles.length > 0) {
                    // check that space is available
                    let available = grid.isAvailable(placeable.tiles);
                    if (available) {
                        placeable.getModels().map((model: THREE.Object3D) => {
                            scene.add(model);
                        });

                        placeable.tiles.forEach((tile: [number, number]) => {
                            let tileKey = getGridKey(tile);
                            // console.log("placing at: " + tileKey);
                            grid.map.set(tileKey, placeable);
                        });

                        if (placeable.getPaths() !== undefined) {
                            if (state.getAll("train").length <= 0) {
                                state.spawn(
                                    new Train(
                                        placeable.getPaths()[0],
                                        models,
                                        scene,
                                        // 4,
                                        10,
                                    ),
                                );
                            }
                        }
                    }
                } else {
                    placeable.getModels().forEach((model: THREE.Object3D) => {
                        scene.add(model);
                    });
                }
            },
        );

        eventManager.registerSubscriber(
            WORLD_MOUSE_EVENT_CHANNEL,
            (event: Event<MouseWorldEvent>) => {
                let position = event.data.position;
                if (position) {
                    if (this.mode !== SELECT_MODE) {
                        if (this.pastObj !== undefined) {
                            this.pastObj.setOpaque();
                        }
                        if (this.mode == ERASE_MODE) {
                            let key = getGridKey([position.x, position.z]);
                            let obj = grid.map.get(key);
                            if (obj !== undefined) {
                                obj.setTransparent();
                                this.pastObj = obj;
                            }
                        } else if (this.mode == PLACE_MODE) {
                            this.placementPosition = position;
                            this.updateDummyPosColor(grid);
                        } else {
                            console.log(`Mode: ${this.mode}`);
                        }
                    }

                    if (event.data.justClicked && this.mode == SELECT_MODE) {
                        console.log("selecting");
                        let key = getGridKey([position.x, position.z]);
                        let obj = grid.map.get(key);
                        if (obj !== undefined) {
                            if (obj.action !== undefined) {
                                obj.action();
                            }
                        }
                    }

                    if (event.data.click) {
                        let scene: THREE.Scene = state.get("three").scene;

                        if (this.mode == ERASE_MODE) {
                            let key = getGridKey([position.x, position.z]);
                            let obj = grid.map.get(key);
                            if (obj !== undefined) {
                                obj.getModels().map((model: any) => {
                                    scene.remove(model);
                                });
                                obj.tiles.forEach((tile: number[]) => {
                                    let tileKey = getGridKey(tile);
                                    console.log("removing at: " + tileKey);
                                    grid.map.delete(tileKey);
                                });
                            }
                        }
                        if (this.mode == PLACE_MODE) {
                            this.placementPublisher.publish({
                                location: position,
                                rotation: this.placementRotation,
                                item: this.currentPlaceable,
                            });
                        }
                    }
                } else {
                    this.placeables[
                        this.currentPlaceable
                    ].getDummyObj().visible = false;
                }
            },
        );

        // let onMouseMove = (event: MouseEvent) => {

        //     }
        // };

        // let onMouseClick = (event: MouseEvent) => {
        //     let position = getTilePosition(event, state, this.raycaster);

        //     if (position) {

        //     }
        // };

        // // TODO move these to a more generic event handler system
        // window.addEventListener("click", onMouseClick);
        // window.addEventListener("mousemove", onMouseMove);

        // TODO move this to seperate function
        window.addEventListener("keypress", (event) => {
            if (event.key.toLowerCase() == "r") {
                this.placementRotation += Math.PI / 2;
                if (this.placementRotation >= Math.PI * 2) {
                    this.placementRotation = 0;
                }
                this.updateDummyPosColor(grid);
            }
        });
    }

    public update(state: GameState, elapsedTime: number) {
        let grid = state.get(GRID_ID);
    }

    updateDummyPosColor(grid: MapGrid) {
        this.placeables[this.currentPlaceable].updateDummyPos(
            this.placementPosition.x,
            this.placementPosition.y,
            this.placementPosition.z,
            this.placementRotation,
        );
        if (
            !grid.isAvailable(
                this.placeables[this.currentPlaceable].getDummyTiles(),
            )
        ) {
            this.placeables[this.currentPlaceable].dummyTransparent();
        } else {
            this.placeables[this.currentPlaceable].dummyOpaque();
        }
    }

    switchPlaceable(placeable: string, grid: MapGrid) {
        this.placeables[this.currentPlaceable].getDummyObj().visible = false;
        this.currentPlaceable = placeable;
        this.updateDummyPosColor(grid);

        this.placeables[this.currentPlaceable].getDummyObj().visible =
            this.mode == PLACE_MODE;
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

function getGroundIntersect(intersects: any) {
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name == "ground-plane") {
            return intersects[i];
        }
    }
    return undefined;
}

function getMouseVec(event: MouseEvent, state: GameState) {
    let canvasRect: DOMRect = state.get("three").canvasRect;

    let x = ((event.clientX - canvasRect.left) / window.innerWidth) * 2 - 1;
    let y = ((-event.clientY + canvasRect.top) / window.innerHeight) * 2 + 1;

    return new THREE.Vector2(x, y);
}

function logPlaceEvents(event: Event<PlaceEvent>) {
    console.log(event);
}
