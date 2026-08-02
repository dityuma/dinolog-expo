import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>{children}</View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    style,
  ];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable style={({ pressed }) => [cardStyle, pressed && { opacity: 0.75 }]} onPress={onPress}>
      {children}
    </Pressable>
  );
}

export function Title({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { theme } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.title, { color: theme.colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { theme } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.body, { color: muted ? theme.colors.textMuted : theme.colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={[styles.label, { color: theme.colors.textMuted }]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const palette = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary, border: 'transparent' },
    secondary: {
      bg: theme.colors.primaryContainer,
      fg: theme.colors.onPrimaryContainer,
      border: 'transparent',
    },
    danger: { bg: theme.colors.danger, fg: '#FFFFFF', border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.colors.text, border: theme.colors.border },
  }[variant];

  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: variant === 'ghost' ? 1 : 0 },
        (pressed || isDisabled) && { opacity: isDisabled ? 0.5 : 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  helper,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  helper?: string;
  error?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.text,
            height: multiline ? 96 : 46,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
      {error ? (
        <Text style={[styles.helper, { color: theme.colors.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label>{label}</Label> : null}
      <View style={styles.chipRow}>
        {options.map(option => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <Text
                style={{
                  color: active ? theme.colors.onPrimary : theme.colors.text,
                  fontWeight: active ? '700' : '500',
                  fontSize: 13,
                }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Badge({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'danger' | 'warning' | 'success' | 'primary';
}) {
  const { theme } = useTheme();
  const color = {
    neutral: theme.colors.textMuted,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    success: theme.colors.success,
    primary: theme.colors.primary,
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'leaf-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={theme.colors.textMuted} />
      <Title style={{ fontSize: 16, textAlign: 'center' }}>{title}</Title>
      {subtitle ? (
        <Body muted style={{ textAlign: 'center' }}>
          {subtitle}
        </Body>
      ) : null}
    </View>
  );
}

export function Thumb({ uri, size = 64 }: { uri: string; size?: number }) {
  const { theme } = useTheme();
  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceAlt,
      }}
      contentFit="cover"
      transition={150}
      cachePolicy="memory-disk"
    />
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  helper: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
});
