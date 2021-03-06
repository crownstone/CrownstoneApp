import { update} from './reducerUtil'
import { combineReducers } from 'redux'

let itemSettings : SyncEvent = {
  id: undefined,
  localId: null,
  sphereId: null,
  stoneId: null,
  cloudId: null,
  specialType: null,
};


let getItemReducer = function(changeType, itemType) {
  return (state = {...itemSettings}, action : any = {}) => {
    switch (action.type) {
      case 'INJECT_IDS':
        let newState = {...state};
        newState.id = action.id;
        return newState;
      case 'CLOUD_EVENT_' + changeType + '_' + itemType:
        newState = {...state};
        newState.id          = action.id;
        newState.localId     = update(action.localId,       newState.localId);
        newState.sphereId    = update(action.sphereId,      newState.sphereId);
        newState.stoneId     = update(action.stoneId,       newState.stoneId);
        newState.cloudId     = update(action.cloudId,       newState.cloudId);
        newState.specialType = update(action.specialType,   newState.specialType);
        return newState;
      default:
        return state;
    }
  };
};


let getReducer = (changeType) => {
  let itemReducerCreator = (itemType) => {
    let itemReducer = getItemReducer(changeType, itemType);
    
    return (state = {}, action : any = {}) => {
      switch (action.type) {
        case 'REMOVE_ALL_EVENTS':
          return {};
        case 'FINISHED_' + changeType + '_' + itemType:
          if (action.id && state[action.id]) {
            let newState = {...state};
            delete newState[action.id];
            return newState;
          }
          return state;
        default:
          if (action.id !== undefined) {
            if (state[action.id] !== undefined || action.type === 'CLOUD_EVENT_' + changeType + '_' + itemType) {
              return {
                ...state,
                ...{[action.id]: itemReducer(state[action.id], action)}
              };
            }
          }
          return state;
      }
    };
  };

  return combineReducers({
    user:          itemReducerCreator('USER'),
    locations:     itemReducerCreator('LOCATIONS'),
    stones:        itemReducerCreator('STONES'),
    behaviours:    itemReducerCreator('BEHAVIOURS'),
    installations: itemReducerCreator('INSTALLATIONS'),
    devices:       itemReducerCreator('DEVICES'),
    messages:      itemReducerCreator('MESSAGES'),
    scenes:        itemReducerCreator('SCENES'),
  })
};




export default combineReducers({
  remove:  getReducer("REMOVE"),
  special: getReducer("SPECIAL"),
});

/**
 * // to add events to the database:
 *
 * CLOUD_EVENT_REMOVE_LOCATIONS
 * CLOUD_EVENT_REMOVE_STONES
 * CLOUD_EVENT_REMOVE_INSTALLATIONS
 * CLOUD_EVENT_REMOVE_DEVICES
 * CLOUD_EVENT_REMOVE_MESSAGES
 * CLOUD_EVENT_REMOVE_BEHAVIOURS
 * CLOUD_EVENT_REMOVE_SCENES
 *
 * CLOUD_EVENT_SPECIAL_LOCATIONS
 * CLOUD_EVENT_SPECIAL_STONES
 * CLOUD_EVENT_SPECIAL_INSTALLATIONS
 * CLOUD_EVENT_SPECIAL_BEHAVIOURS
 * CLOUD_EVENT_SPECIAL_DEVICES
 * CLOUD_EVENT_SPECIAL_MESSAGES
 * CLOUD_EVENT_SPECIAL_SCENES
 *
 * // to throw the events out of the database:
 *
 * FINISHED_REMOVE_LOCATIONS
 * FINISHED_REMOVE_STONES
 * FINISHED_REMOVE_BEHAVIOURS
 * FINISHED_REMOVE_INSTALLATIONS
 * FINISHED_REMOVE_DEVICES
 * FINISHED_REMOVE_MESSAGES
 * FINISHED_REMOVE_SCENES
 *
 * FINISHED_SPECIAL_LOCATIONS
 * FINISHED_SPECIAL_STONES
 * FINISHED_SPECIAL_BEHAVIOURS
 * FINISHED_SPECIAL_INSTALLATIONS
 * FINISHED_SPECIAL_DEVICES
 * FINISHED_SPECIAL_MESSAGES
 * FINISHED_SPECIAL_SCENES
 */

