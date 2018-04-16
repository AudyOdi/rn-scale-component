// @flow
import React, {Component} from 'react';
import {StyleSheet, View} from 'react-native';
import Rating from './Rating';

export default class App extends Component<{}> {
  render() {
    return (
      <View style={styles.root}>
        <Rating
          scaleSize={50}
          scaleLength={5}
          ratingDescription={{
            ['1']: 'Very Poor',
            ['2']: 'Poor',
            ['3']: 'Good',
            ['4']: 'Awesome',
            ['5']: 'Super Duper!',
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});
