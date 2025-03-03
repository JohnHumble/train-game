import makeEngine from "./engine.js";
import { initializeCamera, initializeWorld } from "./world.js";
import { initializePlaceables } from "./placeables/placeables.js";
import { loadModels } from "./loader.js";
import { initializeTrainSystem } from "./trains.js";

var engine = makeEngine();

// load models
await loadModels();

// initialize world
initializeCamera(engine);
initializeWorld(engine);

// add placeables
initializePlaceables(engine);
initializeTrainSystem(engine);

engine.start();
