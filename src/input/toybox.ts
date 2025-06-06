import { EventManager, EventPublisher } from "../engine/events";
import { GameState } from "../engine/gameState";
import {
    ERASE_MODE,
    PLACE_MODE,
    Placeable,
    PlaceEvent,
    SELECT_MODE,
} from "../placeables/placeables";
import * as THREE from "three";
import { Popup, PopupFactory } from "../ui/popup";

export interface ToyboxPlaceEvent {
    mode: string;
    type: string;
}

export class Toybox {
    // Hold all possible placeable objects
    // Manage selection of placeable objects
    // Manage selection UI

    /**
     * UI should look like the following:
     *  | minimize |
     *  | x >| x1 | x2 | x3 |
     *  |---||----|----|----|
     *  | y || x4 | x5 | x6 |
     *  |---||----|----|----|
     *  | z || x7 | x8 | x9 |
     */

    // TODO see if these should be moved to another class

    /** Controls if the box is open or closed */
    popup: Popup;

    currentType: string;
    placing: boolean;

    constructor() {
        this.placing = false;
        this.currentType = "";
    }

    public init(state: GameState, eventManager: EventManager) {
        let popupFactory: PopupFactory = state.get("popup-factory");

        this.popup = popupFactory.new(document.createElement("div"));
        this.popup.body.classList.add("toybox");

        // TODO move placeable logic here for now just use an event
        let typePublisher = eventManager.createPublisher<ToyboxPlaceEvent>(
            "placeable-type",
            "toybox-select",
        );

        // Create buttons
        // TODO make this use the placeable.
        let trackPieces = [
            "strait",
            "cross",
            "curve-4",
            "curve-6",
            "curve-8",
            "curve-12",
            "curve-16",
            "left_switch_strait",
            "right_switch_strait",
        ];

        trackPieces.forEach((track) => {
            let button = document.createElement("button");
            button.textContent = track;

            button.addEventListener("click", (event) => {
                console.log(`Clicking btn: ${track}`);

                if (this.placing && this.currentType === track) {
                    typePublisher.publish({
                        mode: SELECT_MODE,
                        type: track,
                    });
                } else {
                    typePublisher.publish({
                        mode: PLACE_MODE,
                        type: track,
                    });
                    this.placing = true;
                    this.currentType = track;
                }
            });

            this.popup.body.appendChild(button);
        });

        let erase = document.createElement("button");
        erase.textContent = "erase";
        erase.addEventListener("click", (event) => {
            typePublisher.publish({
                mode: ERASE_MODE,
                type: this.currentType,
            });
        });
        this.popup.body.appendChild(erase);

        let rot = document.createElement("button");
        rot.textContent = "rot";
        rot.addEventListener("click", (event) => {
            typePublisher.publish({
                mode: "rot",
                type: this.currentType,
            });
        });
        this.popup.body.appendChild(rot);
    }
}
