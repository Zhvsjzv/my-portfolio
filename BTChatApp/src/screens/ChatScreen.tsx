/**
 * ChatScreen.tsx
 * Real-time P2P chat UI with glassmorphism design.
 * Keyboard-aware: input field always visible above keyboard.
 */

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import BluetoothService, {ChatMessage} from '../services/BluetoothService';
import {Colors, Fonts, Radius} from '../theme/colors';
import {RootStackParamList} from '../navigation/AppNavigator';

type ChatNavProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatNavProp;
  route: ChatRouteProp;
}

const ChatScreen: React.FC<Props> = ({navigation, route}) => {
  const {deviceName} = route.params;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  // ── Setup Bluetooth callbacks on mount ──────────────────────────────────
  useEffect(() => {
    const handleMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      Alert.alert(
        'Disconnected',
        `${deviceName} disconnected.`,
        [{text: 'Back', onPress: () => navigation.goBack()}],
      );
    };

    // Re-register callbacks (connection already established in ScanScreen)
    // These are set via the service's internal refs
    BluetoothService['onMessageCallback'] = handleMessage;
    BluetoothService['onDisconnectCallback'] = handleDisconnect;

    return () => {
      // Cleanup handled by disconnect on back
    };
  }, [deviceName, navigation]);

  // ── Auto-scroll on new message ───────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({animated: true}),
        100,
      );
    }
  }, [messages]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(sendBtnScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(sendBtnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setIsSending(true);
    setInputText('');

    const success = await BluetoothService.sendMessage(text);

    if (success) {
      const myMsg: ChatMessage = {
        id: `${Date.now()}-me`,
        text,
        fromMe: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, myMsg]);
    } else {
      Alert.alert('Send Failed', 'Message could not be delivered.');
      setInputText(text); // restore
    }

    setIsSending(false);
  }, [inputText, isSending, sendBtnScale]);

  // ── Disconnect & go back ─────────────────────────────────────────────────
  const handleBack = useCallback(async () => {
    await BluetoothService.disconnect();
    navigation.goBack();
  }, [navigation]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // ── Render message bubble ─────────────────────────────────────────────────
  const renderMessage = useCallback(
    ({item}: {item: ChatMessage}) => {
      const isMe = item.fromMe;
      return (
        <View
          style={[
            styles.bubbleRow,
            isMe ? styles.bubbleRowMe : styles.bubbleRowThem,
          ]}>
          {!isMe && (
            <View style={styles.avatarDot}>
              <Text style={styles.avatarText}>
                {deviceName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
            ]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.text}
            </Text>
            <Text style={styles.bubbleTime}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      );
    },
    [deviceName],
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Start Chatting</Text>
      <Text style={styles.emptySubtitle}>
        Messages are sent directly over Bluetooth.{'\n'}No internet required.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0A0A0F', '#0F0A1E', '#0A0A0F']}
      style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* ── Header ── */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isConnected
                    ? Colors.online
                    : Colors.offline,
                },
              ]}
            />
            <Text style={styles.headerName} numberOfLines={1}>
              {deviceName}
            </Text>
          </View>
          <Text style={styles.headerSub}>
            {isConnected ? 'Connected via Bluetooth' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.btBadge}>
            <Text style={styles.btBadgeText}>BT</Text>
          </View>
        </View>
      </View>

      {/* ── Messages + Input — KeyboardAvoidingView keeps input above keyboard ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
        />

        {/* ── Input Bar ── */}
        <View style={[styles.inputBar, {paddingBottom: insets.bottom + 10}]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
          </View>

          <Animated.View style={{transform: [{scale: sendBtnScale}]}}>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || isSending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#A78BFA', '#7C3AED']}
                style={styles.sendBtnGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <Text style={styles.sendIcon}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    backgroundColor: 'rgba(10,10,15,0.95)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.glass,
  },
  backIcon: {
    color: Colors.accentLight,
    fontSize: 20,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerName: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 8,
  },
  btBadge: {
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  btBadgeText: {
    color: Colors.accentLight,
    fontSize: Fonts.size.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowThem: {
    justifyContent: 'flex-start',
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: Colors.accentLight,
    fontSize: Fonts.size.sm,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: Colors.bubbleMe,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.bubbleThem,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.md,
    lineHeight: 22,
  },
  bubbleTextMe: {
    color: '#F0EDFF',
  },
  bubbleTime: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: Fonts.size.xs,
    marginTop: 4,
    textAlign: 'right',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {fontSize: 52, marginBottom: 16},
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.xl,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    backgroundColor: 'rgba(10,10,15,0.98)',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.md,
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendBtnDisabled: {opacity: 0.4},
  sendBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default ChatScreen;
