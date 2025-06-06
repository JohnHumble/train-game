import { v4 as uuidv4 } from "uuid";

/**
 * This class should be used to create all popups used in the app.
 */
export class PopupFactory {
    inState: boolean = true;
    id: String = "popup-factory";
    popups: Map<string, Popup>;
    ordering: string[];

    constructor() {
        this.popups = new Map();
        this.ordering = [];
    }

    public new(htmlTemplate: string | HTMLElement): Popup {
        let id = uuidv4();

        let nPopup = new Popup(htmlTemplate, id, this);
        this.popups.set(id, nPopup);
        this.ordering.push(id);

        return nPopup;
    }

    public setTopZ(id: string) {
        let index = this.ordering.indexOf(id);
        if (index >= 0) {
            this.ordering.splice(index, 1);
        }
        this.ordering.push(id);

        this.setZ();
    }

    private setZ() {
        console.log(this.ordering);
        this.ordering.forEach((id, z) => {
            this.popups.get(id).setZ(z + 1);
        });
    }
}

export class Popup {
    id: string;
    title: string;
    public body: HTMLElement;

    posx: number;
    posy: number;
    preposx: number;
    preposy: number;

    dragging: boolean;
    // zIndex: number;

    parent: PopupFactory;

    constructor(
        htmlTemplate: string | HTMLElement,
        id: string,
        manager: PopupFactory,
    ) {
        this.id = id;
        this.parent = manager;

        if (typeof htmlTemplate === "string") {
            let parser = new DOMParser();
            let doc = parser.parseFromString(htmlTemplate, "text/html");

            // save the body in the content.
            this.body = document.createElement("div");
            let childrenArray = Array.from(doc.body.children);
            childrenArray.forEach((element) => {
                this.body.appendChild(element);
            });
        } else {
            this.body = htmlTemplate;
        }

        this.body.classList.add("popup");

        this.setPosition(0, 0);

        // add div to the document
        document.body.appendChild(this.body);

        // handle mouse events
        this.body.addEventListener("mousedown", (e) => this.mouseDown(e));
        window.addEventListener("mouseup", (e) => this.mouseUp(e));
        window.addEventListener("mousemove", (e) => this.mouseMove(e));
    }

    public setZ(ind: number) {
        this.body.style.zIndex = ind.toString();
    }

    mouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.preposx = event.clientX;
        this.preposy = event.clientY;

        this.dragging = true;
        // this.zIndex = 3;
        // this.body.style.zIndex = this.zIndex.toString();
        // console.log(this.parent);
        this.parent.setTopZ(this.id);
    }

    mouseUp(event: MouseEvent) {
        this.dragging = false;
        // this.zIndex = 1;
    }

    mouseMove(event: MouseEvent) {
        if (this.dragging) {
            event.preventDefault();
            event.stopPropagation();

            this.posx = this.preposx - event.clientX;
            this.posy = this.preposy - event.clientY;
            this.preposx = event.clientX;
            this.preposy = event.clientY;

            this.setPosition(
                this.body.offsetLeft - this.posx,
                this.body.offsetTop - this.posy,
            );
        }
    }

    setPosition(x: number, y: number) {
        this.body.style.left = x + "px";
        this.body.style.top = y + "px";
    }
}
