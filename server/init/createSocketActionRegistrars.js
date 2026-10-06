import {createEventSubscriptions} from './createEventSubscriptions.js';

export function createSocketActionRegistrars(services) {
    return Object.values(createEventSubscriptions(services));

}
