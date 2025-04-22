import * as THREE from "three";
import { modelsType } from "../loader";
import { GameState } from "../engine/gameState";
import { GRID_ID } from "../placeables/mapGrid";
import { deepcopy, distanceSquared, getDistance } from "../utilities";

export interface Truck {
    obj: THREE.Mesh;
    path: [number, number][];
    ind: number;
    velocity: number | undefined;
    parent: Truck | undefined;
    child: Truck | undefined;
    spacing: number | undefined;
}

export interface Wagon {
    obj: THREE.Mesh;
    trucks: Truck[]; // NOTE: this assumes symetrical truck placement. Will need to update later.
}

export class Train {
    trucks: Truck[];
    wagons: Wagon[];
    parentInd: number;

    inState = true;
    typeName = "train";

    constructor(
        pathNode: [number, number][],
        models: modelsType,
        scene: THREE.Scene,
        numberOfCars: number,
    ) {
        let x = pathNode[0][0];
        let y = 0.9;
        let z = pathNode[0][1];

        let pos = new THREE.Vector3(x, y, z);

        let velocity = 10;

        let [engine, [parent, child]] = makeWagon(
            pathNode,
            scene,
            pos,
            4.8,
            [models["loco-front-truck"], models["loco-back-truck"]],
            models["locomotive_1"],
            velocity,
        );

        let trucks = [parent, child];
        let wagons = [engine];

        let connector = child;

        for (let i = 0; i < numberOfCars; i++) {
            connector.spacing = 2.7;
            pos.x -= connector.spacing;

            let [car1, [child2, child3]] = makeWagon(
                pathNode,
                scene,
                pos,
                4.0,
                [models["boxcar-front-truck"], models["boxcar-back-truck"]],
                models["boxcar"],
            );

            connector.child = child2;
            child2.parent = connector;

            trucks.push(child2);
            trucks.push(child3);
            wagons.push(car1);

            connector = child3;
        }

        // let child2 = makeTruck(pathNode, scene, pos);

        this.trucks = trucks;
        this.wagons = wagons;
        this.parentInd = 0;
    }

    public update(state: GameState, deltaSeconds: number) {
        let grid = state.get(GRID_ID);

        let getPath = (point: [number, number], target: [number, number]) => {
            let trackObj = grid.getObj(point);
            if (trackObj == undefined) {
                return undefined;
            }

            // get closest path
            const thresh = 0.5;
            for (let i = 0; i < trackObj.getPaths().length; i++) {
                let path = deepcopy(trackObj.getPaths()[i]);

                let distance = distanceSquared(target, path[0]);
                if (distance < thresh) {
                    return path;
                }

                distance = distanceSquared(target, path[path.length - 1]);
                if (distance < thresh) {
                    return path.reverse();
                }
            }

            return undefined;
        };

        let getNextNodeInvers = (train: Truck, parentPos: [number, number]) => {
            let trainPos: [number, number] = [
                train.obj.position.x,
                train.obj.position.z,
            ];

            let nextNode = train.path[train.ind];

            let trainNodeDistance = distanceSquared(nextNode, trainPos);

            if (
                gettingFarther(trainPos, nextNode, parentPos) &&
                trainNodeDistance > 0
            ) {
                return nextNode;
            }

            let nodeDistance = distanceSquared(nextNode, parentPos);

            let nInd = train.ind + 1;
            if (nInd < train.path.length) {
                nextNode = train.path[nInd];
                let nDistance = distanceSquared(nextNode, parentPos);

                if (nDistance < nodeDistance) {
                    // need to reverse direction
                    train.path.reverse();
                    train.ind = train.path.length - train.ind - 1;
                    return getNextNodeInvers(train, parentPos);
                }
                train.ind = nInd;
                return getNextNodeInvers(train, parentPos);
            }

            // get next path
            let [checkPos, _1, _] = getDestination(trainPos, parentPos, -2.0);

            let newPath = getPath(checkPos, train.path[train.path.length - 1]);
            if (newPath != undefined) {
                train.path = newPath;
                train.ind = 1;
                return getNextNodeInvers(train, parentPos);
            }

            newPath = getPath(checkPos, train.path[0]);
            if (newPath != undefined) {
                train.path = newPath;
                train.ind = 1;
                return getNextNodeInvers(train, parentPos);
            }

            return undefined;
        };

        let getNextNode = (train: Truck, parentPos: [number, number]) => {
            let trainPos: [number, number] = [
                train.obj.position.x,
                train.obj.position.z,
            ];

            let nextNode = train.path[train.ind];

            let trainNodeDistance = distanceSquared(nextNode, trainPos);

            if (
                gettingCloser(trainPos, nextNode, parentPos) &&
                trainNodeDistance > 0
            ) {
                return nextNode;
            }

            let nodeDistance = distanceSquared(nextNode, parentPos);

            let nInd = train.ind + 1;
            if (nInd < train.path.length) {
                nextNode = train.path[nInd];
                let nDistance = distanceSquared(nextNode, parentPos);

                if (nDistance > nodeDistance) {
                    // need to reverse direction
                    train.path.reverse();
                    train.ind = train.path.length - train.ind - 1;
                    return getNextNode(train, parentPos);
                }
                train.ind = nInd;
                return getNextNode(train, parentPos);
            }

            // get next path
            let [checkPos, _1, _] = getDestination(trainPos, parentPos, 2.0);

            let newPath = getPath(checkPos, train.path[train.path.length - 1]);
            if (newPath != undefined) {
                train.path = newPath;
                train.ind = 1;
                return getNextNode(train, parentPos);
            }

            newPath = getPath(checkPos, train.path[0]);
            if (newPath != undefined) {
                train.path = newPath;
                train.ind = 1;
                return getNextNode(train, parentPos);
            }

            return undefined;
        };

        let updateChildPosition = (
            train: Truck,
            distance: number,
            parentPos: [number, number],
        ): void => {
            if (distance == undefined || parentPos == undefined) {
                return undefined;
            }

            if (train.path == undefined || train.ind == undefined) {
                console.log("could not get train path");
                return undefined;
            }

            let trainX = train.obj.position.x;
            let trainZ = train.obj.position.z;

            let offset = getDistance([trainX, trainZ], parentPos) - distance;

            let nextNode = undefined;
            if (offset <= 0) {
                // TODO figure out case for negative distance.
                // destination, train, parent
                offset = Math.abs(offset);
                nextNode = getNextNodeInvers(train, parentPos);
            } else {
                // get node between tarin and parent
                nextNode = getNextNode(train, parentPos);
            }

            if (nextNode == undefined) {
                return;
            }

            let [[destX, destZ], rotation, magnitude] = getDestination(
                [trainX, trainZ],
                nextNode,
                offset,
            );

            // overshot
            if (offset > magnitude) {
                // if (false) {
                train.obj.position.x = nextNode[0];
                train.obj.position.z = nextNode[1];
                train.obj.rotation.y = rotation;

                // increment the node index
                train.ind++;

                // if index goes outside of path, get the next path.
                if (train.ind >= train.path.length) {
                    let [next, _1, _] = getDestination(
                        nextNode,
                        parentPos,
                        1.0,
                    );
                    let nextPath = getPath(next, nextNode);

                    if (nextPath == undefined) {
                        train.ind--;
                        return;
                    }

                    train.path = nextPath;
                    train.ind = 1;
                }

                // distance = distance - magnitude;
                // updateChildPosition(train, distance, parentPos);
            } else {
                train.obj.position.x = destX;
                train.obj.position.z = destZ;
                train.obj.rotation.y = rotation;

                // TODO figure this out
                if (train.child !== undefined) {
                    // get distance to child and move that much
                    // let childDistance = getDistance(
                    //     [destX, destZ],
                    //     [
                    //         train.child.obj.position.x,
                    //         train.child.obj.position.z,
                    //     ],
                    // );
                    // let childOffset = childDistance - train.spacing;
                    updateChildPosition(train.child, train.spacing ?? 0, [
                        destX,
                        destZ,
                    ]);
                }
            }
            // get node that is between p

            // let childDistance = getDistance(parentPos, [trainX, trainZ]);

            // let childOffset = childDistance - distance;
        };

        let updateDrivePosition = (distance: number, train: Truck) => {
            // let trackObj = getGridObj(grid, [
            //     train.obj.position.x,
            //     train.obj.position.z,
            // ]);

            // if (
            //     train == undefined ||
            //     train.path == undefined ||
            //     train.ind == undefined
            // ) {
            //     return;
            // }

            if (distance < 0) {
                train.ind = train.path.length - train.ind;
                train.path.reverse();
                distance *= -1;
            }

            let sourceNode: [number, number] = [
                train.obj.position.x,
                train.obj.position.z,
            ];
            let targetNode = train.path[train.ind];

            let [[destX, destZ], rotation, magnitude] = getDestination(
                sourceNode,
                targetNode,
                distance,
            );
            // let destX = destination[0];
            // let destZ = destination[1];

            // check if overshot
            // let destMagnitudeSquared = destX * destX + destZ * destZ;
            if (distance >= magnitude) {
                train.obj.position.x = targetNode[0];
                train.obj.position.z = targetNode[1];
                train.obj.rotation.y = rotation;

                // increment the node index
                train.ind++;

                // if index goes outside of path, get the next path.
                if (train.ind >= train.path.length) {
                    let nextPath = getPath([destX, destZ], targetNode);

                    if (nextPath == undefined) {
                        // train.velocity = 0;
                        // train.path = undefined;
                        // train.ind = undefined;
                        train.path.reverse();
                        train.ind = 1;
                        return;
                    }

                    train.path = nextPath;
                    train.ind = 1;
                }

                distance = distance - magnitude;
                updateDrivePosition(distance, train);
            } else {
                train.obj.position.x = destX;
                train.obj.position.z = destZ;
                train.obj.rotation.y = rotation;

                // TODO figure this out
                if (train.child !== undefined) {
                    // get distance to child and move that much
                    // let childDistance = getDistance(
                    //     [destX, destZ],
                    //     [
                    //         train.child.obj.position.x,
                    //         train.child.obj.position.z,
                    //     ],
                    // );
                    // let childOffset = childDistance - train.spacing;
                    updateChildPosition(train.child, train.spacing ?? 0, [
                        destX,
                        destZ,
                    ]);
                }
            }
        };

        // update wagons
        let updateWagon = (wagon: Wagon) => {
            let totalX = 0;
            // let totalY = 0;
            let totalZ = 0;
            wagon.trucks.forEach((truck) => {
                totalX += truck.obj.position.x;
                // totalY += truck.obj.position.y;
                totalZ += truck.obj.position.z;
            });

            let x = totalX / wagon.trucks.length;
            // let y = totalY / wagon.trucks.length;
            let z = totalZ / wagon.trucks.length;

            wagon.obj.position.x = x;
            // wagon.obj.position.y = y;
            wagon.obj.position.z = z;

            let firstTruckPos = wagon.trucks[0].obj.position;
            let lastTruckPos =
                wagon.trucks[wagon.trucks.length - 1].obj.position;

            let [_vec, rotation, _mag] = dirTo(
                [firstTruckPos.x, firstTruckPos.z],
                [lastTruckPos.x, lastTruckPos.z],
            );
            wagon.obj.rotation.y = rotation;
        };

        let ptrain = this.trucks[this.parentInd];
        let velocity = ptrain.velocity ?? 0;
        let distance = velocity * deltaSeconds;
        updateDrivePosition(distance, ptrain);

        this.wagons.forEach(updateWagon);
    }
}

function makeWagon(
    nodePath: [number, number][],
    scene: THREE.Scene,
    position: THREE.Vector3,
    spaceing: number,
    truckModels: [THREE.Mesh, THREE.Mesh],
    wagonModel: THREE.Mesh,
    velocity: number | undefined = undefined,
): [Wagon, [Truck, Truck]] {
    let parent = makeTruck(nodePath, scene, position, truckModels[0], velocity);

    // parent.spacing = 4.8;
    parent.spacing = spaceing;
    position.x -= parent.spacing;

    let child = makeTruck(nodePath, scene, position, truckModels[1]);

    // set relationships
    parent.child = child;
    child.parent = parent;

    let wagon: Wagon = {
        obj: wagonModel.clone(),
        trucks: [parent, child],
    };

    wagon.obj.position.y = 1.3;

    scene.add(wagon.obj);

    return [wagon, [parent, child]];
}

function makeTruck(
    nodePath: [number, number][],
    scene: THREE.Scene,
    position: THREE.Vector3,
    truckModel: THREE.Mesh,
    velocity: number | undefined = undefined,
): Truck {
    let truck: Truck = {
        obj: truckModel.clone(),
        path: nodePath,
        ind: 1,
        velocity: undefined,
        parent: undefined,
        child: undefined,
        spacing: undefined,
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

function dirTo(
    sourceNode: number[],
    targetNode: number[],
): [number[], number, number] {
    // get source and destination
    let sourceX = sourceNode[0];
    let sourceZ = sourceNode[1];
    let targetX = targetNode[0];
    let targetZ = targetNode[1];

    let vecX = targetX - sourceX;
    let vecZ = targetZ - sourceZ;

    let magSquared = vecX * vecX + vecZ * vecZ;
    let magnitude = Math.sqrt(magSquared);

    let dirX = vecX / magnitude;
    let dirZ = vecZ / magnitude;

    let rotation = Math.atan2(-dirZ, dirX);

    return [[dirX, dirZ], rotation, magnitude];
}

function getDestination(
    sourceNode: [number, number],
    targetNode: [number, number],
    distance: number,
): [[number, number], number, number] {
    // // get source and destination
    let sourceX = sourceNode[0];
    let sourceZ = sourceNode[1];
    // let targetX = targetNode[0];
    // let targetZ = targetNode[1];

    // let vecX = targetX - sourceX;
    // let vecZ = targetZ - sourceZ;

    // let magSquared = vecX * vecX + vecZ * vecZ;
    // let magnitude = Math.sqrt(magSquared);

    // let dirX = vecX / magnitude;
    // let dirZ = vecZ / magnitude;

    let [[dirX, dirZ], rotation, magnitude] = dirTo(sourceNode, targetNode);

    let destX = dirX * distance + sourceX;
    let destZ = dirZ * distance + sourceZ;

    return [[destX, destZ], rotation, magnitude];
}

function isBetween(
    a: [number, number],
    b: [number, number],
    c: [number, number],
): boolean {
    let ab = distanceSquared(a, b);
    let bc = distanceSquared(b, c);
    let ac = distanceSquared(a, c);
    return ab <= ac && bc <= ac;
}

function gettingCloser(
    source: [number, number],
    node: [number, number],
    target: [number, number],
): boolean {
    return isBetween(source, node, target) || isBetween(source, target, node);
}

function gettingFarther(
    source: [number, number],
    node: [number, number],
    target: [number, number],
): boolean {
    return isBetween(node, source, target) || isBetween(node, target, source);
}
