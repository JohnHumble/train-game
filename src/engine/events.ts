import { v4 } from "uuid";

export type Event<T> = {
    pubName: string;
    pubId: string;
    data: T;
};

export type EventSubscribeFunction<T> = (event: Event<T>) => void;

export class EventManager {
    // private _channels: Map<string, any[]>;
    private _channels: Map<string, EventSubscribeFunction<any>[]>;

    constructor() {
        // this._channels = new Map();
        this._channels = new Map();
    }

    /**
     *
     * @param channel Note: the type of the channel is not checked at compile time.
     * @param name
     * @returns
     */
    public createPublisher<T>(
        channel: string,
        name: string = "anon"
    ): EventPublisher<T> {
        // create channel if it does not exist.
        if (!this._channels.has(channel)) {
            this._channels.set(channel, []);
        }

        return new EventPublisher<T>(name, channel, (event: Event<T>) =>
            this._publish(event, channel)
        );
    }

    public registerSubscriber<T>(
        channel: string,
        subFunction: EventSubscribeFunction<T>
    ) {
        if (!this._channels.has(channel)) {
            this._channels.set(channel, []);
        }

        this._channels.get(channel).push(subFunction);
    }

    private _publish<T>(event: Event<T>, channel: string) {
        console.assert(
            this._channels.has(channel),
            "channel %s not found",
            channel
        );
        this._channels.get(channel).forEach((subFunc) => subFunc(event));
    }
}

export class EventPublisher<T> {
    public readonly id: string;
    public readonly name: string;
    public readonly channel: string;

    private readonly _pubFunction: (event: Event<T>) => void;

    // subscribers: EventSubscribeFunction<T>[];

    constructor(
        name: string,
        channel: string,
        pubFunction: (event: Event<T>) => void
    ) {
        this.name = name;
        this.id = v4();
        // this.subscribers = [];
        this.channel = channel;

        this._pubFunction = pubFunction;
    }

    // public subscribe(subFunction: EventSubscribeFunction<T>) {
    //     this.subscribers.push(subFunction);
    // }

    public publish(data: T) {
        let event: Event<T> = {
            pubName: this.name,
            pubId: this.id,
            data: data,
        };

        this._pubFunction(event);

        // this.subscribers.forEach((sub) => sub(event));
    }
}

// export class EventConsumer<T> {
//     public readonly channel: string;

//     constructor(channel: string) {
//         this.channel = channel;
//     }

//     public consume()
// }
