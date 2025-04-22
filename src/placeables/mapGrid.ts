import { PlaceableObject } from "./placeables";

export const GRID_ID = "world-grid";

export class MapGrid {
    inState: boolean = true;
    id: string = GRID_ID;

    public map: Map<string, PlaceableObject>;

    constructor() {
        this.map = new Map();
    }

    public isAvailable(tiles: [number, number][]) {
        let available = true;
        tiles.forEach((tile) => {
            let tileKey = getGridKey(tile);
            available = available && this.map.get(tileKey) == undefined;
        });
        return available;
    }

    public getObj(point: [number, number]): PlaceableObject | undefined {
        let key = getGridKey(point);
        return this.map.get(key);
    }
}

export function getGridKey(tile: number[]): string {
    let x = Math.round(tile[0] / 2);
    let z = Math.round(tile[1] / 2);
    let tileKey = `${x}-${z}`;
    return tileKey;
}
