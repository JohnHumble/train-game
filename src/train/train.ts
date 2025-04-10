import * as THREE from "three";
import { deepcopy } from "../utilities";
import { PathNode } from "../track/trackPath";
import { notDeepEqual } from "assert";
import { modelsType } from "../loader";

export interface Train {
    trucks: Truck[];
    wagons: Wagon[];
    parentInd: number;
}

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

// export class Train {
//     x: number;
//     y: number;
//     z: number;

//     constructor(height: number, trackPath: PathNode) {}
// }

export function makeTrain(
    pathNode: [number, number][],
    models: modelsType,
    scene: THREE.Scene,
): Train {
    let x = pathNode[0][0];
    let y = 0.9;
    let z = pathNode[0][1];

    let pos = new THREE.Vector3(x, y, z);

    let [engine, [parent, child]] = makeWagon(
        pathNode,
        scene,
        pos,
        4.8,
        [models["loco-front-truck"], models["loco-back-truck"]],
        models["locomotive_1"],
        5,
    );

    child.spacing = 2.7;
    pos.x -= child.spacing;

    let [car1, [child2, child3]] = makeWagon(
        pathNode,
        scene,
        pos,
        4.0,
        [models["boxcar-front-truck"], models["boxcar-back-truck"]],
        models["boxcar"],
    );

    // let child2 = makeTruck(pathNode, scene, pos);

    child.child = child2;
    child2.parent = child;

    // child2.spacing = 4.0;
    // pos.x -= child2.spacing;
    // let child3 = makeTruck(pathNode, scene, pos);

    // child2.child = child3;
    // child3.parent = child2;

    return {
        trucks: [parent, child, child2, child3],
        wagons: [engine, car1],
        parentInd: 0,
    };
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
