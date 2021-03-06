
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTimeCustomization", key)(a,b,c,d,e);
}
import React, { useState,Component } from 'react';
import {
  Alert,
  Text,
  View, TextStyle, Platform, TouchableOpacity, TimePickerAndroid
} from "react-native";
import { colors, screenWidth} from "../../../styles";
import Slider from '@react-native-community/slider';

import { FadeIn } from "../../../components/animated/FadeInView";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { TextButtonDark, TimeButtonWithImage } from "../../../components/InterviewComponents";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { AicoreTimeData } from "../supportCode/AicoreTimeData";


import UncontrolledDatePickerIOS from 'react-native-uncontrolled-date-picker-ios';
import { LOGe } from "../../../../logging/Log";

let timeReference = null;


let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  fontSize: 15,
  fontWeight: "bold",
  color: colors.csBlue.hex
};

export class AicoreTimeCustomization extends Component<any,any> {
  fromTime: AicoreTimeData = null;
  toTime: AicoreTimeData = null;

  constructor(props) {
    super(props);

    this.fromTime = new AicoreTimeData();
    let fromFinished = this.fromTime.insertAicoreTimeFrom(this.props.timeData);

    this.toTime = new AicoreTimeData();
    let toFinished = this.toTime.insertAicoreTimeTo(this.props.timeData);

    this.state = { fromFinished: fromFinished, toFinished: toFinished, instantEdit: fromFinished && toFinished };
  }

  render() {
    return (
      <View style={{flex:1}}>
        <TimePart
          width={this.props.width}
          initialLabel={ lang("When_should_I_start_")}
          finalLabel={lang("Ill_start_at_")}
          visible={true}
          instantEdit={this.state.instantEdit}
          timeObj={this.fromTime}
          initiallyFinished={this.state.fromFinished}
          setFinished={(value) => {
            this.setState({fromFinished:value});
          }}
        />
        {this.state.fromFinished ? <View style={{ height: 20 }} /> : undefined}
        <TimePart
          width={this.props.width}
          initialLabel={ lang("When_am_I_finished_")}
          finalLabel={ lang("This_behaviour_ends_at_")}
          visible={this.state.fromFinished}
          instantEdit={this.state.instantEdit}
          timeObj={this.toTime}
          initiallyFinished={this.state.toFinished}
          setFinished={(value) => {
            this.setState({toFinished:value});
          }}
        />
        <View style={{ flex: 1 }}/>
        {this.state.toFinished && this.state.fromFinished ?
          <TimeButtonWithImage
            basic={true}
            label={ lang("Looks_good_")}
            image={require("../../../../../assets/images/icons/timeIcon.png")}
            callback={() => {
              if (AicoreUtil.isSameTime(this.fromTime, this.toTime)) {
                Alert.alert(
                  lang("_The_start_and_ending_time_header"),
                  lang("_The_start_and_ending_time_body"),
                 [{text:lang("_The_start_and_ending_time_left")}])
              }
              else {
                let tempBehaviour = new AicoreBehaviour();
                tempBehaviour.insertTimeDataFrom(this.fromTime);
                tempBehaviour.insertTimeDataTo(this.toTime);
                this.props.save(tempBehaviour.getTime());
              }
            }}/>
          : undefined}
        <View style={{ height: 5 }} />
      </View>
    )
  }
}





function TimePart(props : {
  finalLabel:string,
  initialLabel:string,
  initiallyFinished: boolean,
  setFinished(value: boolean): void,
  timeObj: AicoreTimeData,
  visible: boolean,
  instantEdit: boolean,
  width: number,
}) {
  const [type, setType] = useState(props.timeObj.getType());
  const [ignoreInstantEdit, setIgnorInstantEdit] = useState(false);
  const [offsetMinutes, setOffsetMinutes] = useState(props.timeObj.getOffsetMinutes());
  const [finished, setFinished] = useState(props.initiallyFinished);
  const [time, setTime] = useState(props.timeObj.getTime());

  if (props.visible === false) {
    return <View />;
  }

  let elements = [];
  let timeStr = xUtil.capitalize(props.timeObj.getString());
  let index = 0;

  elements.push(<Text key={"header"} style={headerStyle}>{type === null ? props.initialLabel : props.finalLabel}</Text>);
  if (finished === false) {
    if (type === null) {
      elements.push(<TypeSelector timeObj={props.timeObj} key={"typeSelect"} callback={(value) => {setType(value);}} />)
    }
    else {
      switch (type) {
        case "SUNRISE":
        case "SUNSET":
          elements.push(<TimeSummary key={"startsAt"} label={timeStr} index={index++} type={type} callback={() => { setType(null); }} />);
          elements.push(
            <View key={"offsetSetup"} style={{ paddingTop: 5 }}>
              <FadeIn index={index++}>
                <Text style={headerStyle}>{ lang("Exactly_or_with_an_offset_") }</Text>
              </FadeIn>
              <View style={{ height: 5 }}/>
              <FadeIn index={index++}>
                <View style={{ flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.gray.hex }}>{ lang("__h") }</Text>
                  <View>
                    <Slider
                      style={{ width: props.width - 0.06 * screenWidth - 75 - 20, height: 40 }}
                      minimumValue={-120}
                      maximumValue={120}
                      step={15}
                      value={Number(offsetMinutes) || 0}
                      minimumTrackTintColor={colors.gray.hex}
                      maximumTrackTintColor={colors.gray.hex}
                      onValueChange={(value) => {
                        props.timeObj.setOffsetMinutes(value);
                        setOffsetMinutes(value);
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.gray.hex }}>{ lang("__h") }</Text>
                </View>
              </FadeIn>
              <FadeIn index={index++}>
                <View style={{ marginLeft: 25 }}>
                  <TextButtonDark label={lang("Thats_a_good_time_")} basic={true} callback={() => {
                    setFinished(true);
                    props.setFinished(true);
                  }}/>
                </View>
              </FadeIn>
              { props.instantEdit && !ignoreInstantEdit ?
                <FadeIn index={index++}>
                  <View style={{ marginLeft: 25 }}>
                  <TextButtonDark label={ lang("I_want_something_else_")} basic={true} callback={() => {
                    setType(null);
                    setIgnorInstantEdit(true);
                  }}/>
                  </View>
                </FadeIn>
                : undefined }
            </View>
          );
          break;
        case "CLOCK":
          let sharedOther = (
            props.instantEdit && !ignoreInstantEdit ?
            <FadeIn index={index++}>
              <View style={{ marginLeft: 25 }}>
                <TextButtonDark label={ lang("I_want_something_else_")} basic={true} callback={() => {
                  setType(null);
                  setIgnorInstantEdit(true);
                }}/>
              </View>
            </FadeIn>
            : undefined
          );
          if (Platform.OS === 'android') {
            elements.push(
              <View key={"clockUI"}>
                <FadeIn index={index++}>
                  <TouchableOpacity style={{
                    height:100,
                    backgroundColor: colors.white.rgba(0.75),
                    padding:15,
                    alignItems:'flex-start'
                  }} onPress={() => {
                      TimePickerAndroid.open({
                        hour: time.hours,
                        minute: time.minutes,
                        is24Hour: true,
                      })
                        .then((data) => {
                          if (data.action === 'timeSetAction') {
                            setTime({hours:data.hour, minutes:data.minute});
                            props.timeObj.setTime(data.hour, data.minute);
                            setFinished(true);
                            props.setFinished(true);
                          }
                        })
                        .catch((err) => { LOGe.info("AicoreTimeCustomization: Could not pick time for android.", err) })
                  }}>
                    <Text style={{fontSize:13, fontWeight: '200', color:colors.black.rgba(0.6)}}>{ lang("TAP_TIME_TO_CHANGE") }</Text>
                    <Text style={{fontSize:55, fontWeight: '500', color:colors.black.rgba(0.6)}}>
                      { time.hours + ":" + (time.minutes < 10 ? '0' + time.minutes : time.minutes) }
                    </Text>
                  </TouchableOpacity>
                </FadeIn>
                <TimeButtonWithImage
                  basic={true}
                  key={"resultButton" + index}
                  index={index}
                  label={ Platform.OS === "android" ? lang("Thats_a_good_time_") : lang("Tap_to_select_time_")}
                  image={require("../../../../../assets/images/icons/clock.png")}
                  callback={() => {
                    setFinished(true);
                    props.setFinished(true);
                  }}
                />
                {sharedOther}
              </View>);
          }
          else {
            elements.push(
              <View key={"clockUI"}>
                <FadeIn index={index++}>
                  <UncontrolledDatePickerIOS
                    ref={(x) => {
                      timeReference = x;
                    }}
                    date={new Date(new Date(new Date().setHours(time.hours)).setMinutes(time.minutes))}
                    mode="time"
                    style={{ height: 210 }}
                  />
                </FadeIn>
                <TimeButtonWithImage
                  basic={true}
                  key={"resultButton" + index}
                  index={index}
                  label={lang("Tap_to_select_time_")}
                  image={require("../../../../../assets/images/icons/clock.png")}
                  callback={() => {
                    timeReference.getDate((date) => {
                      let hours = date.getHours();
                      let minutes = date.getMinutes();

                      setTime({hours:hours, minutes: minutes});
                      props.timeObj.setTime(hours, minutes);

                      setFinished(true);
                      props.setFinished(true);
                    })
                  }}
                />
                { sharedOther }
              </View>
          );
          break;
        }
      }
    }
  }
  else {
    elements.push(
      <TimeSummary
        key={"startsAt"}
        label={timeStr}
        index={index++}
        type={type}
        callback={() => {
          if (!props.instantEdit) {
            setType(null);
          }
          setFinished(false); props.setFinished(false); }}
      />
    );
  }

  return (
    <View>
      { elements }
    </View>
  )
}


function TimeSummary(props : any) {
  switch (props.type) {
    case "SUNRISE":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/sunrise.png")}
          callback={props.callback}
        />
      );
      break;
    case "SUNSET":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/sunset.png")}
          callback={props.callback}
        />
      );
      break;
    case "CLOCK":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/clock.png")}
          callback={props.callback}
        />
      );
      break;
  }

  return <View />;
}



function TypeSelector(props) {
  let i = 0;
  return (
    <View>
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_sunrise___")}
        image={require("../../../../../assets/images/icons/sunrise.png")}
        callback={() => { props.timeObj.setSunrise(); props.callback("SUNRISE") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_sunset___")}
        image={require("../../../../../assets/images/icons/sunset.png")}
        callback={() => { props.timeObj.setSunset(); props.callback("SUNSET") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_a_specific_time___")}
        image={require("../../../../../assets/images/icons/clock.png")}
        callback={() => { props.timeObj.setClock(); props.callback("CLOCK") }}
      />
    </View>
  );
}

