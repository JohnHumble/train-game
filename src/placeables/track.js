export function trackPlaceableFactory(models, scene) {
    let makeModelFactory = (name, offset, tiles) => {
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

        let adjTiles = (x, z, rot) => {
            let cosTheta = Math.cos(-rot);
            let sinTheta = Math.sin(-rot);

            // adjust tiles
            let adjTiles = tiles.map((tile) => {
                // NOTE remove *2 if we have the scale of everything
                let tileOff = offset / 2;
                let rootX = tile[0] - tileOff;
                let rootZ = tile[1] - tileOff;

                let tileX = rootX * cosTheta - rootZ * sinTheta + tileOff;
                let tileZ = rootZ * cosTheta + rootX * sinTheta + tileOff;

                return [tileX * 2 + x, tileZ * 2 + z];
            });

            return adjTiles;
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
        { name: "strait", tiles: [[0, 0]] },
        { name: "cross", tiles: [[0, 0]] },
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
        },
    ]);
}
