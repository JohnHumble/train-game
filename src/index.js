import makeEngine from "./engine.js";
import { initializeCamera, initializeWorld } from "./world.js";
import { initializePlaceables } from "./placeables/placeables.js";

var engine = makeEngine();

initializeCamera(engine);
initializeWorld(engine);

// add placeables
initializePlaceables(engine);

engine.start();
