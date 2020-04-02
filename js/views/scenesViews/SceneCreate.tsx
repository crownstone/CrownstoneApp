import { LiveComponent } from "../LiveComponent";
import { NavigationUtil } from "../../util/NavigationUtil";
import { DataUtil } from "../../util/DataUtil";
import { core } from "../../core";
import { Alert, Platform, Switch, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { availableModalHeight, colors, screenHeight, screenWidth, styles } from "../styles";
import { Interview } from "../components/Interview";
import * as React from "react";
import { TopbarImitation } from "../components/TopbarImitation";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { Icon } from "../components/Icon";
import { useState } from "react";
import { Circle } from "../components/Circle";
import { SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import Slider from "@react-native-community/slider";
import ImagePicker from 'react-native-image-picker';
import { FileUtil } from "../../util/FileUtil";
// More info on all the options is below in the API Reference... just some common use cases shown here
const options = {
  title: 'Select Picture',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};


export class SceneCreate extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview;
  sceneData;
  removePictureQueue = [];

  constructor(props) {
    super(props);

    this.sceneData =  {
      name:'',
      sphereId: core.store.getState()?.app?.activeSphere || null,
      stoneData: {},
      pictureURI: null
    };
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      if (this.props.isModal) {
        NavigationUtil.dismissModal();
      }
      else {
        NavigationUtil.back();
      }
    }
  }

  componentWillUnmount(): void {

  }

  cancelEdit() {
    // clean up any pictures that were taken
    this._removeUnusedPictures();
    this._removePicture(this.sceneData.picture);
  }

  _removeUnusedPictures() {
    this.removePictureQueue.forEach((pic) => {
      this._removePicture(pic);
    })
    this.removePictureQueue = [];
  }

  _removePicture(image) {
    if (image) {
      console.log("HE")
      FileUtil.safeDeleteFile(image).catch((e) => {console.log("ER",e)});
    }
  }

  getStoneSelectionList(sphereId) {
    let state = core.store.getState();
    let stoneIds = Object.keys(state.spheres[sphereId].stones);

    let stoneList = [];
    let sortData = {};

    stoneIds.forEach((stoneId) => {
      let stone = state.spheres[sphereId].stones[stoneId];
      let locationId = stone.config.locationId;
      let locationName = "Not in a room..."
      if (locationId) {
        let location = DataUtil.getLocation(sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push(
        {locationName: locationName, component:
            <StoneRow
              key={stoneId}
              sphereId={sphereId}
              stoneId={stoneId}
              locationName={locationName}
              selection={(selected) => {
                if (selected) {
                  this.sceneData.stoneData[stoneId] = {
                    selected: true,
                    switchState: this.sceneData.stoneData[stoneId]?.switchState || stone.state.state
                  }
                }
                else {
                  delete this.sceneData.stoneData[stoneId];
                }
              }}/>}
      )
    })

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })

    let items = [];
    stoneList.forEach((item) => {
      items.push(item.component);
    })
    return items;
  }


  getStoneSwitchStateList(sphereId) {
    let state = core.store.getState();
    let stoneIds = Object.keys(state.spheres[sphereId].stones);

    let stoneList = [];
    let sortData = {};

    stoneIds.forEach((stoneId) => {
      if (this.sceneData.stoneData[stoneId] === undefined) { return; }

      let stone = state.spheres[sphereId].stones[stoneId];
      let locationId = stone.config.locationId;
      let locationName = "Not in a room..."
      if (locationId) {
        let location = DataUtil.getLocation(sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push({
        locationName: locationName,
        component: <StoneSwitchStateRow
            key={stoneId}
            sphereId={sphereId}
            stoneId={stoneId}
            locationName={locationName}
            state={this.sceneData.stoneData[stoneId].switchState}
            setStateCallback={(switchState) => {
              this.sceneData.stoneData[stoneId] = {
                selected: true,
                switchState: switchState,
              }
            }}/>
      });
    })

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })

    let items = [];
    stoneList.forEach((item) => {
      items.push(item.component);
    })
    return items;
  }




  getCards() : interviewCards {
    let state = core.store.getState();
    let sphereCount = Object.keys(state.spheres).length;
    let showSphereSelection = sphereCount > 1 && state.app.activeSphere && state.spheres[state.app.activeSphere].state.present == false;
    let sphereOptions = [];
    Object.keys(state.spheres).forEach((sphereId) => {
      sphereOptions.push({
        label: state.spheres[sphereId].config.name,
        nextCard:'stoneSelection',
        onSelect: (result) => {
          this.sceneData.sphereId = sphereId
        }}
      );
    });

    return {
      start: {
        header:"Let's make a Scene!",
        subHeader: "What shall we call it?",
        hasTextInputField: true,
        textColor: colors.white.hex,
        placeholder: "My new scene",
        options: [
          {
            label: "Next",
            textAlign:'right',
            nextCard: showSphereSelection ? 'sphereSelection' : 'stoneSelection',
            // response: "Good choice!",
            onSelect: (result) => {
              let name = result.textfieldState;

              this.sceneData.name = name;


              return true;
              if (name == "") {
                return false;
              }
              else {
              }
              return true
            }}
        ]
      },
      sphereSelection: {
        header: "For which Sphere?",
        subHeader: "Select the sphere where you will use this scene.",
        backgroundImage: require("../../images/backgrounds/sphereBackgroundDark.png"),
        textColor: colors.white.hex,
        component:
          <View style={{flex:1, ...styles.centered}}>
            <Icon
              name={"c1-sphere"}
              size={0.18*screenHeight}
              color={colors.white.hex}
            />
          </View>
        ,
        options: sphereOptions
      },
      stoneSelection: {
        header: "Who's participating?",
        subHeader: "Select the Crownstones which will be part of this scene.",
        backgroundImage: require("../../images/backgrounds/plugBackgroundFade.png"),
        textColor: colors.white.hex,
        explanation: "Crownstones that are not selected will be left unchanged when this scene is activated.",
        component:
          <View>
            { this.getStoneSelectionList(this.sceneData.sphereId) }
          </View>,
        options: [{label: "Next", nextCard:'stateSelection', textAlign:'right', onSelect: (result) => { }}]
      },
      stateSelection: {
        header: "What to do?",
        subHeader: "Choose the desired state for your Crownstones!",
        textColor: colors.white.hex,
        component:
          <View>
            { this.getStoneSwitchStateList(this.sceneData.sphereId) }
          </View>,
        options: [{label: "Next", nextCard:'picture', textAlign:'right', onSelect: (result) => { }}]
      },
      picture: {
        header: "And finally...",
        subHeader: "Let's pick an image! Something to quickly remember me by :)",
        editableItem: (state, setState) => {},
        options: [{label: "Creta", textAlign:'right', onSelect: (result) => { }}]
      },
    }
  }

  render() {
    let backgroundImage = require('../../images/backgrounds/behaviourMix.png');
    let textColor = colors.white.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor       = this._interview.getTextColorFromCard()  || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} dimStatusBar={true} hideOrangeLine={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
          leftAction={() => { if (this._interview.back() === false) {
            if (this.props.isModal !== false) {
              NavigationUtil.dismissModal();
            }
            else {
              NavigationUtil.back();
            }
          }}}
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
          height={ this.props.height || availableModalHeight }
        />
      </AnimatedBackground>
    );
  }
}


function StoneRow({sphereId, stoneId, locationName, selection}) {
  let [selected, setSelected] = useState(false);
  let stone = DataUtil.getStone(sphereId, stoneId);

  let height  = 80;
  let padding = 10;


  let containerStyle : ViewStyle = {
    width:screenWidth-20,
    height: height,
    padding:padding,
    paddingLeft:15,
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: selected ? colors.white.rgba( 0.9) : colors.white.rgba(0.5),
    marginBottom: 10,
    marginLeft:10,
    borderRadius: 10,
  };

  let circleBackgroundColor = selected ? colors.green.hex : colors.black.rgba(0.2);


  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 16, fontWeight:'bold'}}>{stone.config.name}</Text>
        <Text style={{fontSize: 13}}>{locationName}</Text>
      </View>
    </React.Fragment>
  );

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => { selection(!selected); setSelected(!selected);  }}
    >
      { content }
      <SlideSideFadeInView width={50} visible={!selected}></SlideSideFadeInView>
      <SlideSideFadeInView width={50} visible={selected}>
        <View style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
        </View>
      </SlideSideFadeInView>
    </TouchableOpacity>
  )
}


function StoneSwitchStateRow({sphereId, stoneId, locationName, state, setStateCallback}) {
  let [switchState, setSwitchState] = useState(state);
  let stone = DataUtil.getStone(sphereId, stoneId);

  let height  = 80;
  let padding = 10;


  let containerStyle : ViewStyle = {
    width:screenWidth-20,
    height: height,
    padding:padding,
    paddingLeft:15,
    alignItems:'center',
    backgroundColor: colors.white.rgba( 0.9),
    marginBottom: 10,
    marginLeft:10,
    borderRadius: 10,
  };

  let circleBackgroundColor = switchState > 0 ? colors.green.hex : colors.csBlueDark.hex;
  let name = stone.config.name;
  if (stone.abilities.dimming.enabledTarget) {
    name += " (" + Math.round(100*switchState) + "%)"
  }

  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 16, fontWeight:'bold'}}>{name}</Text>
        <Text style={{fontSize: 13}}>{locationName}</Text>
      </View>
    </React.Fragment>
  );

  if (stone.abilities.dimming.enabledTarget) {
    return (
      <View style={{...containerStyle, height: height+60}}>
      <View style={{flexDirection:'row'}}>
        { content }
      </View>

        <Slider
          style={{ width: screenWidth-70, height: 60}}
          minimumValue={0}
          maximumValue={1}
          step={0.025}
          value={switchState}
          minimumTrackTintColor={colors.gray.hex}
          maximumTrackTintColor={colors.gray.hex}
          onValueChange={(value) => { setStateCallback(value); setSwitchState(value); }}
        />
      </View>
    )
  }
  else {
    return (
      <View style={{...containerStyle, flexDirection:'row'}}>
        { content }
        <View style={{width:60, alignItems:'flex-end', overflow:"hidden"}}>
          <Switch value={switchState === 1} onValueChange={() => {
            let newValue = switchState === 1 ? 0 : 1;
            setStateCallback(newValue)
            setSwitchState(newValue)
          }}/>
        </View>
      </View>
    )
  }


}