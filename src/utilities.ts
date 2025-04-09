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
