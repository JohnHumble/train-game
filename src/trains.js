// import { getGridKey } from "./placeables/placeables";

export function initializeTrainSystem(engine) {
    // Train update function.
    engine.addUpdateRule((state, deltaSeconds) => {
        let train = state.train;
        let grid = state.grid;

        // let track = getGridObj(grid, [
        //     train.obj.position.x,
        //     train.obj.position.z,
        // ]);

        if (train.pathIndex == undefined) {
            return;
        }

        let distance = train.velocity * deltaSeconds;
        let UpdatePosition = (distance) => {
            let trackObj = getGridObj(grid, [
                train.obj.position.x,
                train.obj.position.z,
            ]);

            let path = trackObj.paths[train.pathIndex[0]];
            let targetInd = train.pathIndex[1];

            let sourceNode =
                trackObj.paths[train.pathIndex[0]][train.pathIndex[1]];
            let targetNode =
                trackObj.paths[train.pathIndex[0]][train.pathIndex[1]];

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
            let dirZ = vecY / magnitude;

            let destX = dirX * distance + sourceX;
            let destZ = dirZ * distance + sourceZ;

            // check if overshot
            let destMagnitudeSquared = destX * destX + destZ * destZ;
            if (destMagnitudeSquared >= magSquared) {
                // set next train nodes

                distance = Math.sqrt(destMagnitudeSquared - magSquared);
                UpdatePosition(distance);
            }
        };
    });
}

function getGridObj(grid, gridIndex) {
    let key = getGridKey(gridIndex);
    return grid[key];
}
