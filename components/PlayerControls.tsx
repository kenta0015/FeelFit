import React from 'react';
import { View, Button } from 'react-native';

export default function PlayerControls() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
      <Button title="Pause" onPress={() => console.log('Pause pressed')} />
      <Button title="Time Left?" onPress={() => console.log('Time Left pressed')} />
      <Button title="Resume" onPress={() => console.log('Resume pressed')} />
    </View>
  );
}
