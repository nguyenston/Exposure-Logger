import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GearSelector } from '@/components/gear-selector';
import { derivePushPullLabel } from '@/features/rolls/roll-utils';
import { colors } from '@/theme/colors';
import type { Roll, RollStatus } from '@/types/domain';

type RollFormValues = {
  nickname: string;
  camera: string;
  filmStock: string;
  nativeIso: string;
  shotIso: string;
  notes: string;
  status: RollStatus;
};

type RollFormProps = {
  initialRoll?: Roll | null;
  showStatus?: boolean;
  onSubmit: (values: {
    nickname: string | null;
    camera: string;
    filmStock: string;
    nativeIso: number | null;
    shotIso: number | null;
    notes: string | null;
    status: RollStatus;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  onTextFieldLayout?: (fieldName: string, layout: { y: number; height: number }) => void;
  onTextFieldBlur?: (fieldName: string) => void;
  onTextFieldFocus?: (fieldName: string) => void;
  submitLabel: string;
};

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function RollForm({
  initialRoll,
  showStatus = true,
  onSubmit,
  onDelete,
  onCancel,
  onTextFieldLayout,
  onTextFieldBlur,
  onTextFieldFocus,
  submitLabel,
}: RollFormProps) {
  const [values, setValues] = useState<RollFormValues>({
    nickname: initialRoll?.nickname ?? '',
    camera: initialRoll?.camera ?? '',
    filmStock: initialRoll?.filmStock ?? '',
    nativeIso: initialRoll?.nativeIso?.toString() ?? '',
    shotIso: initialRoll?.shotIso?.toString() ?? '',
    notes: initialRoll?.notes ?? '',
    status: initialRoll?.status ?? 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nativeIso = parseOptionalInteger(values.nativeIso);
  const shotIso = parseOptionalInteger(values.shotIso);
  const derivedPushPull = derivePushPullLabel(nativeIso, shotIso);

  const handleSubmit = async () => {
    if (!values.camera.trim() || !values.filmStock.trim()) {
      setError('Camera and film stock are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        nickname: values.nickname.trim() ? values.nickname.trim() : null,
        camera: values.camera.trim(),
        filmStock: values.filmStock.trim(),
        nativeIso,
        shotIso,
        notes: values.notes.trim() ? values.notes.trim() : null,
        status: values.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save roll.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Nickname</Text>
        <TextInput
          onChangeText={(nickname) => setValues((current) => ({ ...current, nickname }))}
          onBlur={() => onTextFieldBlur?.('nickname')}
          onFocus={() => onTextFieldFocus?.('nickname')}
          onLayout={(event) =>
            onTextFieldLayout?.('nickname', {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          placeholder="e.g. Chinatown at Night"
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          value={values.nickname}
        />
      </View>

      <GearSelector
        type="camera"
        label="Camera"
        value={values.camera || null}
        onChange={(item) => setValues((current) => ({ ...current, camera: item.name }))}
        placeholder="Select or create a camera"
      />

      <GearSelector
        type="film"
        label="Film Stock"
        value={values.filmStock || null}
        onChange={(item) => setValues((current) => ({ ...current, filmStock: item.name }))}
        placeholder="Select or create a film stock"
      />

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Native ISO</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(nativeIsoValue) =>
              setValues((current) => ({ ...current, nativeIso: nativeIsoValue }))
            }
            onBlur={() => onTextFieldBlur?.('nativeIso')}
            onFocus={() => onTextFieldFocus?.('nativeIso')}
            onLayout={(event) =>
              onTextFieldLayout?.('nativeIso', {
                y: event.nativeEvent.layout.y,
                height: event.nativeEvent.layout.height,
              })
            }
            placeholder="400"
            placeholderTextColor={colors.text.muted}
            style={styles.input}
            value={values.nativeIso}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Shot ISO</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(shotIsoValue) =>
              setValues((current) => ({ ...current, shotIso: shotIsoValue }))
            }
            onBlur={() => onTextFieldBlur?.('shotIso')}
            onFocus={() => onTextFieldFocus?.('shotIso')}
            onLayout={(event) =>
              onTextFieldLayout?.('shotIso', {
                y: event.nativeEvent.layout.y,
                height: event.nativeEvent.layout.height,
              })
            }
            placeholder="1600"
            placeholderTextColor={colors.text.muted}
            style={styles.input}
            value={values.shotIso}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ISO Offset</Text>
        <Text style={styles.cardValue}>{derivedPushPull}</Text>
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        multiline
        onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
        onBlur={() => onTextFieldBlur?.('notes')}
        onFocus={() => onTextFieldFocus?.('notes')}
        onLayout={(event) =>
          onTextFieldLayout?.('notes', {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Notes for the roll"
        placeholderTextColor={colors.text.muted}
        style={[styles.input, styles.notesInput]}
        textAlignVertical="top"
        value={values.notes}
      />

      {showStatus ? (
        <>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusTabs}>
            {(['active', 'finished', 'archived'] as const).map((status) => (
              <Pressable
                key={status}
                onPress={() => setValues((current) => ({ ...current, status }))}
                style={[styles.statusTab, values.status === status ? styles.statusTabActive : null]}
              >
                <Text
                  style={values.status === status ? styles.statusTabTextActive : styles.statusTabText}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.secondaryActions}>
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete roll?',
                  'This will permanently delete the roll and all exposures on it.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => void onDelete(),
                    },
                  ],
                );
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete Roll</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => void handleSubmit()}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving...' : submitLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 110,
  },
  card: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 14,
  },
  cardTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  statusTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusTabActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  statusTabText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusTabTextActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 14,
    backgroundColor: colors.text.destructive,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    marginLeft: 'auto',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
