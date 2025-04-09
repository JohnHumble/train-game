import { getDistance, lerp } from "../utilities";

export class PathNode {
    public x: number;
    public z: number;

    next?: PathNode;

    constructor(x: number, z: number, next?: PathNode) {
        this.x = x;
        this.z = z;
    }

    public getPositionFrom(distance: number): {
        x: number;
        y: number;
        distance: number;
        root: PathNode;
    } {
        if (this.next !== undefined) {
            // get the distance between this and next
            let length = getDistance(
                [this.x, this.z],
                [this.next.x, this.next.z],
            );
            if (length > distance) {
                return this.next.getPositionFrom(distance - length);
            }
            let [x, y] = lerp(
                [this.x, this.z],
                [this.next.x, this.next.z],
                distance,
            );
            return {
                x: x,
                y: y,
                distance: distance,
                root: this,
            };
        }
        return {
            x: this.x,
            y: this.z,
            distance: 0,
            root: this,
        };
    }
}
