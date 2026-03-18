/**
 * HomeScreen.tsx
 * Splash / landing screen with glassmorphism design.
 * Checks Bluetooth permissions & state before proceeding.
 */

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';

import BluetoothService from '../services/BluetoothService';
import {Colors, Fonts, Radius} from '../theme/colors';
import {RootStackParamList} from '../navigation/AppNavigator';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeNavProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Entrance animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Floating orb animation
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(logoScale, {toValue: 1, useNativeDriver: true, tension: 60, friction: 8}),
      Animated.timing(logoOpacity, {toValue: 1, duration: 600, useNativeDriver: true}),
      Animated.timing(contentY, {toValue: 0, duration: 700, delay: 200, useNativeDriver: true, easing: Easing.out(Easing.cubic)}),
      Animated.timing(contentOpacity, {toValue: 1, duration: 700, delay: 200, useNativeDriver: true}),
    ]).start();

    // Floating orbs
    const floatOrb = (anim: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {toValue: -18, duration, useNativeDriver: true, easing: Easing.inOut(Easing.sin)}),
          Animated.timing(anim, {toValue: 18, duration, useNativeDriver: true, easing: Easing.inOut(Easing.sin)}),
        ]),
      ).start();

    floatOrb(orb1Y, 3200);
    floatOrb(orb2Y, 4100);
  }, []);

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg('Checking permissions…');

    const granted = await BluetoothService.requestPermissions();
    if (!granted) {
      setStatusMsg('Bluetooth permissions are required.');
      setIsLoading(false);
      return;
    }

    setStatusMsg('Checking Bluetooth…');
    const enabled = await BluetoothService.isEnabled();
    if (!enabled) {
      setStatusMsg('Enabling Bluetooth…');
      const turned = await BluetoothService.enable();
      if (!turned) {
        setStatusMsg('Please enable Bluetooth manually.');
        setIsLoading(false);
        return;
      }
    }

    setStatusMsg('');
    setIsLoading(false);
    navigation.navigate('Scan');
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#06040F', '#0D0820', '#06040F']}
      style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background orbs for glassmorphism depth */}
      <Animated.View style={[styles.orb1, {transform: [{translateY: orb1Y}]}]} />
      <Animated.View style={[styles.orb2, {transform: [{translateY: orb2Y}]}]} />

      <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>

        {/* Logo / Icon */}
        <Animated.View
          style={[
            styles.logoContainer,
            {opacity: logoOpacity, transform: [{scale: logoScale}]},
          ]}>
          <LinearGradient
            colors={['rgba(124,58,237,0.3)', 'rgba(6,182,212,0.15)']}
            style={styles.logoGlass}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Text style={styles.logoEmoji}>🔵</Text>
          </LinearGradient>
          <View style={styles.logoGlow} />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {opacity: contentOpacity, transform: [{translateY: contentY}]},
          ]}>
          <Text style={styles.appName}>BT Chat</Text>
          <Text style={styles.tagline}>
            Offline · Peer-to-Peer · Private
          </Text>

          {/* Feature pills */}
          <View style={styles.pillsRow}>
            {['No Internet', 'Encrypted P2P', 'Bluetooth Classic'].map(f => (
              <View key={f} style={styles.pill}>
                <Text style={styles.pillText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Glass info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoStep}>
              <Text style={styles.infoNum}>1</Text>
              <Text style={styles.infoText}>Both phones enable Bluetooth</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.infoNum}>2</Text>
              <Text style={styles.infoText}>Pair once via Android settings</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.infoNum}>3</Text>
              <Text style={styles.infoText}>One taps Connect, one taps Be Host</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.infoNum}>4</Text>
              <Text style={styles.infoText}>Chat privately — zero internet</Text>
            </View>
          </View>

          {/* Status message */}
          {statusMsg ? (
            <Text style={styles.statusMsg}>{statusMsg}</Text>
          ) : null}

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={isLoading}
            style={styles.ctaBtnWrapper}>
            <LinearGradient
              colors={['#A78BFA', '#7C3AED', '#4F46E5']}
              style={styles.ctaBtn}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <Text style={styles.ctaBtnText}>
                {isLoading ? 'Please wait…' : 'Start Chatting  →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Works offline on any two Android phones
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},

  // Background orbs
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124,58,237,0.12)',
    top: -60,
    left: -80,
  },
  orb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(6,182,212,0.08)',
    bottom: 80,
    right: -60,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoGlass: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoEmoji: {fontSize: 44},
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.2)',
    zIndex: -1,
  },

  content: {width: '100%', alignItems: 'center'},

  appName: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.hero,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    color: Colors.accentLight,
    fontSize: Fonts.size.md,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 24,
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
  },
  pill: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pillText: {
    color: Colors.accentLight,
    fontSize: Fonts.size.xs,
    fontWeight: '600',
  },

  // Info card
  infoCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: 20,
    marginBottom: 28,
    gap: 12,
  },
  infoTitle: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentGlow,
    color: Colors.accentLight,
    fontSize: Fonts.size.sm,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
    flex: 1,
  },

  statusMsg: {
    color: Colors.warning,
    fontSize: Fonts.size.sm,
    textAlign: 'center',
    marginBottom: 16,
  },

  // CTA
  ctaBtnWrapper: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ctaBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: Fonts.size.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  footer: {
    color: Colors.textMuted,
    fontSize: Fonts.size.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;
