import { Engine } from "./engine";
import { initializeCamera, initializeWorld } from "./world";
import { initializePlaceables } from "./placeables/placeables";
import { loadModels } from "./loader";
import { initializeTrainSystem } from "./trains";

async function main() {
    var engine = new Engine();

    // load models
    await loadModels();

    // initialize world
    initializeCamera(engine);
    initializeWorld(engine);

    // add placeables
    initializePlaceables(engine);
    initializeTrainSystem(engine);

    engine.start();
}

main();
