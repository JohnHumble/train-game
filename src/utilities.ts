export function deepcopy<T>(obj: T): T {
    let objStr = JSON.stringify(obj);
    let outObj = JSON.parse(objStr);
    return outObj;
}

export function getDistance(a: [number, number], b: [number, number]): number {
    return Math.sqrt(distanceSquared(a, b));
}

export function distanceSquared(
    a: [number, number],
    b: [number, number],
): number {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    return x * x + y * y;
}

export function lerp(
    start: [number, number],
    end: [number, number],
    distance: number,
): [number, number] {
    let t = distance / getDistance(start, end);
    let distX = end[0] - start[0];
    let distY = end[1] - start[1];

    return [distX * t, distY * t];
}

export function dirTo(
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

export function getDestination(
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

export function isBetween(
    a: [number, number],
    b: [number, number],
    c: [number, number],
): boolean {
    let ab = distanceSquared(a, b);
    let bc = distanceSquared(b, c);
    let ac = distanceSquared(a, c);
    return ab <= ac && bc <= ac;
}

export function gettingCloser(
    source: [number, number],
    node: [number, number],
    target: [number, number],
): boolean {
    return isBetween(source, node, target) || isBetween(source, target, node);
}

export function gettingFarther(
    source: [number, number],
    node: [number, number],
    target: [number, number],
): boolean {
    return isBetween(node, source, target) || isBetween(node, target, source);
}

export function getNextPathNode(
    source: [number, number],
    check: [number, number],
    paths: [number, number][][],
): [number, number] | undefined {
    let thresh = 1e-2;
    // get closest node to source
    let index = [0, 0];
    let distance = Infinity;
    for (let i = 0; i < paths.length && distance > thresh; i++) {
        for (let j = 0; j < paths[i].length && distance > thresh; j++) {
            distance = distanceSquared(source, paths[i][j]);
            index = [i, j];
        }
    }

    // make sure the source node is in the path
    if (distance > 1e-6) {
        return undefined;
    }

    // get next node
    let sNode = paths[index[0]][index[1]];
    let pNode = undefined;
    let nNode = undefined;

    if (index[1] > 0) {
        pNode = paths[index[0]][index[1] - 1];
    }

    if (index[1] < paths[index[0]].length - 1) {
        nNode = paths[index[0]][index[1] + 1];
    }

    if (nNode !== undefined) {
        if (isBetween(sNode, check, nNode)) {
            return nNode;
        }
    }
    if (pNode !== undefined) {
        if (isBetween(sNode, check, pNode)) {
            return pNode;
        }
    }

    return undefined;
}
