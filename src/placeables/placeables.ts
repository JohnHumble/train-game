import * as THREE from "three";
import { trackPlaceableFactory } from "../track/trackPlaceable";
import { models } from "../loader";
import { deepcopy } from "../utilities";
import { makeTrain } from "../train/train";
import { GameState } from "../engine/gameState";

// need to keep track of current placeable object

const ERASE_MODE = "erase";
const PLACE_MODE = "place";
const SELECT_MODE = "select";

export interface PlaceableObject {
    getModels: () => THREE.Object3D[];
    tiles: number[][];
    setTransparent: () => void;
    setOpaque: () => void;
    getPaths: () => [number, number][][];
    action: (() => void) | undefined;
}

export interface Placeable {
    make: (x: number, y: number, z: number, rot: number) => PlaceableObject;
    updateDummyPos: (x: number, y: number, z: number, rot: number) => void;
    getDummyObj: () => THREE.Mesh;
    getDummyTiles: () => number[][];
    dummyTransparent: () => void;
    dummyOpaque: () => void;
}

export function initializePlaceables(engine: Engin) {
    engine.addInitRule((state: GameState) => {
        let placeables = trackPlaceableFactory(models, state.scene);

        let currentPlaceable = "strait";
        let mode = PLACE_MODE;

        // add placeable mouse click event
        const raycaster = new THREE.Raycaster();

        let placementRotation = 0;
        let placementPosition = new THREE.Vector3();

        let pastObj: PlaceableObject | undefined = undefined;

        // Game world grid
        state.grid = new Map();

        function isAvailable(tiles: number[][]) {
            let available = true;
            tiles.forEach((tile) => {
                let tileKey = getGridKey(tile);
                available = available && state.grid.get(tileKey) == undefined;
            });
            return available;
        }

        function updateDummyPosColor() {
            placeables[currentPlaceable].updateDummyPos(
                placementPosition.x,
                placementPosition.y,
                placementPosition.z,
                placementRotation,
            );
            if (!isAvailable(placeables[currentPlaceable].getDummyTiles())) {
                placeables[currentPlaceable].dummyTransparent();
            } else {
                placeables[currentPlaceable].dummyOpaque();
            }
        }

        function onMouseMove(event: MouseEvent) {
            if (mode == SELECT_MODE) {
                return;
            }
            let position = getTilePosition(event, state, raycaster);
            if (position) {
                if (pastObj !== undefined) {
                    pastObj.setOpaque();
                }
                if (mode == ERASE_MODE) {
                    let key = getGridKey([position.x, position.z]);
                    let obj = state.grid.get(key);
                    if (obj !== undefined) {
                        obj.setTransparent();
                        pastObj = obj;
                    }
                } else if (mode == PLACE_MODE) {
                    placementPosition = position;
                    updateDummyPosColor();
                } else {
                    console.log(`Mode: ${mode}`);
                }
            } else {
                placeables[currentPlaceable].getDummyObj().visible = false;
            }
        }

        function onMouseClick(event: MouseEvent) {
            let position = getTilePosition(event, state, raycaster);

            if (position) {
                if (mode == SELECT_MODE) {
                    console.log("selecting");
                    let key = getGridKey([position.x, position.z]);
                    let obj = state.grid.get(key);
                    if (obj !== undefined) {
                        if (obj.action !== undefined) {
                            obj.action();
                        }
                    }
                }

                if (mode == ERASE_MODE) {
                    let key = getGridKey([position.x, position.z]);
                    let obj = state.grid.get(key);
                    if (obj !== undefined) {
                        obj.getModels().map((model: any) => {
                            state.scene.remove(model);
                        });
                        obj.tiles.forEach((tile: number[]) => {
                            let tileKey = getGridKey(tile);
                            console.log("removing at: " + tileKey);
                            state.grid.delete(tileKey);
                        });
                    }
                }
                if (mode == PLACE_MODE) {
                    let placeable = placeables[currentPlaceable].make(
                        position.x,
                        position.y,
                        position.z,
                        placementRotation,
                    );
                    if (placeable.tiles.length > 0) {
                        // check that space is available
                        let available = isAvailable(placeable.tiles);
                        if (available) {
                            placeable.getModels().map((model) => {
                                state.scene.add(model);
                            });

                            placeable.tiles.forEach((tile) => {
                                let tileKey = getGridKey(tile);
                                console.log("placing at: " + tileKey);
                                state.grid.set(tileKey, placeable);
                            });

                            if (placeable.getPaths() !== undefined) {
                                if (state.train == undefined) {
                                    state.train = makeTrain(
                                        placeable.getPaths()[0],
                                        models,
                                        state.scene,
                                    );
                                }
                            }
                        }
                    } else {
                        placeable.getModels().forEach((model) => {
                            state.scene.add(model);
                        });
                    }
                }
            }
        }

        // TODO move these to a more generic event handler system
        window.addEventListener("click", onMouseClick);
        window.addEventListener("mousemove", onMouseMove);

        // TODO move this to seperate function
        window.addEventListener("keypress", (event) => {
            if (event.key.toLowerCase() == "r") {
                placementRotation += Math.PI / 2;
                if (placementRotation >= Math.PI * 2) {
                    placementRotation = 0;
                }
                updateDummyPosColor();
            }

            if (event.key.toLowerCase() == "n") {
                let keys = Object.keys(placeables);
                let ind = 0;
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i] == currentPlaceable) {
                        ind = i + 1;
                        break;
                    }
                }
                if (ind >= keys.length) {
                    ind -= keys.length;
                }
                placeables[currentPlaceable].getDummyObj().visible = false;
                currentPlaceable = keys[ind];
                updateDummyPosColor();

                placeables[currentPlaceable].getDummyObj().visible =
                    mode == PLACE_MODE;
            }

            if (event.key.toLowerCase() == "e") {
                mode = ERASE_MODE;
                console.log("erase mode");
                placeables[currentPlaceable].getDummyObj().visible = false;
            }

            if (event.key.toLowerCase() == "p") {
                mode = PLACE_MODE;
                console.log("place mode");
                placeables[currentPlaceable].getDummyObj().visible = true;
            }

            if (event.key.toLowerCase() == "s") {
                mode = SELECT_MODE;
                console.log("select mode");
                placeables[currentPlaceable].getDummyObj().visible = false;
            }
        });
    });
}

export function getGridKey(tile: number[]): string {
    let x = Math.round(tile[0] / 2);
    let z = Math.round(tile[1] / 2);
    let tileKey = `${x}-${z}`;
    return tileKey;
}

function getTilePosition(
    event: MouseEvent,
    state: GameState,
    raycaster: THREE.Raycaster,
): THREE.Vector3 | undefined {
    let mouse = getMouseVec(event, state);

    // update raycaster
    raycaster.setFromCamera(mouse, state.camera);

    // get intersects
    const intersects = raycaster.intersectObjects(state.scene.children);

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
    let x =
        ((event.clientX - state.canvasRect.left) / window.innerWidth) * 2 - 1;
    let y =
        ((-event.clientY + state.canvasRect.top) / window.innerHeight) * 2 + 1;

    return new THREE.Vector2(x, y);
}
