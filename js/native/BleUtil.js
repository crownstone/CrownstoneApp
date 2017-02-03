import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BluenetPromises, NativeBus, Bluenet } from './Proxy';
import { LOG } from '../logging/Log'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'
import { getUUID } from '../util/util'


export const BleUtil = {
  pendingSearch: {},
  pendingSetupSearch: {},
  highFrequencyScanUsers: {},

  _cancelSearch: function(stateContainer) {
    if (stateContainer.timeout) {
      clearTimeout(stateContainer.timeout);
    }
    if (stateContainer.unsubscribe) {
      stateContainer.unsubscribe();
    }
    delete stateContainer.unsubscribe;
    delete stateContainer.timeout;
  },
  cancelAllSearches: function() {
    this.cancelSearch();
    this.cancelSetupSearch();
  },
  cancelSearch:        function() { this._cancelSearch(this.pendingSearch); },
  cancelSetupSearch:   function() { this._cancelSearch(this.pendingSetupSearch); },


  getNearestSetupCrownstone: function(timeoutMilliseconds) {
    this.cancelSetupSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearestSetup, this.pendingSetupSearch, timeoutMilliseconds)
  },

  getNearestCrownstone: function(timeoutMilliseconds) {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearest, this.pendingSearch, timeoutMilliseconds)
  },

  _getNearestCrownstoneFromEvent: function(event, stateContainer, timeoutMilliseconds = 10000) {
    LOG.debug("_getNearestCrownstoneFromEvent: LOOKING FOR NEAREST");
    return new Promise((resolve, reject) => {
      let measurementMap = {};
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let sortingCallback = (nearestItem) => {
        //LOG.info("advertisement in nearest", nearestItem)

        if (typeof nearestItem == 'string') {
          nearestItem = JSON.parse(nearestItem);
        }

        LOG.info("_getNearestCrownstoneFromEvent: nearestItem", nearestItem, event);

        if (measurementMap[nearestItem.handle] === undefined) {
          measurementMap[nearestItem.handle] = {count: 0, rssi: nearestItem.rssi};
        }

        measurementMap[nearestItem.handle].count += 1;

        if (measurementMap[nearestItem.handle].count == 3) {
          LOG.info('_getNearestCrownstoneFromEvent: RESOLVING', nearestItem);
          this._cancelSearch(stateContainer);
          this.stopHighFrequencyScanning(highFrequencyRequestUUID);
          resolve(nearestItem);
        }
      };

      stateContainer.unsubscribe = NativeBus.on(event, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      stateContainer.timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        this._cancelSearch(stateContainer);
        reject("_getNearestCrownstoneFromEvent: Nothing Near");
      }, timeoutMilliseconds);
    })
  },

  detectCrownstone: function(stoneHandle) {
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let cleanup = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (advertisement) => {
        LOG.info("detectCrownstone: Advertisement in detectCrownstone", stoneHandle, advertisement);

        if (advertisement.handle === stoneHandle)
          count += 1;

        // three consecutive measurements before timeout is OK
        if (count == 2)
          finish(advertisement);
      };

      let finish = (advertisement) => {
        clearTimeout(cleanup.timeout);
        cleanup.unsubscribe();
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        resolve(advertisement.setupPackage);
      };

      LOG.debug("detectCrownstone: Subscribing TO ", NativeBus.topics.advertisement);
      cleanup.unsubscribe = NativeBus.on(NativeBus.topics.advertisement, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      cleanup.timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        cleanup.unsubscribe();
        reject(false);
      }, 10000);
    })
  },

  getProxy: function (bleHandle) {
    return new SingleCommand(bleHandle)
  },

  getMeshProxy: function (bleHandle) {
    return new MeshCommand(bleHandle)
  },

  /**
   *
   * @param id
   * @param noTimeout   | Bool or timeout in millis
   * @returns {function()}
   */
  startHighFrequencyScanning: function(id, noTimeout = false) {
    let enableTimeout = noTimeout === false;
    let timeoutDuration = HIGH_FREQUENCY_SCAN_MAX_DURATION;
    if (typeof noTimeout === 'number' && noTimeout > 0) {
      timeoutDuration = noTimeout;
      enableTimeout = true;
    }

    if (this.highFrequencyScanUsers[id] === undefined) {
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOG.debug("Starting HF Scanning!");
        Bluenet.startScanningForCrownstones();
      }
      this.highFrequencyScanUsers[id] = {timeout: undefined};
    }

    if (enableTimeout === true) {
      clearTimeout(this.highFrequencyScanUsers[id].timeout);
      this.highFrequencyScanUsers[id].timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(id);
      }, timeoutDuration);
    }

    return () => { this.stopHighFrequencyScanning(id) };
  },

  stopHighFrequencyScanning: function(id) {
    if (this.highFrequencyScanUsers[id] !== undefined) {
      clearTimeout(this.highFrequencyScanUsers[id].timeout);
      delete this.highFrequencyScanUsers[id];
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOG.debug("Stopping HF Scanning!");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      }
    }
  }

};

/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommand {
  constructor() {
    this.commands = [];
  }


  /**
   *
   * @param stone
   * @param commandString
   * @param props
   */
  load(stone, commandString, props) {
    this.commands.push({stone:stone, commandString:commandString, props: props})
  }

  execute(priority = true, immediate = false) {
    let meshNetworks = {};

    this.commands.forEach((todo) => {
      let stoneConfig = todo.stone.config;
      // mesh not supported / no mesh detected for this stone
      if (stoneConfig.meshNetworkId === null) {
        // handle this 1:1
      }
      else {
        meshNetworks[stoneConfig.meshNetworkId] = {
          keepAlive:[],
          keepAliveState:[],
          setSwitchState: {
            manual:[],
            sphereExit: [],
            sphereEnter:[],
            roomExit: [],
            roomEnter:[]
          },
          other: []
        };
        if (todo.commandString === 'keepAlive') {
          meshNetworks[stoneConfig.meshNetworkId].keepAlive.push({crownstoneId: stoneConfig.crownstoneId});
        }
        else if (todo.commandString === 'keepAliveState') {
          meshNetworks[stoneConfig.meshNetworkId].keepAliveState.push({
            crownstoneId: stoneConfig.crownstoneId,
            timeout: todo.props.timeout,
            newState: todo.props.state,
            changeState: todo.props.changeState,
          });
        }
        else if (todo.commandString === 'setSwitchState') {
          meshNetworks[stoneConfig.meshNetworkId].setSwitchState[todo.props.intent].push({
            crownstoneId: stoneConfig.crownstoneId,
            timeout: todo.props.timeout,
            newState: todo.props.state,
          });
        }
        else {
          // handle the command via the mesh or 1:1
        }
      }
    })
  }
}



class SingleCommand {
  constructor(handle) {
    this.handle = handle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param props  --> array of properties
   * @returns {*}
   */
  perform(action, props = []) {
    LOG.info("BLEProxy: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this._perform(action,props, false);
  }

  performPriority(action, props = []) {
    LOG.info("BLEProxy: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this._perform(action, props, true)
  }

  _perform(action, props, priorityCommand) {
    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromises.connect(this.handle)
          .then(() => { LOG.info("BLEProxy: connected, performing: ", action); return action.apply(this, props); })
          .then(() => { LOG.info("BLEProxy: completed", action, 'disconnecting'); return BluenetPromises.disconnect(); })
          .catch((err) => {
            LOG.error("BLEProxy: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromises.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("BLEProxy: cant connect, no handle available.");
        })
      }
    };

    let details = {from: 'BLEProxy: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props};

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }
}
