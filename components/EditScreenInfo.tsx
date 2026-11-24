import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ExternalLink } from './external-link';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.text}>
        Open up the code for this screen:
      </ThemedText>
      <ThemedView style={styles.codeContainer}>
        <ThemedText style={styles.code}>{path}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.text}>
        Change any of the text, save the file, and your app will automatically update.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
  text: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  codeContainer: {
    marginVertical: 12,
    borderRadius: 8,
    padding: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
