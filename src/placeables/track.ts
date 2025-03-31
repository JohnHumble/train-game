import * as THREE from "three";
import { modelsType as ModelsType } from "../loader";
import { Placeable, PlaceableObject } from "./placeables";

interface Parameters {
    name: string[];
    offset?: number | undefined;
    tiles?: number[][] | undefined;
    paths: number[][][];
}

export function trackPlaceableFactory(
    models: ModelsType,
    scene: THREE.Scene,
): { [key: string]: Placeable } {
    let makeModelFactory = (
        names: string[],
        offset: number,
        tiles: number[][],
        nodes: number[][][],
    ): Placeable => {
        // set up dummy object
        let dummyObj: THREE.Mesh = models[names[0]].clone();
        dummyObj.visible = false;
        if (Array.isArray(dummyObj.material)) {
            dummyObj.material = dummyObj.material[0];
        }
        dummyObj.material = dummyObj.material.clone();

        let materials = names.map((name) => {
            let obj = models[name];
            return obj.material;
        });
        let transparents = materials.map((material) => {
            let transparent = material.clone();
            transparent.transparent = true;
            transparent.opacity = 0.5;
            return transparent;
        });

        scene.add(dummyObj);

        // adjust tiles
        let adjPos = (pos: THREE.Vector3, x: number, y: number, z: number) => {
            pos.x = x + offset;
            pos.y = y;
            pos.z = z + offset;
        };

        let adjPoints = (
            x: number,
            z: number,
            rot: number,
            points: number[][],
        ) => {
            let cosTheta = Math.cos(-rot);
            let sinTheta = Math.sin(-rot);

            // adjust tiles
            let adjPoints = points.map((point) => {
                // NOTE remove *2 if we have the scale of everything
                let pointOff = offset / 2;
                let rootX = point[0] - pointOff;
                let rootZ = point[1] - pointOff;

                let pointX = rootX * cosTheta - rootZ * sinTheta + pointOff;
                let pointZ = rootZ * cosTheta + rootX * sinTheta + pointOff;

                return [pointX * 2 + x, pointZ * 2 + z];
            });

            return adjPoints;
        };

        let adjTiles = (x: number, z: number, rot: number) => {
            return adjPoints(x, z, rot, tiles);
        };

        let dummyTiles = adjTiles(0, 0, 0);

        let updateDummyPos = (x: number, y: number, z: number, rot: number) => {
            adjPos(dummyObj.position, x, y, z);
            dummyObj.rotation.y = rot;
            dummyTiles = adjTiles(x, z, rot);
        };

        let getDummyTiles = () => {
            return dummyTiles;
        };

        let makeNew = (
            x: number,
            y: number,
            z: number,
            rot: number,
        ): PlaceableObject => {
            let ind = 0;
            let newModels = names.map((name) => {
                let model = models[name].clone();
                model.visible = false;
                adjPos(model.position, x, y, z);
                model.rotation.y = rot;
                return model;
            });

            newModels[ind].visible = true;

            let worldTiles = adjTiles(x, z, rot);

            // adjust nodes
            if (nodes !== undefined) {
                var newNodes = nodes.map((nodePath) => {
                    return adjPoints(x, z, rot, nodePath);
                });
            }

            let action = undefined;
            if (names.length > 1) {
                action = () => {
                    newModels[ind].visible = false;

                    ind++;
                    if (ind >= names.length) {
                        ind = 0;
                    }
                    newModels[ind].visible = true;

                    let nextNodes = [];
                    for (let i = 0; i < newNodes.length; i++) {
                        let ind = i + 1;
                        if (ind >= newNodes.length) {
                            ind -= newNodes.length;
                        }
                        nextNodes.push(newNodes[ind]);
                    }
                    newNodes = nextNodes;
                };
            }

            return {
                getModels: () => newModels,
                tiles: worldTiles,
                setTransparent: () => {
                    newModels[ind].material = transparents[ind];
                },
                setOpaque: () => {
                    newModels[ind].material = materials[ind];
                },
                getPaths: () => newNodes,
                action: action,
            };
        };

        return {
            make: makeNew,
            updateDummyPos: updateDummyPos,
            // dummyVisible: dummyVisible,
            getDummyObj: () => {
                return dummyObj;
            },
            getDummyTiles: getDummyTiles,
            dummyTransparent: () => {
                dummyObj.material = transparents[0];
            },
            dummyOpaque: () => {
                dummyObj.material = materials[0];
            },
        };
    };

    let buildPlaceables = (
        params: Parameters[],
    ): { [key: string]: Placeable } => {
        let placeables: { [key: string]: Placeable } = {};

        params.forEach((param: Parameters) => {
            placeables[param.name[0]] = makeModelFactory(
                param.name,
                param.offset ?? 0,
                param.tiles ?? [],
                param.paths,
            );
        });

        return placeables;
    };

    // Still need the following from the moodels
    // left switch
    // right switch
    // boxcar
    // locomotive

    return buildPlaceables([
        {
            name: ["strait"],
            tiles: [[0, 0]],
            paths: [
                [
                    [0, -0.5],
                    [0, 0.5],
                ],
            ],
        },
        {
            name: ["cross"],
            tiles: [[0, 0]],
            paths: [
                [
                    [0, -0.5],
                    [0, 0.5],
                ],
                [
                    [-0.5, 0],
                    [0.5, 0],
                ],
            ],
        },
        {
            name: ["curve-4"],
            offset: 1.0,
            tiles: [
                [-1, -1],
                [0, -1],
                [-1, 0],
                [0, 0],
                [-1, 1],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [1, 2],
                [2, 2],
            ],
            paths: [makeCurvePath(4, 8)],
        },
        {
            name: ["curve-6"],
            offset: 1.0,
            tiles: [
                [-2, -2],
                [-1, -2],
                [-2, -1],
                [-1, -1],
                [-2, 0],
                [-1, 0],
                [-2, 1],
                [-1, 1],
                [0, 0],
                [0, 1],
                [-1, 2],
                [0, 2],
                [1, 1],
                [1, 2],
                [0, 3],
                [1, 3],
                [2, 2],
                [3, 2],
                [2, 3],
                [3, 3],
            ],
            paths: [makeCurvePath(6, 10)],
        },
        {
            name: ["curve-8"],
            offset: 1.0,
            tiles: [
                // -3 -> 4
                [-3, -3],
                [-2, -3],
                [-3, -2],
                [-2, -2],
                // --
                [-3, -1],
                [-2, -1],
                [-3, 0],
                [-2, 0],
                // --
                [-1, 0],
                [0, 1],
                [1, 2],
                // --
                [-2, 1],
                [-1, 1],
                [-2, 2],
                [-1, 2],
                // --
                [0, 2],
                [-1, 3],
                [0, 3],
                // -
                [1, 3],
                [1, 4],
                [2, 3],
                [2, 4],
                // -
                [3, 3],
                [3, 4],
                [4, 3],
                [4, 4],
            ],
            paths: [makeCurvePath(8, 12)],
        },
        {
            name: ["curve-12"],
            offset: 1.0,
            tiles: [
                // -5 -> 6
                [-5, -5],
                [-4, -5],
                [-5, -4],
                [-4, -4],
                [-5, -3],
                [-4, -3],
                [-5, -2],
                [-4, -2],
                [-5, -1],
                [-4, -1],
                [-3, -1],
                // --
                [-4, 0],
                [-3, 0],
                [-4, 1],
                [-3, 1],
                [-2, 1],
                // --
                [-3, 2],
                [-2, 2],
                [-1, 2],
                [-2, 3],
                [-1, 3],
                [0, 3],
                [-2, 3],
                [-1, 3],
                [-1, 2],
                // --
                [6, 6],
                [6, 5],
                [5, 6],
                [5, 5],
                [4, 6],
                [4, 5],
                [3, 6],
                [3, 5],
                [2, 6],
                [2, 5],
                [2, 4],
                // --
                [1, 5],
                [1, 4],
                [0, 5],
                [0, 4],
                [-1, 4],
            ],
            paths: [makeCurvePath(12, 16)],
        },
        {
            name: ["curve-16"],
            offset: 1.0,
            tiles: [
                // -7 -> 8
                [-7, -7],
                [-6, -7],
                [-7, -6],
                [-6, -6],
                [-7, -5],
                [-6, -5],
                [-7, -4],
                [-6, -4],
                [-7, -3],
                [-6, -3],
                [-7, -2],
                [-6, -2],
                [-5, -2],
                // --
                [-6, -1],
                [-5, -1],
                [-6, 0],
                [-5, 0],
                [-4, 0],
                // --
                [-5, 1],
                [-4, 1],
                [-5, 2],
                [-4, 2],
                [-3, 2],
                // --
                [-4, 3],
                [-3, 3],
                [-2, 3],
                [-3, 4],
                [-2, 4],
                [-2, 5],
                // --
                [8, 8],
                [8, 7],
                [7, 8],
                [7, 7],
                [6, 8],
                [6, 7],
                [5, 8],
                [5, 7],
                [4, 8],
                [4, 7],
                [3, 8],
                [3, 7],
                [3, 6],
                // --
                [2, 7],
                [2, 6],
                [1, 7],
                [1, 6],
                [1, 5],
                // --
                [0, 6],
                [0, 5],
                [-1, 6],
                [-1, 5],
                [-1, 4],
            ],
            paths: [makeCurvePath(16, 24)],
        },
        {
            name: ["left_switch_strait", "left_switch_curve"],
            offset: 1.0,
            tiles: [
                [-1, -1],
                [0, -1],
                [-1, 0],
                [0, 0],
                [-1, 1],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [1, 2],
                [2, 2],
            ],
            paths: [
                [
                    [-1, -1.5],
                    [-1, 1.5],
                ],

                makeCurvePath(4, 8),
            ],
        },
        {
            name: ["right_switch_strait", "right_switch_curve"],
            offset: 1.0,
            tiles: [
                [-1, 2],
                [0, 2],
                [1, 2],
                // --
                [-1, 1],
                [0, 1],
                [1, 1],
                [2, 1],
                // --
                [1, 0],
                [2, 0],
                // --
                [1, -1],
                [2, -1],
            ],
            paths: [
                [
                    [2, -1.5],
                    [2, 1.5],
                ],

                makeCurvePath(4, 8, (Math.PI * 3) / 2).map((point) => {
                    return [point[0] - 4, point[1]];
                }),
            ],
        },
    ]);
}

function makeCurvePath(
    radius: number,
    steps: number,
    start = Math.PI,
): number[][] {
    let adjRadius = radius - 0.5;
    // radius = 0;
    let angle = Math.PI / 2;
    let stepSize = angle / steps;

    let nodes: number[][] = [];
    let origin = radius / 2;

    let theta = start;
    let end = theta + angle;

    let addNode = (theta: number) => {
        let x = adjRadius * Math.cos(theta) + origin + 0.5;
        let z = -adjRadius * Math.sin(theta) - origin + 0.5;

        nodes.push([x, z]);
    };

    while (theta < end) {
        addNode(theta);
        theta += stepSize;
    }
    // do one last iteration to make the end node
    const thresh = 0.001;
    let lastNode = nodes[nodes.length - 1];
    let lastX = lastNode[0];
    let lastZ = lastNode[1];

    let isBad = (n: number) => {
        let adjN = n * 2;
        return Math.abs(Math.round(adjN) - adjN) > thresh;
    };

    if (isBad(lastX) || isBad(lastZ)) {
        addNode(theta);
    }

    return nodes;
}
