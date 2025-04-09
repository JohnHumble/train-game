import * as THREE from "three";
import { deepcopy } from "../utilities";
import { PathNode } from "../track/trackPath";

export interface Train {
    trucks: Truck[];
    parentInd: number;
}

// export class Train {
//     x: number;
//     y: number;
//     z: number;

//     constructor(height: number, trackPath: PathNode) {}
// }

export function makeTrain(
    pathNode: [number, number][],
    scene: THREE.Scene,
): Train {
    let x = pathNode[0][0];
    let y = 1.3;
    let z = pathNode[0][1];

    let pos = new THREE.Vector3(x, y, z);

    let parent = makeTruck(pathNode, scene, pos, 5);

    parent.spacing = 4.8;
    pos.x -= parent.spacing;

    let child = makeTruck(pathNode, scene, pos);

    // set relationships
    parent.child = child;
    child.parent = parent;

    child.spacing = 2.7;
    pos.x -= child.spacing;
    let child2 = makeTruck(pathNode, scene, pos);

    child.child = child2;
    child2.parent = child;

    child2.spacing = 4.0;
    pos.x -= child2.spacing;
    let child3 = makeTruck(pathNode, scene, pos);

    child2.child = child3;
    child3.parent = child2;

    return {
        trucks: [parent, child, child2, child3],
        parentInd: 0,
    };
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

function makeTruck(
    nodePath: [number, number][],
    scene: THREE.Scene,
    position: THREE.Vector3,
    velocity: number | undefined = undefined,
): Truck {
    let truck: Truck = {
        obj: new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial(),
        ),
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
