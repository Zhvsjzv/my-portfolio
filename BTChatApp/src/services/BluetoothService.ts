/**
 * BluetoothService.ts
 * Singleton service wrapping react-native-bluetooth-classic.
 * Handles: enable BT, scan, pair, connect, send/receive messages.
 */

import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';
import {PermissionsAndroid, Platform} from 'react-native';

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: number;
}

class BluetoothService {
  private connection: BluetoothDevice | null = null;
  private readSubscription: BluetoothEventSubscription | null = null;
  private disconnectSubscription: BluetoothEventSubscription | null = null;
  private onMessageCallback: ((msg: ChatMessage) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  // ─── Permissions ──────────────────────────────────────────────────────────
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version as number;

      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(
          r => r === PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        // Android 6-11
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Bluetooth Chat Needs Location Permission',
            message:
              'Location permission is required to scan for nearby Bluetooth devices.',
            buttonPositive: 'Allow',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  }

  // ─── Bluetooth State ───────────────────────────────────────────────────────
  async isEnabled(): Promise<boolean> {
    return RNBluetoothClassic.isBluetoothEnabled();
  }

  async enable(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch {
      return false;
    }
  }

  // ─── Device Discovery ──────────────────────────────────────────────────────
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    return RNBluetoothClassic.getBondedDevices();
  }

  async startDiscovery(): Promise<BluetoothDevice[]> {
    try {
      const unpaired = await RNBluetoothClassic.startDiscovery();
      return unpaired;
    } catch {
      return [];
    }
  }

  async cancelDiscovery(): Promise<void> {
    try {
      await RNBluetoothClassic.cancelDiscovery();
    } catch {}
  }

  // ─── Server Mode (accept incoming connections) ─────────────────────────────
  async acceptConnection(
    onMessage: (msg: ChatMessage) => void,
    onDisconnect: () => void,
  ): Promise<boolean> {
    try {
      this.onMessageCallback = onMessage;
      this.onDisconnectCallback = onDisconnect;

      const device = await RNBluetoothClassic.accept({delimiter: '\n'});
      if (device) {
        this.connection = device;
        this._subscribeToData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ─── Client Mode (connect to a device) ────────────────────────────────────
  async connectToDevice(
    device: BluetoothDevice,
    onMessage: (msg: ChatMessage) => void,
    onDisconnect: () => void,
  ): Promise<boolean> {
    try {
      this.onMessageCallback = onMessage;
      this.onDisconnectCallback = onDisconnect;

      const connected = await device.connect({delimiter: '\n'});
      if (connected) {
        this.connection = device;
        this._subscribeToData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────
  async sendMessage(text: string): Promise<boolean> {
    if (!this.connection) return false;
    try {
      // Append newline as delimiter so receiver knows message is complete
      await this.connection.write(text + '\n');
      return true;
    } catch {
      return false;
    }
  }

  // ─── Disconnect ────────────────────────────────────────────────────────────
  async disconnect(): Promise<void> {
    this._unsubscribe();
    try {
      if (this.connection) {
        await this.connection.disconnect();
      }
    } catch {}
    this.connection = null;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  getConnectedDeviceName(): string {
    return this.connection?.name ?? 'Unknown';
  }

  // ─── Internal ──────────────────────────────────────────────────────────────
  private _subscribeToData(): void {
    if (!this.connection) return;

    this.readSubscription = this.connection.onDataReceived(data => {
      const text = typeof data.data === 'string' ? data.data.trim() : '';
      if (text && this.onMessageCallback) {
        const msg: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          text,
          fromMe: false,
          timestamp: Date.now(),
        };
        this.onMessageCallback(msg);
      }
    });

    this.disconnectSubscription = this.connection.onDisconnected(() => {
      this._unsubscribe();
      this.connection = null;
      this.onDisconnectCallback?.();
    });
  }

  private _unsubscribe(): void {
    this.readSubscription?.remove();
    this.disconnectSubscription?.remove();
    this.readSubscription = null;
    this.disconnectSubscription = null;
  }
}

export default new BluetoothService();
