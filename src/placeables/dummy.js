import * as THREE from "three";

const dummyMaterial = new THREE.MeshBasicMaterial({ color: "chartreuse" });
const dummyGeometry = new THREE.BoxGeometry();

// Placeable objects need a factory function.
export function makeDummy(x, y, z) {
    const dummyMesh = new THREE.Mesh(dummyGeometry, dummyMaterial);
    dummyMesh.position.x = x;
    dummyMesh.position.z = z;
    // dummyMesh.position.y = 0.5;
    dummyMesh.position.y = y + 0.5;

    return {
        mesh: dummyMesh,
    };
}
