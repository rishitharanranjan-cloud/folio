/**
 * Top-level error boundary — catches any render crash and shows a readable
 * error message instead of a blank white screen.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface State {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  State
> {
  state: State = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught crash:', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>FOLIO — APP CRASH</Text>
        <Text style={styles.sub}>
          Something went wrong. The error is shown below — send it to the developer.
        </Text>
        <ScrollView style={styles.box}>
          <Text style={styles.error}>{this.state.error?.toString()}</Text>
          {this.state.info && (
            <Text style={styles.stack}>{this.state.info.componentStack}</Text>
          )}
        </ScrollView>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, error: null, info: null })}
        >
          <Text style={styles.btnText}>TRY AGAIN</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
    padding: 28,
    paddingTop: 60,
    gap: 16,
  },
  heading: {
    color: '#d0682a',
    fontSize: 22,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  sub: {
    color: '#a0b8d4',
    fontSize: 13,
    lineHeight: 19,
  },
  box: {
    flex: 1,
    backgroundColor: '#0c1018',
    borderRadius: 4,
    padding: 14,
  },
  error: {
    color: '#d0682a',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  stack: {
    color: '#607890',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  btn: {
    backgroundColor: '#6098c8',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#020408',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
});
