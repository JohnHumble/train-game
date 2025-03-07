import { getGridKey } from "./placeables/placeables.js";
import { deepcopy } from "./utilities.js";

export function initializeTrainSystem(engine) {
    // Train update function.
    engine.addUpdateRule((state, deltaSeconds) => {
        let fullTrain = state.train;
        let grid = state.grid;

        if (fullTrain == undefined) {
            return;
        }

        // let train = fullTrain.trucks[fullTrain.parentInd];

        // let track = getGridObj(grid, [
        //     train.obj.position.x,
        //     train.obj.position.z,
        // ]);

        let getPath = (point, target) => {
            let trackObj = getGridObj(grid, point);
            if (trackObj == undefined) {
                return undefined;
            }

            // get closest path
            const thresh = 0.5;
            for (let i = 0; i < trackObj.paths.length; i++) {
                let path = deepcopy(trackObj.paths[i]);

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

        let getNextNodeInvers = (train, parentPos) => {
            let trainPos = [train.obj.position.x, train.obj.position.z];

            let nextNode = train.path[train.ind];

            let trainNodeDistance = distanceSquared(nextNode, trainPos);

            if (
                isBetween(nextNode, trainPos, parentPos) &&
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
            let [checkPos, _] = getDestination(trainPos, parentPos, -2.0);

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

        let getNextNode = (train, parentPos) => {
            let trainPos = [train.obj.position.x, train.obj.position.z];

            let nextNode = train.path[train.ind];

            let trainNodeDistance = distanceSquared(nextNode, trainPos);

            if (
                isBetween(trainPos, nextNode, parentPos) &&
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
            let [checkPos, _] = getDestination(trainPos, parentPos, 2.0);

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

        let updateChildPosition = (train, distance, parentPos) => {
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

            let [[destX, destZ], magnitude] = getDestination(
                [trainX, trainZ],
                nextNode,
                offset,
            );

            // overshot
            if (offset > magnitude) {
                // if (false) {
                train.obj.position.x = nextNode[0];
                train.obj.position.z = nextNode[1];

                // increment the node index
                train.ind++;

                // if index goes outside of path, get the next path.
                if (train.ind >= train.path.length) {
                    let [next, _] = getDestination(nextNode, parentPos, 1.0);
                    let nextPath = getPath(next, nextNode);

                    if (nextPath == undefined) {
                        train.ind--;
                        return;
                    }

                    train.path = nextPath;
                    train.ind = 1;
                }

                // distance = distance - magnitude;
                updateChildPosition(train, distance, parentPos);
            } else {
                train.obj.position.x = destX;
                train.obj.position.z = destZ;

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
                    updateChildPosition(train.child, train.spacing, [
                        destX,
                        destZ,
                    ]);
                }
            }
            // get node that is between p

            // let childDistance = getDistance(parentPos, [trainX, trainZ]);

            // let childOffset = childDistance - distance;
        };

        let updateDrivePosition = (distance, train) => {
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

            let sourceNode = [train.obj.position.x, train.obj.position.z];
            let targetNode = train.path[train.ind];

            let [[destX, destZ], magnitude] = getDestination(
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
                    updateChildPosition(train.child, train.spacing, [
                        destX,
                        destZ,
                    ]);
                }
            }
        };

        let ptrain = fullTrain.trucks[fullTrain.parentInd];
        let distance = ptrain.velocity * deltaSeconds;
        updateDrivePosition(distance, ptrain);
    });
}

function dirTo(sourceNode, targetNode) {
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

    return [[dirX, dirZ], magnitude];
}

function getDestination(sourceNode, targetNode, distance) {
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

    let [[dirX, dirZ], magnitude] = dirTo(sourceNode, targetNode);

    let destX = dirX * distance + sourceX;
    let destZ = dirZ * distance + sourceZ;

    return [[destX, destZ], magnitude];
}

function isBetween(a, b, c) {
    let ab = distanceSquared(a, b);
    let bc = distanceSquared(b, c);
    let ac = distanceSquared(a, c);
    return ab <= ac && bc <= ac;
}

function getDistance(a, b) {
    return Math.sqrt(distanceSquared(a, b));
}

function distanceSquared(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    return x * x + y * y;
}

function getGridObj(grid, gridIndex) {
    let key = getGridKey(gridIndex);
    return grid.get(key);
}
