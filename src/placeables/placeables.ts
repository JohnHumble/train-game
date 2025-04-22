import * as THREE from "three";
import { trackPlaceableFactory } from "../track/trackPlaceable";
import { models } from "../loader";
import { deepcopy } from "../utilities";
import { GameState } from "../engine/gameState";
import { EventManager } from "../engine/events";
import { getGridKey, GRID_ID, MapGrid } from "./mapGrid";
import { Train } from "../train/train";

// need to keep track of current placeable object

const ERASE_MODE = "erase";
const PLACE_MODE = "place";
const SELECT_MODE = "select";

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

export class PlaceableManager {
    currentPlaceable: string;
    mode: string;

    raycaster: THREE.Raycaster;
    placeables: { [key: string]: Placeable };

    placementRotation: number;
    placementPosition: THREE.Vector3;

    pastObj: PlaceableObject | undefined;

    constructor() {
        this.currentPlaceable = "strait";
        this.mode = PLACE_MODE;
        this.raycaster = new THREE.Raycaster();

        this.placementRotation = 0;
        this.placementPosition = new THREE.Vector3();
        this.pastObj = undefined;
    }

    public init(state: GameState, eventManager: EventManager) {
        let scene = state.get("three").scene;
        this.placeables = trackPlaceableFactory(models, scene);
        let grid: MapGrid = state.get(GRID_ID);

        let onMouseMove = (event: MouseEvent) => {
            if (this.mode == SELECT_MODE) {
                return;
            }
            let position = getTilePosition(event, state, this.raycaster);
            if (position) {
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
            } else {
                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    false;
            }
        };

        let onMouseClick = (event: MouseEvent) => {
            let position = getTilePosition(event, state, this.raycaster);

            if (position) {
                if (this.mode == SELECT_MODE) {
                    console.log("selecting");
                    let key = getGridKey([position.x, position.z]);
                    let obj = grid.map.get(key);
                    if (obj !== undefined) {
                        if (obj.action !== undefined) {
                            obj.action();
                        }
                    }
                }

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
                    let placeable = this.placeables[this.currentPlaceable].make(
                        position.x,
                        position.y,
                        position.z,
                        this.placementRotation,
                    );
                    if (placeable.tiles.length > 0) {
                        // check that space is available
                        let available = grid.isAvailable(placeable.tiles);
                        if (available) {
                            placeable
                                .getModels()
                                .map((model: THREE.Object3D) => {
                                    scene.add(model);
                                });

                            placeable.tiles.forEach(
                                (tile: [number, number]) => {
                                    let tileKey = getGridKey(tile);
                                    console.log("placing at: " + tileKey);
                                    grid.map.set(tileKey, placeable);
                                },
                            );

                            if (placeable.getPaths() !== undefined) {
                                if (state.getAll("train").length <= 0) {
                                    state.spawn(
                                        new Train(
                                            placeable.getPaths()[0],
                                            models,
                                            scene,
                                            5,
                                        ),
                                    );
                                }
                            }
                        }
                    } else {
                        placeable
                            .getModels()
                            .forEach((model: THREE.Object3D) => {
                                scene.add(model);
                            });
                    }
                }
            }
        };

        // TODO move these to a more generic event handler system
        window.addEventListener("click", onMouseClick);
        window.addEventListener("mousemove", onMouseMove);

        // TODO move this to seperate function
        window.addEventListener("keypress", (event) => {
            if (event.key.toLowerCase() == "r") {
                this.placementRotation += Math.PI / 2;
                if (this.placementRotation >= Math.PI * 2) {
                    this.placementRotation = 0;
                }
                this.updateDummyPosColor(grid);
            }

            if (event.key.toLowerCase() == "n") {
                let keys = Object.keys(this.placeables);
                let ind = 0;
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i] == this.currentPlaceable) {
                        ind = i + 1;
                        break;
                    }
                }
                if (ind >= keys.length) {
                    ind -= keys.length;
                }
                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    false;
                this.currentPlaceable = keys[ind];
                this.updateDummyPosColor(grid);

                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    this.mode == PLACE_MODE;
            }

            if (event.key.toLowerCase() == "e") {
                this.mode = ERASE_MODE;
                console.log("erase mode");
                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    false;
            }

            if (event.key.toLowerCase() == "p") {
                this.mode = PLACE_MODE;
                console.log("place mode");
                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    true;
            }

            if (event.key.toLowerCase() == "s") {
                this.mode = SELECT_MODE;
                console.log("select mode");
                this.placeables[this.currentPlaceable].getDummyObj().visible =
                    false;
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
