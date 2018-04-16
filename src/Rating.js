// @flow

import React, {Component, type Node} from 'react';
import {View, Text, Animated, PanResponder} from 'react-native';

type Position = {
  x: number,
  y: number,
};

type Props = {
  scaleLength: number,
  scaleSize: number,
  scaleColor?: string,
  selectedScaleColor?: string,
  scaleStyle?: StyleSet,
  scaleTextColor?: string,
  scaleTextStyle?: StyleSet,
  scaleDescriptionTextStyle?: StyleSet,
  lineColor?: string,
  ratingDescription?: {[key: string]: string},
};

type State = {
  gestureID: ?number,
  selectedIndex: ?number,
  tempSelectedIndex: number,
};

const DEFAULT_SCALE_COLOR = '#F44336';
const DEFAULT_SELECTED_SCALE_COLOR = '#009688';
const DEFAULT_LINE_COLOR = '#3F51B5';
const DEFAULT_SCALE_TEXT_COLOR = 'white';

export default class Rating extends Component<Props, State> {
  state = {selectedIndex: 0, tempSelectedIndex: 0, gestureID: null};
  _gesturePosition: Animated.Value = new Animated.Value(0);
  _animatedValue: Animated.Value = new Animated.Value(0);
  _initialPosition: number = 0;
  _scaleItemPosition: Map<number, Position> = new Map();
  _panResponder: {panHandlers: Object} = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      Animated.spring(this._animatedValue, {
        toValue: 1,
      }).start();
      return true;
    },
    onMoveShouldSetResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,

    onPanResponderGrant: (e, gestureState) => {
      this.setState({gestureID: gestureState.stateID, selectedIndex: null});
    },
    onPanResponderMove: (e, gestureState) => {
      if (!this.state.gestureID) {
        return;
      }
      let {dx} = gestureState;
      let newPosition = this._initialPosition + dx;
      if (this._isStillInRange(newPosition)) {
        this._gesturePosition.setValue(newPosition);
        let tempSelectedIndex = this._getSelectedIndex(newPosition);
        if (tempSelectedIndex > -1) {
          this.setState({tempSelectedIndex});
        }
      } else {
        let lastPosition = this._scaleItemPosition.get(
          this.props.scaleLength - 1,
        ) || {
          x: 0,
          y: 0,
        };
        this._gesturePosition.setValue(newPosition < 0 ? 0 : lastPosition.x);
      }
    },
    onPanResponderRelease: () => {
      let latestPosition = this._gesturePosition._value;
      let selectedIndex = this._getSelectedIndex(latestPosition);
      if (selectedIndex > -1) {
        let selectedPosition = this._scaleItemPosition.get(selectedIndex) || {
          x: 0,
          y: 0,
        };
        if (latestPosition !== selectedPosition.x) {
          this._initialPosition = selectedPosition.x;
          Animated.spring(this._gesturePosition, {
            toValue: selectedPosition.x,
            friction: 7,
            tension: 60,
          }).start();
        } else {
          this._initialPosition = latestPosition;
        }
      }
      this.setState({
        selectedIndex,
        tempSelectedIndex: selectedIndex,
        gestureID: null,
      });
      Animated.spring(this._animatedValue, {
        toValue: 0,
      }).start();
    },
  });

  render() {
    let {
      scaleLength,
      scaleSize,
      ratingDescription,
      scaleColor,
      selectedScaleColor,
      scaleStyle,
      scaleTextColor,
      scaleTextStyle,
      scaleDescriptionTextStyle,
      lineColor,
    } = this.props;
    let {tempSelectedIndex, selectedIndex} = this.state;
    return (
      <View>
        <View style={{flexDirection: 'row'}}>
          {Array.from({length: scaleLength}, (v, i) => {
            return (
              <ScaleItem
                key={i + 1}
                color={scaleColor || DEFAULT_SCALE_COLOR}
                size={scaleSize}
                renderLine={i !== scaleLength - 1}
                onLayout={(e) => {
                  this._scaleItemPosition.set(i, {
                    x: e.nativeEvent.layout.x,
                    y: e.nativeEvent.layout.y,
                  });
                }}
                info={`${i + 1}`}
                description={
                  (ratingDescription && ratingDescription[`${i + 1}`]) || ''
                }
                lineColor={lineColor || DEFAULT_LINE_COLOR}
                style={scaleStyle}
                textColor={scaleTextColor || DEFAULT_SCALE_TEXT_COLOR}
                textStyle={scaleTextStyle}
                descriptionTextStyle={scaleDescriptionTextStyle}
              />
            );
          })}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              transform: [{translateX: this._gesturePosition}],
            }}
            onLayout={(e) => {
              this._initialPosition = e.nativeEvent.layout.x;
            }}
            {...this._panResponder.panHandlers}
          >
            <ScaleItem
              color={selectedScaleColor || DEFAULT_SELECTED_SCALE_COLOR}
              size={scaleSize}
              renderLine={false}
              info={`${selectedIndex != null ? selectedIndex + 1 : ''}`}
              lineColor={lineColor || DEFAULT_LINE_COLOR}
              style={scaleStyle}
              textColor={scaleTextColor || DEFAULT_SCALE_TEXT_COLOR}
              textStyle={scaleTextStyle}
              descriptionTextStyle={scaleDescriptionTextStyle}
            />
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              transform: [
                {translateX: this._gesturePosition},
                {translateY: -1 * (scaleSize + 20)},
                {scale: this._animatedValue},
              ],
              opacity: this._animatedValue,
            }}
            onLayout={(e) => {
              this._initialPosition = e.nativeEvent.layout.x;
            }}
            {...this._panResponder.panHandlers}
          >
            <Information
              backgroundColor={
                selectedScaleColor || DEFAULT_SELECTED_SCALE_COLOR
              }
              size={scaleSize}
            >
              <Text
                style={{
                  fontSize: 20,
                  textAlign: 'center',
                  color: scaleTextColor || DEFAULT_SCALE_TEXT_COLOR,
                }}
              >
                {tempSelectedIndex + 1}
              </Text>
            </Information>
          </Animated.View>
        </View>
      </View>
    );
  }

  _getSelectedIndex = (xPosition: number) => {
    let {scaleSize} = this.props;
    let selectedIndex = -1;
    for (let [key, value] of Array.from(this._scaleItemPosition.entries()).sort(
      ([indexA], [indexB]) => indexA - indexB,
    )) {
      if (xPosition <= value.x + scaleSize / 2) {
        selectedIndex = key;
        break;
      }
    }
    return selectedIndex;
  };

  _isStillInRange = (xPosition: number) => {
    let firstPosition = this._scaleItemPosition.get(0) || {x: 0, y: 0};
    let lastPosition = this._scaleItemPosition.get(
      this.props.scaleLength - 1,
    ) || {
      x: 0,
      y: 0,
    };
    return xPosition >= firstPosition.x && xPosition <= lastPosition.x;
  };
}

type ScaleItemProps = {
  color: string,
  size: number,
  lineColor: string,
  style: ?StyleSet,
  textColor: string,
  renderLine?: boolean,
  info?: string,
  description?: string,
  textStyle: ?StyleSet,
  descriptionTextStyle: ?StyleSet,
};

function ScaleItem(props: ScaleItemProps) {
  let {
    color,
    renderLine = true,
    info,
    size,
    description,
    lineColor,
    style,
    textColor,
    textStyle,
    descriptionTextStyle,
    ...otherProps
  } = props;

  let renderLineComponent = (color: string) => (
    <View
      style={{
        width: size / 2,
        height: 5,
        backgroundColor: color,
      }}
    />
  );
  return (
    <View {...otherProps}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 5,
        }}
      >
        <View
          style={[
            {
              borderRadius: size / 2,
              width: size,
              height: size,
              backgroundColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            },
            style,
          ]}
        >
          {!!info && (
            <Text style={[{color: textColor, fontSize: 20}, textStyle]}>
              {info}
            </Text>
          )}
        </View>
        {!!renderLine && renderLineComponent(lineColor)}
      </View>
      {!!description && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: size + size / 2,
          }}
        >
          <View style={{flex: 1}}>
            <Text style={[{textAlign: 'center'}, descriptionTextStyle]}>
              {description}
            </Text>
          </View>
          {!!renderLine && renderLineComponent('transparent')}
        </View>
      )}
    </View>
  );
}

type InformationProps = {
  backgroundColor: string,
  size: number,
  children?: Node,
};

function Information(props: InformationProps) {
  let {size, backgroundColor} = props;
  return (
    <View>
      <View
        style={{
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          width: size,
          height: size,
          padding: 10,
          borderRadius: 10,
        }}
      >
        {props.children}
      </View>
      <View style={{alignItems: 'center'}}>
        <View
          style={{
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: backgroundColor,
            transform: [
              {
                rotate: '180deg',
              },
            ],
          }}
        />
      </View>
    </View>
  );
}
