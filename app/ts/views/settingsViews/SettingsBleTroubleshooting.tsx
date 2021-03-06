
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleTroubleshooting", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Platform } from 'react-native';
import { SettingsBleTroubleshootingAndroid } from "./troubleshooting/SettingsBleTroubleshootingAndroid";
import { SettingsBleTroubleshootingIOS }     from "./troubleshooting/SettingsBleTroubleshootingIOS";
import { TopBarUtil }                        from "../../util/TopBarUtil";
import { LiveComponent }                     from "../LiveComponent";



export class SettingsBleTroubleshooting extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("BLE_Troubleshooting"), closeModal: true});
  }

  render() {
    if (Platform.OS === 'android') {
      return <SettingsBleTroubleshootingAndroid {...this.props} />;
    }
    else {
      return <SettingsBleTroubleshootingIOS {...this.props} />;
    }
  }
}