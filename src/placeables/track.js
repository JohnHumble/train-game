export function trackPlaceableFactory(models, scene) {
    let makeModelFactory = (name, offset, tiles, nodes) => {
        let dummyObj = models[name].clone();
        dummyObj.visible = false;
        dummyObj.material = dummyObj.material.clone();

        let material = dummyObj.material;
        let transparent = dummyObj.material.clone();

        transparent.transparent = true;
        transparent.opacity = 0.5;

        // dummyObj.material.transparent = true;
        // dummyObj.material.opacity = 0.5;

        scene.add(dummyObj);

        let adjPos = (pos, x, y, z) => {
            pos.x = x + offset;
            pos.y = y;
            pos.z = z + offset;
        };

        let adjPoints = (x, z, rot, points) => {
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

        let adjTiles = (x, z, rot) => {
            return adjPoints(x, z, rot, tiles);
        };

        // deep copy tiles.
        let dummyTiles = adjTiles(0, 0, 0);

        let updateDummyPos = (x, y, z, rot) => {
            adjPos(dummyObj.position, x, y, z);
            dummyObj.rotation.y = rot;
            dummyTiles = adjTiles(x, z, rot);
        };

        let getDummyTiles = () => {
            return dummyTiles;
        };

        // let dummyVisible = (visible) => {
        //     dummyObj.visible = visible;
        // };
        // let dummyPlace

        let makeNew = (x, y, z, rot) => {
            let straitModel = models[name].clone();
            adjPos(straitModel.position, x, y, z);
            straitModel.rotation.y = rot;

            let worldTiles = adjTiles(x, z, rot);
            console.log("------");

            let model = straitModel.clone();

            // adjust nodes
            if (nodes !== undefined) {
                var newNodes = nodes.map((nodePath) => {
                    return adjPoints(x, z, rot, nodePath);
                    // return nodePath.map((node) => {
                    //     return [node[0] * 2 + x, node[1] * 2 + z];
                    // });
                });
            }

            // Path List of List of points
            // all possible paths through object.

            return {
                mesh: model,
                // TODO add items
                tiles: worldTiles,
                setTransparent: () => {
                    model.material = transparent;
                },
                setOpaque: () => {
                    model.material = material;
                },
                paths: newNodes,
                action: undefined,
            };
        };

        // interface
        // makeNew()
        // updateDummyPos(x,y,z)
        // showDummy()

        return {
            make: makeNew,
            updateDummyPos: updateDummyPos,
            // dummyVisible: dummyVisible,
            dummyObj: dummyObj,
            getDummyTiles: getDummyTiles,
            dummyTransparent: () => {
                dummyObj.material = transparent;
            },
            dummyOpaque: () => {
                dummyObj.material = material;
            },
        };
    };

    let buildPlaceables = (params) => {
        let placeables = {};

        params.forEach((param) => {
            placeables[param.name] = makeModelFactory(
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
            name: "strait",
            tiles: [[0, 0]],
            paths: [
                [
                    [0, -0.5],
                    [0, 0.5],
                ],
            ],
        },
        {
            name: "cross",
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
            name: "curve-4",
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
            name: "curve-6",
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
            name: "curve-8",
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
            name: "curve-12",
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
            name: "curve-16",
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
    ]);
}

function makeCurvePath(radius, steps) {
    let adjRadius = radius - 0.5;
    // radius = 0;
    let angle = Math.PI / 2;
    let stepSize = angle / steps;

    let nodes = [];
    let origin = radius / 2;

    let theta = Math.PI;
    let end = theta + angle;

    let addNode = (theta) => {
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

    let isBad = (n) => {
        let adjN = n * 2;
        return Math.abs(Math.round(adjN) - adjN) > thresh;
    };

    if (isBad(lastX) || isBad(lastZ)) {
        addNode(theta);
    }

    return nodes;
}
