import * as THREE from "three";
import { Truck } from "./truck";
import { GameState } from "../engine/gameState";
import { dirTo } from "../utilities";

export class Wagon {
    obj: THREE.Mesh;
    trucks: Truck[];

    inState: true;
    typeName: "train-wagon";

    constructor(obj: THREE.Mesh, trucks: Truck[], scene: THREE.Scene) {
        this.obj = obj;
        this.trucks = trucks;

        this.obj.position.y = 1.3;
        scene.add(this.obj);
    }

    public update(state: GameState, deltaSeconds: number) {
        let totalX = 0;
        // let totalY = 0;
        let totalZ = 0;
        this.trucks.forEach((truck) => {
            totalX += truck.obj.position.x;
            // totalY += truck.obj.position.y;
            totalZ += truck.obj.position.z;
        });

        let x = totalX / this.trucks.length;
        // let y = totalY / wagon.trucks.length;
        let z = totalZ / this.trucks.length;

        this.obj.position.x = x;
        // wagon.obj.position.y = y;
        this.obj.position.z = z;

        let firstTruckPos = this.trucks[0].obj.position;
        let lastTruckPos = this.trucks[this.trucks.length - 1].obj.position;

        let [_vec, rotation, _mag] = dirTo(
            [firstTruckPos.x, firstTruckPos.z],
            [lastTruckPos.x, lastTruckPos.z],
        );
        this.obj.rotation.y = rotation;
    }
}
