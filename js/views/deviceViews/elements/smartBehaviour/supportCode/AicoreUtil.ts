import {
  AICORE_LOCATIONS_TYPES,
  AICORE_PRESENCE_TYPES,
  AICORE_TIME_DETAIL_TYPES,
  AICORE_TIME_TYPES
} from "../../../../../Enums";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { core } from "../../../../../core";


export const AicoreUtil = {

  extractActionChunk(rule : behaviour) {
    if (rule.action.data < 1) {
      return "dimmed at " + Math.round(rule.action.data * 100) + "%";
    }
    else if (rule.action.data == 1) {
      return "on";
    }
  },

  extractPresenceChunk(rule : behaviour) : {presencePrefix: string, presenceStr: string} {
    let presencePrefix = null;
    let presenceStr = null;
    switch (rule.presence.type) {
      case AICORE_PRESENCE_TYPES.SOMEBODY:
        presencePrefix = "if";
        presenceStr   = "somebody";
        break;
      case AICORE_PRESENCE_TYPES.NOBODY:
        presencePrefix = "if";
        presenceStr   = "nobody";
        break;
      case AICORE_PRESENCE_TYPES.SPECIFIC_USERS:
        presenceStr = null; break; // TODO: implement profiles
      case AICORE_PRESENCE_TYPES.IGNORE:
        presenceStr = null; break;
    }

    return { presencePrefix, presenceStr };
  },

  extractLocationChunk(rule : behaviour) {
    let locationPrefix = "";
    let locationStr = "";
    if (rule.presence.type !== AICORE_PRESENCE_TYPES.IGNORE) {
      // @ts-ignore
      let pd = rule.presence.data as aicorePresenceData;

      switch (pd.type) {
        case AICORE_LOCATIONS_TYPES.SPHERE:
          locationPrefix = "is";
          locationStr = "home";
          break;
        case AICORE_LOCATIONS_TYPES.LOCATION:
          if (pd.locationIds.length > 0) {
            locationPrefix = "is in the ";
            // we will now construct a roomA_name, roomB_name or roomC_name line.
            locationStr = AicoreUtil.getLocationName(pd.locationIds[0]).toLowerCase();
            if (pd.locationIds.length > 1) {
              for (let i = 1; i < pd.locationIds.length - 1; i++) {
                let locationCloudId = pd.locationIds[i];
                let locationName = AicoreUtil.getLocationName(locationCloudId).toLowerCase();
                locationStr += ", " + locationName;
              }

              locationStr += " or " + AicoreUtil.getLocationName(pd.locationIds[pd.locationIds.length - 1]).toLowerCase();
            }
          }
      }
    }

    return { locationPrefix, locationStr };
  },


  extractTimeChunk(rule : behaviour) {
    let timeStr = "";

    let time = rule.time;
    if (time.type != AICORE_TIME_TYPES.ALL_DAY) {
      // @ts-ignore
      let tr = time as aicoreTimeRange;
      let noOffset = (tr.from as aicoreTimeDataSun).offsetMinutes === 0 && (tr.to as aicoreTimeDataSun).offsetMinutes === 0;
      if ((tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE && tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNSET) && noOffset) {
        // "while the sun is up"
        timeStr = "while the sun is up";
      }
      else if ((tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET && tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNRISE) && noOffset) {
        // "while its dark outside"
        timeStr = "while it's dark outside";
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK) {
        // this makes "between X and Y"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "between " + fromStr + " and " + toStr;
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else if (tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else {
        // these are "from xxxxx to xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " to " + toStr;
      }
    }

    return timeStr;
  },



  extractOptionString(rule : behaviour) {
    let optionStr = null;
    if (rule.options && rule.options.type) {
      switch (rule.options.type) {
        case "SPHERE_PRESENCE_AFTER":
          optionStr += " Afterwards, I'll stay on if someone is still at home";
          break;
        case "LOCATION_PRESENCE_AFTER":
          optionStr += " Afterwards, I'll stay on if someone is still in the room";
          break;
      }
    }
    return optionStr;
  },


  getLocationName(locationCloudId : string) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let localId = MapProvider.cloud2localMap.locations[locationCloudId] || locationCloudId;
    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].locations[localId] !== undefined) {
        return state.spheres[sphereIds[i]].locations[localId].config.name;
      }
    }

    return "(deleted location)";
  },


  getTimeStr(timeObj: aicoreTimeData) {
    if (timeObj.type === "CLOCK") {
      // TYPE IS CLOCK
      let obj = (timeObj as aicoreTimeDataClock).data;
      return obj.hours + ":" + (obj.minutes < 10 ? obj.minutes + "0" : obj.minutes);
    }
    else {
      // TYPE IS SUNSET/SUNRISE
      let obj = (timeObj as aicoreTimeDataSun);
      let str = "";
      if (obj.offsetMinutes !== 0) {
        let getTimeNotation = function(mins) {
          mins = Math.abs(mins)
          if (mins%60 === 0) {
            let hours = mins/60;
            if (hours === 1) {
              return "1 hour";
            }
            return hours + " hours"
          }
          else if (mins < 60) {
            return mins + " minutes"
          }
          else {
            return Math.floor(mins/60) + " hrs, " + mins%60 + ' mins'
          }
        }

        if (obj.offsetMinutes < 0) {
          str += getTimeNotation(obj.offsetMinutes) + " before "
        }
        else {
          str += getTimeNotation(obj.offsetMinutes) + " after "
        }
      }
      if (obj.type === "SUNSET") {
        str += "sunset"
      }
      else if (obj.type === "SUNRISE") {
        str += "sunrise"
      }
      return str;
    }
  },

}
