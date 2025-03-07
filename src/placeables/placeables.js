import * as THREE from "three";
import { trackPlaceableFactory } from "./track.js";
import { models } from "../loader.js";
import { deepcopy } from "../utilities.js";

// need to keep track of current placeable object

export function initializePlaceables(engine) {
    engine.addInitRule((state) => {
        let placeables = trackPlaceableFactory(models, state.scene);

        let currentPlaceable = "strait";
        let erase = false;
        // state.currentPlaceable = "curve-4";
        // let dummyPlaceableObject = undefined;

        // add placeable mouse click event
        const raycaster = new THREE.Raycaster();

        let placementRotation = 0;
        let placementPosition = new THREE.Vector3();

        let pastObj = undefined;

        // Game world grid
        // x-y: object
        state.grid = new Map();

        function isAvailable(tiles) {
            let available = true;
            tiles.forEach((tile) => {
                let tileKey = getGridKey(tile);
                available = available && state.grid.get(tileKey) == undefined;
            });
            return available;
        }

        function updateDummyPosColor() {
            let dummyObj = placeables[currentPlaceable].dummyObj;
            // (dummyObj.visible = true),
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

        function onMouseMove(event) {
            let position = getTilePosition(event, state, raycaster);
            if (position) {
                if (pastObj !== undefined) {
                    pastObj.setOpaque();
                }
                if (erase) {
                    let key = getGridKey([position.x, position.z]);
                    let obj = state.grid.get(key);
                    if (obj !== undefined) {
                        obj.setTransparent();
                        pastObj = obj;
                    }
                } else {
                    placementPosition = position;
                    updateDummyPosColor();
                }
            } else {
                placeables[currentPlaceable].dummyObj.visible = false;
            }
        }

        function onMouseClick(event) {
            let position = getTilePosition(event, state, raycaster);

            if (position) {
                if (erase) {
                    let key = getGridKey([position.x, position.z]);
                    let obj = state.grid.get(key);
                    if (obj !== undefined) {
                        state.scene.remove(obj.mesh);
                        obj.tiles.forEach((tile) => {
                            let tileKey = getGridKey(tile);
                            console.log("removing at: " + tileKey);
                            state.grid.delete(tileKey);
                        });
                    }
                } else {
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
                            state.scene.add(placeable.mesh);

                            placeable.tiles.forEach((tile) => {
                                let tileKey = getGridKey(tile);
                                console.log("placing at: " + tileKey);
                                state.grid.set(tileKey, placeable);
                            });

                            if (placeable.paths !== undefined) {
                                if (state.train == undefined) {
                                    state.train = makeTrain(
                                        placeable.paths[0],
                                        state.scene,
                                    );
                                }
                            }
                        }
                    } else {
                        state.scene.add(placeable.mesh);
                    }
                }
            }
        }

        // TODO move these to a more generic event handler system
        window.addEventListener("click", onMouseClick);
        window.addEventListener("mousemove", onMouseMove);

        // TODO move this to seperate function
        window.addEventListener("keypress", (event) => {
            // console.log("key pressed: ", event.key);
            if (event.key == "r" || event.key == "R") {
                placementRotation += Math.PI / 2;
                if (placementRotation >= Math.PI * 2) {
                    placementRotation = 0;
                }
                updateDummyPosColor();
            }

            if (event.key == "n" || event.key == "N") {
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
                placeables[currentPlaceable].dummyObj.visible = false;
                currentPlaceable = keys[ind];
                updateDummyPosColor();

                placeables[currentPlaceable].dummyObj.visible = !erase;
                // console.log(currentPlaceable);
            }

            if (event.key == "e") {
                erase = !erase;
                if (erase) {
                    console.log("erase mode");
                    placeables[currentPlaceable].dummyObj.visible = false;
                } else {
                    console.log("place mode");
                    placeables[currentPlaceable].dummyObj.visible = true;
                }
            }
        });
    });
}

export function getGridKey(tile) {
    let x = Math.round(tile[0] / 2);
    let z = Math.round(tile[1] / 2);
    let tileKey = `${x}-${z}`;
    return tileKey;
}

function getTilePosition(event, state, raycaster) {
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

function getGroundIntersect(intersects) {
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name == "ground-plane") {
            return intersects[i];
        }
    }
    return undefined;
}

function getMouseVec(event, state) {
    let x =
        ((event.clientX - state.canvasRect.left) / window.innerWidth) * 2 - 1;
    let y =
        ((-event.clientY + state.canvasRect.top) / window.innerHeight) * 2 + 1;

    return new THREE.Vector2(x, y);
}

function makeTrain(nodePath, scene) {
    let x = nodePath[0][0];
    let y = 1.3;
    let z = nodePath[0][1];

    let pos = new THREE.Vector3(x, y, z);

    let parent = makeTruck(nodePath, scene, pos, 5);

    parent.spacing = 4.8;
    pos.x -= parent.spacing;

    let child = makeTruck(nodePath, scene, pos);

    // set relationships
    parent.child = child;
    child.parent = parent;

    child.spacing = 2.7;
    pos.x -= child.spacing;
    let child2 = makeTruck(nodePath, scene, pos);

    child.child = child2;
    child2.parent = child;

    child2.spacing = 4.0;
    pos.x -= child2.spacing;
    let child3 = makeTruck(nodePath, scene, pos);

    child2.child = child3;
    child3.parent = child2;

    return {
        trucks: [parent, child, child2, child3],
        parentInd: 0,
        // TODO make cars
    };
}

function makeTruck(nodePath, scene, position, velocity = undefined) {
    let truck = {
        obj: new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial(),
        ),
        // targetNode: undefined,
        // sourceNode: undefined,
        // pathIndex: undefined,
        path: deepcopy(nodePath),
        ind: 1,
        // velocity: 5,
    };

    if (velocity != undefined) {
        truck.velocity = velocity;
    }

    truck.obj.position.x = position.x;
    truck.obj.position.y = position.y;
    truck.obj.position.z = position.z;

    scene.add(truck.obj);

    return truck;
}
