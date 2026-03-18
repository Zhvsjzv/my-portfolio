/**
 * ScanScreen.tsx
 * Shows paired devices + live discovery results.
 * User taps a device → connects → navigates to ChatScreen.
 * Also has "Wait for Connection" button for server/acceptor role.
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import {BluetoothDevice} from 'react-native-bluetooth-classic';

import BluetoothService from '../services/BluetoothService';
import {Colors, Fonts, Radius} from '../theme/colors';
import {RootStackParamList} from '../navigation/AppNavigator';

type ScanNavProp = StackNavigationProp<RootStackParamList, 'Scan'>;

interface Props {
  navigation: ScanNavProp;
}

type DeviceSection = 'paired' | 'nearby';

interface DeviceItem extends BluetoothDevice {
  section: DeviceSection;
}

const ScanScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [nearbyDevices, setNearbyDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  const scanAnim = new Animated.Value(0);

  // ── Pulse animation for scanning indicator ───────────────────────────────
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  // ── Load paired on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadPaired();
  }, []);

  const loadPaired = async () => {
    try {
      const devices = await BluetoothService.getPairedDevices();
      setPairedDevices(devices);
    } catch {
      setPairedDevices([]);
    }
  };

  // ── Discovery ────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (isScanning) {
      await BluetoothService.cancelDiscovery();
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setNearbyDevices([]);

    const found = await BluetoothService.startDiscovery();
    setNearbyDevices(found);
    setIsScanning(false);
  }, [isScanning]);

  // ── Connect as client ────────────────────────────────────────────────────
  const handleConnect = useCallback(
    async (device: BluetoothDevice) => {
      setConnectingId(device.address);

      const success = await BluetoothService.connectToDevice(
        device,
        () => {}, // placeholder — ChatScreen registers these
        () => {},
      );

      setConnectingId(null);

      if (success) {
        navigation.navigate('Chat', {deviceName: device.name ?? device.address});
      } else {
        Alert.alert(
          'Connection Failed',
          `Could not connect to ${device.name ?? device.address}.\n\nMake sure:\n• Both phones have BT enabled\n• Device is in range\n• Device is paired`,
        );
      }
    },
    [navigation],
  );

  // ── Wait for connection (server role) ────────────────────────────────────
  const handleWait = useCallback(async () => {
    setIsWaiting(true);

    Alert.alert(
      'Waiting…',
      'Your phone is now discoverable. Ask the other person to connect to you.',
      [{text: 'Cancel', onPress: () => setIsWaiting(false), style: 'cancel'}],
    );

    const success = await BluetoothService.acceptConnection(
      () => {},
      () => {},
    );

    setIsWaiting(false);

    if (success) {
      const name = BluetoothService.getConnectedDeviceName();
      navigation.navigate('Chat', {deviceName: name});
    }
  }, [navigation]);

  // ── Render device card ────────────────────────────────────────────────────
  const renderDevice = useCallback(
    ({item}: {item: BluetoothDevice}) => {
      const isConnecting = connectingId === item.address;
      return (
        <TouchableOpacity
          style={styles.deviceCard}
          onPress={() => handleConnect(item)}
          activeOpacity={0.75}
          disabled={isConnecting || !!connectingId}>
          <View style={styles.deviceIconWrap}>
            <Text style={styles.deviceIcon}>📱</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {item.name ?? 'Unknown Device'}
            </Text>
            <Text style={styles.deviceAddress}>{item.address}</Text>
          </View>
          {isConnecting ? (
            <ActivityIndicator color={Colors.accentLight} size="small" />
          ) : (
            <View style={styles.connectArrow}>
              <Text style={styles.connectArrowText}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [connectingId, handleConnect],
  );

  const allDevices: BluetoothDevice[] = [
    ...pairedDevices,
    ...nearbyDevices.filter(
      n => !pairedDevices.find(p => p.address === n.address),
    ),
  ];

  return (
    <LinearGradient
      colors={['#0A0A0F', '#0F0A1E', '#0A0A0F']}
      style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.headerTitle}>Find Devices</Text>
          <Text style={styles.headerSub}>
            {allDevices.length} device{allDevices.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {/* Scan */}
        <TouchableOpacity
          style={[styles.actionBtn, isScanning && styles.actionBtnActive]}
          onPress={handleScan}
          activeOpacity={0.8}>
          <LinearGradient
            colors={
              isScanning ? ['#EF4444', '#B91C1C'] : ['#7C3AED', '#4F46E5']
            }
            style={styles.actionBtnGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            {isScanning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionBtnIcon}>🔍</Text>
            )}
            <Text style={styles.actionBtnLabel}>
              {isScanning ? 'Stop Scan' : 'Scan'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Wait / Server */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleWait}
          activeOpacity={0.8}
          disabled={isWaiting}>
          <LinearGradient
            colors={['#0891B2', '#0E7490']}
            style={styles.actionBtnGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            {isWaiting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionBtnIcon}>📡</Text>
            )}
            <Text style={styles.actionBtnLabel}>
              {isWaiting ? 'Waiting…' : 'Be Host'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Refresh paired */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={loadPaired}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.actionBtnGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Text style={styles.actionBtnIcon}>🔄</Text>
            <Text style={styles.actionBtnLabel}>Paired</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Section labels */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>
          {isScanning ? 'Scanning nearby…' : 'Available Devices'}
        </Text>
        <View style={styles.sectionDivider} />
      </View>

      {/* Device List */}
      <FlatList
        data={allDevices}
        renderItem={renderDevice}
        keyExtractor={item => item.address}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + 20},
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {isScanning ? '📡' : '🔵'}
            </Text>
            <Text style={styles.emptyText}>
              {isScanning
                ? 'Scanning for nearby devices…'
                : 'No devices found.\nTap Scan to discover nearby phones.'}
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {color: Colors.accentLight, fontSize: 20, fontWeight: '600'},
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.xl,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
  },

  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  actionBtnActive: {opacity: 0.95},
  actionBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnIcon: {fontSize: 20},
  actionBtnLabel: {
    color: '#fff',
    fontSize: Fonts.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  listContent: {paddingHorizontal: 20, gap: 10},

  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  deviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIcon: {fontSize: 20},
  deviceInfo: {flex: 1},
  deviceName: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.md,
    fontWeight: '600',
  },
  deviceAddress: {
    color: Colors.textMuted,
    fontSize: Fonts.size.xs,
    marginTop: 2,
  },
  connectArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectArrowText: {
    color: Colors.accentLight,
    fontSize: 16,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyIcon: {fontSize: 52},
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ScanScreen;
