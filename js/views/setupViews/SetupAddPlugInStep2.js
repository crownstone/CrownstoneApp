import React, { Component } from 'react' 
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { CLOUD } from '../../cloud/cloudAPI'
import { BLEutil } from '../../native/BLEutil'
import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle, CancelButton } from './SetupShared'
import { styles, colors, screenWidth, screenHeight } from './../styles'
import { LOG } from '../../logging/Log'

export class SetupAddPlugInStep2 extends Component {
  constructor() {
    super();
    this.state = {
      progress:0,
      text:'',
      fade2image: require('../../images/lineDrawings/holdingPhoneNextToPlugSearching.png'),
      fade1image: require('../../images/lineDrawings/holdingPhoneNextToPlugSearching.png'),
      fade2: new Animated.Value(0),
      fade1: new Animated.Value(1),
    };
    this.imageIn1 = true;
  }

  componentDidMount() {
    setTimeout(() => {this.scanAndRegisterCrownstone();},0);
  }

  switchImages(nextImage) {
    if (this.imageIn1 === true) {
      if (nextImage !== this.state.fade1image) {
        this.setState({fade2image: nextImage})
        Animated.timing(this.state.fade1, {toValue: 0, duration: 200}).start();
        setTimeout(() => {
          Animated.timing(this.state.fade2, {toValue: 1, duration: 200}).start();
        }, 150);
        this.imageIn1 = false;
      }
    }
    else {
      if (nextImage !== this.state.fade2image) {
        this.setState({fade1image: nextImage});
        Animated.timing(this.state.fade2, {toValue: 0, duration: 200}).start();
        setTimeout(() => {
          Animated.timing(this.state.fade1, {toValue: 1, duration: 200}).start();
        }, 150);
        this.imageIn1 = true;
      }
    }
  }

  scanAndRegisterCrownstone() {
    this.setProgress(0);
    BLEutil.cancelSearch();
    BLEutil.getNearestSetupCrownstone()
      .then((foundCrownstone) => {
        let crownstone = foundCrownstone;
        this.interrogateStone(crownstone, this.props.groupId);
      })
      .catch((err) => {
        LOG("error in looking for setup crownstone:",err);
        Alert.alert("Nothing Found",
          "We can not find a Crownstone in setup mode. " +
          "If you are near a Crownstone, please plug it in and out of the power socket and hold your phone close.",
          [
            {text:'Cancel', onPress: () => { Actions.pop(); }},
            {text:'OK', onPress:() => { this.scanAndRegisterCrownstone(); }}
          ]
        )
      })
  }

  interrogateStone(crownstone) {
    this.setProgress(1);
    return crownstone.connect()
      .then(() => {
        this.setProgress(2);
        return crownstone.getMACAddress();
      })
      .then((MACAddress) => {
        this.setProgress(3);
        this.registerStone(crownstone, MACAddress);
      })
      .catch((err) => {
        crownstone.disconnect();
        this.scanAndRegisterCrownstone()
      })
  }

  registerStone(crownstone, MACAddress) {
    const {store} = this.props;
    const processSuccess = (cloudResponse) => {
      LOG("received from cloud:",cloudResponse);
      store.dispatch({
        type: "ADD_STONE",
        groupId: this.props.groupId,
        stoneId: cloudResponse.id,
        data: {
          type: 'plugin_v1',
          crownstoneId: cloudResponse.uid,
          bluetoothId:  crownstone.getBluetoothId(),
          macAddress:   MACAddress,
          iBeaconMajor: cloudResponse.major,
          iBeaconMinor: cloudResponse.minor,
          initializedSuccessfully: false
        }
      });
      this.claimStone(crownstone, cloudResponse.id);
    };

    const processFailure = () => {
      Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{text:"OK", onPress:() => {
        crownstone.disconnect();
        this.scanAndRegisterCrownstone();
        Actions.pop();
      }}]);
    };
    CLOUD.createStone(this.props.groupId, MACAddress, 'plugin_v1')
      .then(processSuccess)
      .catch((err) => {
        if (err.status === 422) {
          CLOUD.findStone(MACAddress)
            .then((foundCrownstones) => {
              if (foundCrownstones.length === 1) {
                processSuccess(foundCrownstones[0]);
              }
              else {
                processFailure();
              }
            })
            .catch((err) => {
              LOG("CONNECTION ERROR:",err);
              processFailure();
            })
        }
        else {
          LOG("CONNECTION ERROR:",err);
          processFailure();
        }
      });
  }

  claimStone(crownstone, stoneId) {
    const {store} = this.props;
    const state = store.getState();
    let groupId = this.props.groupId;
    let groupData = state.groups[groupId].config;
    let stoneData = state.groups[groupId].stones[stoneId].config;

    this.setProgress(4);

    let data = {};
    data.crownstoneId      = stoneData.crownstoneId;
    data.adminKey          = groupData.adminKey;
    data.memberKey         = groupData.memberKey;
    data.guestKey          = groupData.guestKey;
    data.meshAccessAddress = groupData.meshAccessAddress || 2789430350;
    data.ibeaconUUID       = groupData.iBeaconUUID;
    data.ibeaconMajor      = stoneData.iBeaconMajor;
    data.ibeaconMinor      = stoneData.iBeaconMinor;

    crownstone.connect()
      .then(() => { return crownstone.setup(data); })
      .then(() => {
        this.setProgress(5);
        setTimeout(() => { this.setProgress(6); }, 300);
        setTimeout(() => { Actions.setupAddPluginStep3({stoneId: stoneId, groupId:this.props.groupId, fromMainMenu: this.props.fromMainMenu, BLEhandle: stoneData.bluetoothId}); }, 1800);
      })
      .catch((err) => {
        crownstone.disconnect();
        Alert.alert("Whoops!",'Something went wrong during pairing, we will roll back the changes so far so you can try again.',[
          {text:'OK', onPress: () => {
            this.cleanupFailedAttempt(stoneId)
              .catch((err) => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert("Can not connect to the Cloud",'Please try again later.',[{text:'OK'}]);
                return false;
              })
              .done((success) => {
                if (success)
                  Actions.setupAddPlugInStepRecover({groupId: this.props.groupId, fromMainMenu: this.props.fromMainMenu});
              })
          }}])
      })

  }

  cleanupFailedAttempt(stoneId) {
    const { store } = this.props;
    this.props.eventBus.emit('showLoading', 'Reverting changes...');
    return CLOUD.deleteStone(stoneId)
      .then(() => {
        this.props.eventBus.emit('hideLoading');
        store.dispatch({
          type: "REMOVE_STONE",
          groupId: this.props.groupId,
          stoneId: stoneId,
        });
        return true;
      })

  }
  
  setProgress(step) {
    let newImage = undefined;
    switch (step) {
      case 0:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugSearching.png');
        this.setState({progress: 0.0, text:'Looking for Crownstone...'});
        break;
      case 1:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugGettingAddress.png');
        this.setState({progress: 0.1, text: 'Connecting to Crownstone...'});
        break;
      case 2:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugGettingAddress.png');
        this.setState({progress: 0.3, text: 'Getting Address...'});
        break;
      case 3:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugCloud.png');
        this.setState({progress: 0.5, text: 'Registering in the Cloud...'});
        break;
      case 4:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugPairing.png');
        this.setState({progress: 0.7, text: 'Binding this Crownstone to your Group...'});
        break;
      case 5:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugActivate.png');
        this.setState({progress: 0.9, text: 'Activating Crownstone'});
        break;
      case 6:
        newImage = require('../../images/lineDrawings/holdingPhoneNextToPlugDone.png');
        this.setState({progress: 1, text: 'Done!'});
        break;
    }
    this.switchImages(newImage)
  }
  
  getCancelButton() {
    if (this.state.progress === 0) {
      return (
        <View style={setupStyle.buttonContainer}>
          <CancelButton onPress={() => {Alert.alert(
                "Are you sure?",
                "You can always add Crownstones later through the settings menu.",
                [{text:'No'},{text:'Yes, I\'m sure', onPress: () => {BLEutil.cancelSearch(); Actions.tabBar();}}]
              )}}/>
          <View style={{flex:1}}/>
        </View>
      )
    }
    else {
      return (
        <View style={setupStyle.buttonContainer}>
          <View style={{height:30}}/>
          <View style={{flex:1}}/>
        </View>
      )
    }
  }

  getHeader() {
    if (this.state.progress === 0) {
      return (
        <View>
          <TopBar left='Back' leftAction={() => {BLEutil.cancelSearch(); Actions.pop();}} style={{backgroundColor:'transparent'}} shadeStatus={true}/>
          <Text style={[setupStyle.h1, {paddingTop:0}]}>Adding a Plug-in Crownstone</Text>
        </View>
      )
    }
    else {
      return (
        <View>
          <View style={styles.shadedStatusBar}/>
          <Text style={setupStyle.h1}>Adding a Plug-in Crownstone</Text>
        </View>
      )
    }
  }

  render() {
    let imageSize = 0.4*screenHeight;
    let subSize = (imageSize/500) * 326; // 500 and 326 are the 100% sizes
    let subx = imageSize*0.59;
    let suby = imageSize*0.105;
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        {this.getHeader()}
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={setupStyle.text}>Step 2: Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>{this.state.text}</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlug.png')} style={{width:imageSize, height:imageSize}}>
              <Animated.View style={{opacity:this.state.fade1, position:'absolute', left:subx, top: suby}}>
                <Image source={this.state.fade1image} style={{width:subSize, height:subSize}} />
              </Animated.View>
              <Animated.View style={{opacity:this.state.fade2, position:'absolute', left:subx, top: suby}}>
                <Image source={this.state.fade2image} style={{width:subSize, height:subSize}} />
              </Animated.View>
            </Image>
          </View>
          <View style={{flex:1}} />
          {this.getCancelButton()}
        </View>
      </Background>
    )
  }
}

