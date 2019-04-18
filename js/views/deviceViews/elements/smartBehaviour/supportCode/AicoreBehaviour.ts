import {
  SELECTABLE_TYPE
} from "../../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";

const DEFAULT_DELAY_MINUTES = 5
const EMPTY_RULE : behaviour = {
  action:   { type: "BE_ON", data: 1 },
  time:     { type: "ALL_DAY" },
  presence: { type: "IGNORE" },
}

export class AicoreBehaviour {
  originalRule : behaviour;
  rule : behaviour;
  store: any;

  constructor(behaviour?: behaviour) {
    if (!behaviour) {
      this.rule = xUtil.deepExtend({},EMPTY_RULE);
    }
    else {
      this.rule = behaviour;
    }
  }


  _getChunks() {
    let intentionStr = "I will be";
    let actionStr = AicoreUtil.extractActionChunk(this.rule);
    let { presencePrefix, presenceStr } = AicoreUtil.extractPresenceChunk(this.rule)
    let { locationPrefix, locationStr } = AicoreUtil.extractLocationChunk(this.rule)
    let timeStr   = AicoreUtil.extractTimeChunk(this.rule);
    let optionStr = AicoreUtil.extractOptionString(this.rule);


    return {
      intention:      { label: intentionStr,   data: null },
      action:         { label: actionStr,      data: this.rule.action },
      presencePrefix: { label: presencePrefix, data: null },
      presence:       { label: presenceStr,    data: this.rule.presence },
      locationPrefix: { label: locationPrefix, data: null },
      location:       { label: locationStr,    data: this.rule.presence },
      time:           { label: timeStr,        data: this.rule.time },
      option:         { label: optionStr,      data: this.rule.options }
    }
  }


  getSentence() {
    let chunks = this._getChunks();

    let sentence = "";
    sentence += chunks.intention.label;
    sentence += chunks.action.label         ? " " + chunks.action.label         : "";
    sentence += chunks.presencePrefix.label ? " " + chunks.presencePrefix.label : "";
    sentence += chunks.presence.label       ? " " + chunks.presence.label       : "";
    sentence += chunks.location.label       ? " " + chunks.location.label       : "";
    sentence += chunks.time.label           ? " " + chunks.time.label           : "";
    sentence += ".";
    sentence += chunks.option.label         ? " " + chunks.option.label + "."   : "";

    return sentence;
  }


  getSelectableChunkData() : selectableAicoreBehaviourChunk[] {
    let chunks = this._getChunks();

    let result : selectableAicoreBehaviourChunk[]= [];

    let addToResult = (chunk, type = null, hidden = false) => {
      if (typeof chunk === "string") {
        chunk = {label:chunk, changeAction: () => {}, data: null};
      }
      result.push({label: chunk.label, clickable: type !== null, type: type, data: chunk.data, hidden: hidden});
    }

    addToResult(chunks.intention)
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    if (chunks.presencePrefix.label)  { addToResult(" "); addToResult(chunks.presencePrefix);                          }
    if (chunks.presence.label)        { addToResult(" "); addToResult(chunks.presence,      SELECTABLE_TYPE.PRESENCE); } else {  addToResult(chunks.presence,SELECTABLE_TYPE.PRESENCE, true);  }
    if (chunks.locationPrefix.label)  { addToResult(" "); addToResult(chunks.locationPrefix);                          }
    if (chunks.location.label)        { addToResult(" "); addToResult(chunks.location,      SELECTABLE_TYPE.LOCATION); } else {  addToResult(chunks.location,SELECTABLE_TYPE.LOCATION, true);  }
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time, SELECTABLE_TYPE.TIME, true);      }
    addToResult(".");
    if (chunks.option.label)          { addToResult(" "); addToResult(chunks.option,        SELECTABLE_TYPE.OPTION); addToResult("."); }

    return result;
  }


  /**
   * This sets the action value. 1 means fully on, 0..1 is dimming.
   * Value must be higher than 0.
   * @param value
   */
  setActionState(value: number) : AicoreBehaviour {
    this.rule.action.data = value;
    return this;
  }
  setDimAmount(value: number) : AicoreBehaviour {
    this.rule.action.data = value;
    return this;
  }

  setTimeAllday() : AicoreBehaviour {
    this.rule.time = { type: "ALL_DAY" };
    return this;
  }
  setTimeWhenDark() : AicoreBehaviour {
    this.rule.time = { type: "RANGE", from: {type:"SUNSET", offsetMinutes:0}, to: {type:"SUNRISE", offsetMinutes:0} };
    return this;
  }
  setTimeWhenSunUp() : AicoreBehaviour {
    this.rule.time = { type: "RANGE", from: {type:"SUNRISE", offsetMinutes:0}, to: {type:"SUNSET", offsetMinutes:0} };
    return this;
  }
  setTimeFromSunrise(offsetMinutes : number = 0) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFromSunset(offsetMinutes : number = 0) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunrise(offsetMinutes : number = 0) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunset(offsetMinutes : number = 0) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFrom(hours: number, minutes: number) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") {
      if (hours < 14) {
        this.setTimeWhenSunUp();
      }
      else {
        this.setTimeWhenDark();
      }
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "CLOCK", data: {hours: hours, minutes: minutes, dayOfMonth:"*", month:"*"} };
    }
    return this;
  }


  setTimeTo(hours: number, minutes: number) : AicoreBehaviour {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") {
      if (hours > 20) {
        this.setTimeFrom(18,0);
      }
      else if (hours > 8) {
        this.setTimeFrom(8,0);
      }
      else {
        this.setTimeFrom(0,0);
      }
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "CLOCK", data: {hours: hours, minutes: minutes, dayOfMonth:"*", month:"*"} };
    }
    return this;
  }

  setTime(time: aicoreTime) : AicoreBehaviour {
    this.rule.time = time;
    return this;
  }

  insertTimeDataFrom(timeData: AicoreTimeData) {
    if (this.rule.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = timeData.data;
    }
  }

  insertTimeDataTo(timeData: AicoreTimeData) {
    if (this.rule.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = timeData.data;
    }
  }


  ignorePresence() : AicoreBehaviour {
    this.rule.presence = { type:"IGNORE" };
    return this;
  }
  setPresenceIgnore() : AicoreBehaviour {
    return this.ignorePresence();
  }
  setPresenceSomebody() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInSphere()
    }
    
    this.rule.presence.type = "SOMEBODY";
    return this;
  }
  setPresenceNobody() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceNobodyInSphere()
    }

    this.rule.presence.type = "NOBODY";
    return this;
  }
  setPresenceSomebodyInSphere() : AicoreBehaviour {
    this.rule.presence = { type:"SOMEBODY", data: {type:"SPHERE"}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceNobodyInSphere() : AicoreBehaviour {
    this.rule.presence = { type:"NOBODY", data: {type:"SPHERE"}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceSpecificUserInSphere(userProfileId: number) : AicoreBehaviour {
    this.rule.presence = { type:"SPECIFIC_USERS", data: {type:"SPHERE"}, delay: this._getSphereDelay(), profileIds:[userProfileId]};
    return this;
  }
  setPresenceInSphere() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInSphere()
    }
    else {
      this.rule.presence.data.type = "SPHERE";
    }
    return this;
  }
  setPresenceInLocations(locationIds: string[]) {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInLocations(locationIds);
    }
    else {
      this.rule.presence.data = { type: "LOCATION", locationIds: locationIds }
    }
    return this;
  }


  setPresenceSomebodyInLocations(locationIds: string[]) : AicoreBehaviour {
    this.rule.presence = { type:"SOMEBODY", data: {type:"LOCATION", locationIds: locationIds}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceNobodyInLocations(locationIds: string[]) : AicoreBehaviour {
    this.rule.presence = { type:"NOBODY", data: {type:"LOCATION", locationIds: locationIds}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceSpecificUserInLocations(locationIds: string[], userProfileId: number) : AicoreBehaviour {
    this.rule.presence = { type:"SPECIFIC_USERS", data: {type:"LOCATION", locationIds: locationIds}, delay: this._getSphereDelay(), profileIds:[userProfileId]};
    return this;
  }

  noOptions() : AicoreBehaviour {
    delete this.rule.options;
    return this;
  }
  optionStayOnWhilePeopleInSphere() : AicoreBehaviour {
    this.rule.options = {type:"SPHERE_PRESENCE_AFTER"};
    return this;
  }
  optionStayOnWhilePeopleInLocation() : AicoreBehaviour {
    this.rule.options = {type:"LOCATION_PRESENCE_AFTER"};
    return this;
  }

  _getSphereDelay() {
    // todo: implement customization.
    return DEFAULT_DELAY_MINUTES;
  }
  _getLocationDelay() {
    return this._getSphereDelay;
  }


  doesActionMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return xUtil.deepCompare(this.rule.action, otherAicoreBehaviour.rule.action);
  }
  doesPresenceTypeMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return this.rule.presence.type === otherAicoreBehaviour.rule.presence.type;
  }
  doesPresenceLocationMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    if (this.rule.presence.type !== "IGNORE" && otherAicoreBehaviour.rule.presence.type !== "IGNORE") {
      return xUtil.deepCompare(this.rule.presence.data, otherAicoreBehaviour.rule.presence.data);
    }
    else {
      return this.doesPresenceTypeMatch(otherAicoreBehaviour);
    }
  }
  doesPresenceMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return xUtil.deepCompare(this.rule.presence, otherAicoreBehaviour.rule.presence);
  }
  doesTimeMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    let match = xUtil.deepCompare(this.rule.time, otherAicoreBehaviour.rule.time);
    console.log(this.rule.time, otherAicoreBehaviour.rule.time, match)
    return match
  }



  willDim() : boolean {
    return this.rule.action.data < 1;
  }

  getDimAmount() : number {
    return this.rule.action.data;
  }
  getLocationIds() : string[] {
    if (this.rule.presence.type !== "IGNORE") {
      if (this.rule.presence.data.type === "LOCATION") {
        return this.rule.presence.data.locationIds;
      }
    }
    return [];
  }
  getTime() : aicoreTime {
    return this.rule.time;
  }
}

export class AicoreTimeData {
  data: aicoreTimeData = null;

  constructor(timeData = null) {
    this.data = timeData;
  }

  setTime(hours: number, minutes: number) {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    this.data = { type: "CLOCK", data: {hours: hours, minutes: minutes, dayOfMonth:"*", month:"*"} };
  }
  setClock() {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    this.data = { type: "CLOCK", data: {hours: 15, minutes: 0, dayOfMonth:"*", month:"*"} };
  }
  setOffsetMinutes(offsetMinutes : number = 0) {
    if (this.data.type !== "CLOCK") {
      this.data = { type: this.data.type, offsetMinutes: offsetMinutes };
    }
    else {
      this.setSunset(offsetMinutes);
    }
  }
  setSunrise(offsetMinutes : number = 0) {
    this.data = { type: "SUNRISE", offsetMinutes: offsetMinutes };
  }
  setSunset(offsetMinutes : number = 0) {
    this.data = { type: "SUNSET", offsetMinutes: offsetMinutes };
  }

  insertAicoreTimeFrom(time: aicoreTime) {
    this.data = null;
    if (time && time.type === "RANGE") {
      this.data = xUtil.deepExtend({}, time.from);
      return true;
    }
    return false;
  }
  insertAicoreTimeTo(time: aicoreTime) {
    this.data = null;
    if (time && time.type === "RANGE") {
      this.data = xUtil.deepExtend({}, time.to);
      return true;
    }
    return false;
  }


  getType() {
    if (this.data) {
      return this.data.type;
    }
    return null;
  }
  getOffsetMinutes() {
    if (this.data && this.data.type !== "CLOCK") {
      return this.data.offsetMinutes;
    }
    return 0;
  }
  getTime() {
    if (this.data && this.data.type === "CLOCK") {
      return { hours: this.data.data.hours, minutes: this.data.data.minutes };
    }
    return { hours: new Date().getHours(), minutes: 0 };
  }

  getString() : string {
    if (this.data) {
      return AicoreUtil.getTimeStr(this.data);
    }
    return "";
  }
}