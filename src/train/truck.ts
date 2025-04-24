import * as THREE from "three";
import { GameState } from "../engine/gameState";
import { GRID_ID, MapGrid } from "../placeables/mapGrid";
import {
    deepcopy,
    dirTo,
    distanceSquared,
    getDestination,
    getDistance,
    getNextPathNode,
} from "../utilities";

export class Truck {
    obj: THREE.Mesh;
    target: [number, number] | undefined;
    velocity: number;
    parent: Truck | undefined;
    child: Truck | undefined;
    spacing: number | undefined;

    inState = true;
    typeName = "train-truck";

    constructor(
        position: THREE.Vector3,
        truckModel: THREE.Mesh,
        scene: THREE.Scene,
        target: [number, number],
        velocity: number | undefined = undefined,
        parent: Truck | undefined = undefined,
        child: Truck | undefined = undefined,
        spacing: number | undefined = undefined,
    ) {
        this.obj = truckModel.clone();
        this.target = target;
        this.velocity = velocity;
        this.parent = parent;
        this.child = child;
        this.spacing = spacing;

        this.obj.position.x = position.x;
        this.obj.position.y = position.y;
        this.obj.position.z = position.z;

        scene.add(this.obj);
    }

    public update(state: GameState, deltaSeconds: number) {
        let max_depth = 10;

        let updatePosition = (distance: number, layer: number) => {
            if (layer > max_depth) {
                return;
            }

            // move truck toward target
            let sourceNode: [number, number] = [
                this.obj.position.x,
                this.obj.position.z,
            ];

            if (this.target === undefined) {
                if (this.parent !== undefined) {
                    this.target = deepcopy(this.parent.target);
                }
            }

            if (this.target === undefined) {
                // get next target.
                let grid: MapGrid = state.get(GRID_ID);

                // let trackObj = grid.getObj(targetNode);
                // get next node
                // TODO build this thing.

                let dirX = Math.cos(this.obj.rotation.y);
                let dirZ = -Math.sin(this.obj.rotation.y);

                let checkNode: [number, number] = [
                    sourceNode[0] + dirX,
                    sourceNode[1] + dirZ,
                ];
                let trackObj = grid.getObj(checkNode);

                if (trackObj !== undefined) {
                    // find closest next node
                    let target = getNextPathNode(
                        sourceNode,
                        checkNode,
                        trackObj.getPaths(),
                    );

                    // update target
                    this.target = target;
                }
                if (this.target === undefined) {
                    if (this.parent !== undefined) {
                        this.target = [
                            this.parent.obj.position.x,
                            this.parent.obj.position.z,
                        ];
                    } else {
                        return;
                    }
                }
            }

            // let distSqr = distanceSquared(sourceNode, this.target);
            // if (distSqr <= 0.0) {

            //     this.target
            // }
            if (this.target === undefined) {
                console.log("problem");
            }

            let targetNode = this.target;

            let [[destX, destZ], rotation, magnitude] = getDestination(
                sourceNode,
                targetNode,
                distance,
            );

            if (distance >= magnitude) {
                // get next tile
                // let [[dirX, dirY], _r, _m] = dirTo(sourceNode, targetNode);

                if (isNaN(targetNode[0]) || isNaN(targetNode[1])) {
                    return;
                }

                this.obj.position.x = targetNode[0];
                this.obj.position.z = targetNode[1];

                if (!isNaN(rotation)) {
                    this.obj.rotation.y = rotation;
                }

                // get next target.
                let grid: MapGrid = state.get(GRID_ID);

                // let trackObj = grid.getObj(targetNode);
                // get next node
                // TODO build this thing.

                let dirX = Math.cos(this.obj.rotation.y);
                let dirZ = -Math.sin(this.obj.rotation.y);

                let checkNode: [number, number] = [
                    targetNode[0] + dirX,
                    targetNode[1] + dirZ,
                ];
                let trackObj = grid.getObj(checkNode);

                if (trackObj !== undefined) {
                    // find closest next node
                    let target = getNextPathNode(
                        targetNode,
                        checkNode,
                        trackObj.getPaths(),
                    );

                    // update target
                    this.target = target;

                    updatePosition(distance, layer + 1);
                } else {
                    if (this.parent !== undefined) {
                        this.target = [
                            this.parent.obj.position.x,
                            this.parent.obj.position.z,
                        ];
                    } else {
                        return;
                    }
                }
            } else {
                if (isNaN(destX) || isNaN(destZ) || isNaN(rotation)) {
                    return;
                }
                this.obj.position.x = destX;
                this.obj.position.z = destZ;
                this.obj.rotation.y = rotation;
            }
        };

        if (this.parent === undefined) {
            let distance = this.velocity * deltaSeconds;
            updatePosition(distance, 0);
        } else {
            // move toward parent
            let distance = getDistance(
                [this.obj.position.x, this.obj.position.z],
                [this.parent.obj.position.x, this.parent.obj.position.z],
            );

            if (this.parent.spacing !== undefined) {
                distance -= this.parent.spacing;
            }

            if (distance > 0) {
                // TODO get velocity of parent
                let vel = 10;
                let maxVel = vel * deltaSeconds * 2;
                if (distance > maxVel * 3) {
                    this.target = deepcopy(this.parent.target);
                }
                distance = Math.min(distance, maxVel);
                updatePosition(distance, 0);
            } else {
                // console.log("errors");
            }
        }
    }
}
