import { DEBUG } from '../ExternalConfig'
import { LOG, LOGError } from '../logging/Log'
import { getUUID } from './util'


export class EventBus {
  constructor() {
    this._topics = {};
  }
  
  on(topic, callback) {
    if (!(topic)) {
      LOGError("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOGError("Attempting to subscribe without callback to topic:", topic);
      return;
    }

    if (this._topics[topic] === undefined)
      this._topics[topic] = [];

    // generate unique id
    let id = getUUID();

    this._topics[topic].push({id,callback});

    // return unsubscribe function.
    return () => {
      if (this._topics[topic] !== undefined) {
        // find id and delete
        for (let i = 0; i < this._topics[topic].length; i++) {
          if (this._topics[topic][i].id === id) {
            this._topics[topic].splice(i,1);
            break;
          }
        }

        if (Object.keys(this._topics[topic]).length === 0)
          delete this._topics[topic];

      }
    };
  }

  emit(topic, data) {
    if (this._topics[topic] !== undefined) {
      // Firing these elements can lead to a removal of a point in this._topics.
      // To ensure we do not cause a shift by deletion (thus skipping a callback) we first put them in a separate Array
      let fireElements = [];
      this._topics[topic].forEach((element) => {
        fireElements.push(element);
      });

      fireElements.forEach((element) => {
        element.callback(data);
      })
    }
  }
}

export let eventBus = new EventBus();
