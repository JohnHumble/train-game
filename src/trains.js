import { getGridKey } from "./placeables/placeables.js";

export function initializeTrainSystem(engine) {
    // Train update function.
    engine.addUpdateRule((state, deltaSeconds) => {
        let train = state.train;
        let grid = state.grid;

        // let track = getGridObj(grid, [
        //     train.obj.position.x,
        //     train.obj.position.z,
        // ]);

        let updatePosition = (distance) => {
            // let trackObj = getGridObj(grid, [
            //     train.obj.position.x,
            //     train.obj.position.z,
            // ]);

            if (train.path == undefined || train.ind == undefined) {
                return;
            }

            let sourceNode = [train.obj.position.x, train.obj.position.z];
            let targetNode = train.path[train.ind];

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

            let destX = dirX * distance + sourceX;
            let destZ = dirZ * distance + sourceZ;

            // check if overshot
            // let destMagnitudeSquared = destX * destX + destZ * destZ;
            if (distance >= magnitude) {
                train.obj.position.x = targetX;
                train.obj.position.z = targetZ;

                // increment the node index
                train.ind++;

                // if index goes outside of path, get the next path.
                if (train.ind >= train.path.length) {
                    let trackObj = getGridObj(grid, [destX, destZ]);
                    if (trackObj == undefined || trackObj.paths == undefined) {
                        // train.velocity = 0;
                        // train.path = undefined;
                        // train.ind = undefined;
                        train.path = train.path.reverse();
                        train.ind = 1;
                        return;
                    }

                    // get closest path
                    const thresh = 0.5;
                    let unset = true;
                    for (let i = 0; i < trackObj.paths.length; i++) {
                        let path = trackObj.paths[i];

                        let distance = distanceSquared(
                            [targetX, targetZ],
                            path[0],
                        );
                        if (distance < thresh) {
                            train.path = path;
                            train.ind = 1;
                            unset = false;
                            break;
                        }

                        distance = distanceSquared(
                            [targetX, targetZ],
                            path[path.length - 1],
                        );
                        if (distance < thresh) {
                            train.path = path.reverse();
                            train.ind = 1;
                            unset = false;
                            break;
                        }
                    }

                    if (unset) {
                        // train.velocity = 0;
                        // train.path = undefined;
                        // train.ind = undefined;
                        train.path = train.path.reverse();
                        train.ind = 1;
                        return;
                    }
                }

                distance = distance - magnitude;
                updatePosition(distance);
            } else {
                train.obj.position.x = destX;
                train.obj.position.z = destZ;
            }
        };

        let distance = train.velocity * deltaSeconds;
        updatePosition(distance);
    });
}

function distanceSquared(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    return x * x + y * y;
}

function getGridObj(grid, gridIndex) {
    let key = getGridKey(gridIndex);
    return grid[key];
}
