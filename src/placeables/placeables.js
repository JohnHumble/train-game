import { makeDummy } from "./dummy.js";
import * as THREE from "three";

// need to keep track of current placeable object

export function initializePlaceables(engine) {
    engine.addInitRule((state) => {
        state.placeables = {};

        // TODO extract this out;
        let makeStrait = (x, y, z) => {
            let straitModel = state.models.strait.clone();

            straitModel.position.x = x;
            straitModel.position.y = y;
            straitModel.position.z = z;

            return {
                mesh: straitModel,
            };
        };

        // dummy placeable for now
        // state.currentPlaceable = makeDummy;
        state.currentPlaceable = makeStrait;

        // add placeable mouse click event
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function onMouseClick(event) {
            console.log([event.clientX, event.clientY]);
            mouse.x =
                ((event.clientX - state.canvasRect.left) / window.innerWidth) *
                    2 -
                1;
            mouse.y =
                ((-event.clientY + state.canvasRect.top) / window.innerHeight) *
                    2 +
                1;
            // mouse.x = event.clientX - state.canvasRect.left;
            // mouse.y = event.clientY - state.canvasRect.top;
            console.log(mouse);

            // update raycaster
            raycaster.setFromCamera(mouse, state.camera);

            // get intersects
            const intersects = raycaster.intersectObjects(state.scene.children);

            // TODO check that intersects contains the ground plane
            if (intersects.length > 0) {
                // change color of material for now
                // intersects[0].object.material.color.set(0xff0000);
                let x = Math.round(intersects[0].point.x / 2) * 2;
                let z = Math.round(intersects[0].point.z / 2) * 2;

                // let x = intersects[0].point.x;
                // let z = intersects[0].point.z;
                let y = intersects[0].point.y;

                let placeable = state.currentPlaceable(x, y, z);
                state.scene.add(placeable.mesh);

                // TODO save any updateable items in the state

                console.log("placed obj");
            }
        }

        window.addEventListener("click", onMouseClick, false);
    });
}
