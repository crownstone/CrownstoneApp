import { BatchCommandHandler } from '../logic/BatchCommandHandler'
import { LOG }                 from "../logging/Log";
import { eventBus }            from "../util/EventBus";
import { Util } from "../util/Util";

class ErrorWatcherClass {
  _initialized: boolean = false;
  processedErrors: any = {};
  store: any;

  constructor() { }

  loadStore(store: any) {
    LOG.info('LOADED STORE ErrorWatcher', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      eventBus.on("errorDetectedInAdvertisement", (data) => {
        this.processError(data.advertisement, data.stone, data.stoneId, data.sphereId);
      });

      eventBus.on("errorResolvedInAdvertisement", (data) => {
        this.clearError(data.advertisement, data.stone, data.stoneId, data.sphereId);
      })
    }
    this._initialized = true;
  }



  clearError(advertisement: crownstoneAdvertisement, stone, stoneId, sphereId) {
    if (this.processedErrors[advertisement.handle] !== undefined) {
      this.processedErrors[advertisement.handle] = undefined;
      delete this.processedErrors[advertisement.handle]
    }

    this.store.dispatch({type:'CLEAR_STONE_ERRORS', sphereId: sphereId, stoneId: stoneId});
  }

  processError(advertisement: crownstoneAdvertisement, stone, stoneId, sphereId) {
    if (this.processedErrors[advertisement.handle] === undefined) {
      this.processedErrors[advertisement.handle] = true;
      this.store.dispatch({type:'UPDATE_STONE_ERRORS', sphereId: sphereId, stoneId: stoneId, data: { advertisementError: true }});
      BatchCommandHandler.loadPriority(
        stone,
        stoneId,
        sphereId,
        {commandName:'getErrors'},
        1e5,
      )
        .then((errors) => {
          LOG.info('ErrorWatcher: Got errors from Crownstone:', errors);
          this.store.dispatch({type:'UPDATE_STONE_ERRORS', sphereId: sphereId, stoneId: stoneId, data: errors});
          eventBus.emit("checkErrors");
        })
        .catch((err) => { LOG.error('ErrorWatcher: Could not get errors from Crownstone.', err); });
      BatchCommandHandler.executePriority();
    }
  }

}

export const ErrorWatcher = new ErrorWatcherClass();