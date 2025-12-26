import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Enable custom parse format plugin
dayjs.extend(customParseFormat);

type Mode = 'date' | 'datetime';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  mode?: Mode;
  placeholder?: string;
  style?: object;
  errorStyle?: object;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

/**
 * Format date using dayjs
 */
function formatDate(date: Date, mode: Mode): string {
  const format = mode === 'date' ? DATE_FORMAT : DATETIME_FORMAT;
  return dayjs(date).format(format);
}

/**
 * Parse and validate date string using dayjs
 */
function parseAndValidateDate(text: string, mode: Mode): ValidationResult {
  if (!text.trim()) {
    return { isValid: false, error: 'Date is required' };
  }

  const format = mode === 'date' ? DATE_FORMAT : DATETIME_FORMAT;
  const parsed = dayjs(text, format, true);

  if (!parsed.isValid()) {
    const expectedFormat = mode === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm';
    return {
      isValid: false,
      error: `Invalid format. Expected: ${expectedFormat}`,
    };
  }

  // Check if date is in valid range
  const year = parsed.year();
  if (year < 1900 || year > 2100) {
    return {
      isValid: false,
      error: 'Year must be between 1900 and 2100',
    };
  }

  // Additional validation for datetime mode
  if (mode === 'datetime') {
    const hour = parsed.hour();
    const minute = parsed.minute();
    if (hour < 0 || hour > 23) {
      return { isValid: false, error: 'Hour must be between 00 and 23' };
    }
    if (minute < 0 || minute > 59) {
      return { isValid: false, error: 'Minute must be between 00 and 59' };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Parse date string to Date object
 */
function parseDate(text: string, mode: Mode): Date | null {
  const validation = parseAndValidateDate(text, mode);
  if (!validation.isValid) return null;

  const format = mode === 'date' ? DATE_FORMAT : DATETIME_FORMAT;
  return dayjs(text, format, true).toDate();
}

export function UniversalDateTimeInput({
  value,
  onChange,
  mode = 'date',
  placeholder,
  style,
  errorStyle,
}: Props) {
  const [show, setShow] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(value);
  const [text, setText] = useState(formatDate(value, mode));
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Sync text with external value changes
  useEffect(() => {
    const formatted = formatDate(value, mode);
    if (text !== formatted && !touched) {
      setText(formatted);
    }
  }, [value, mode]);

  const openPicker = () => {
    setTempDate(value);
    setPickerMode('date');
    setShow(true);
  };

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }

    if (!selectedDate) return;

    // Handle Android datetime mode (requires separate date and time pickers)
    if (Platform.OS === 'android' && mode === 'datetime') {
      if (pickerMode === 'date') {
        setTempDate(selectedDate);
        setPickerMode('time');
        return;
      }

      // Combine date and time
      const final = dayjs(tempDate)
        .hour(selectedDate.getHours())
        .minute(selectedDate.getMinutes())
        .second(0)
        .millisecond(0)
        .toDate();

      onChange(final);
      setText(formatDate(final, mode));
      setError(null);
      setShow(false);
      return;
    }

    // Handle iOS or Android date-only mode
    onChange(selectedDate);
    setText(formatDate(selectedDate, mode));
    setError(null);
    setShow(false);
  };

  const handleTextChange = (inputText: string) => {
    setText(inputText);
    setTouched(true);

    // Validate input
    const validation = parseAndValidateDate(inputText, mode);

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Parse and update if valid
    const parsed = parseDate(inputText, mode);
    if (parsed) {
      onChange(parsed);
      setError(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);

    // If there's an error, revert to last valid value
    if (error) {
      setText(formatDate(value, mode));
    }
  };

  const defaultPlaceholder = mode === 'date' ? DATE_FORMAT : DATETIME_FORMAT;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          error && touched && styles.inputContainerError,
          style,
        ]}
      >
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder || defaultPlaceholder}
          placeholderTextColor="#999"
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={openPicker} style={styles.iconButton} hitSlop={8}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color={error && touched ? '#dc2626' : '#666'}
          />
        </Pressable>
      </View>

      {error && touched && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}

      {show && (
        <DateTimePicker
          value={pickerMode === 'date' ? tempDate : value}
          mode={mode === 'datetime' ? pickerMode : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputContainerError: {
    borderColor: '#dc2626',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  iconButton: {
    padding: 4,
  },
  errorText: {
    marginTop: 6,
    fontSize: 14,
    color: '#dc2626',
    paddingHorizontal: 4,
  },
});
