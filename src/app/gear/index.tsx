import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseCameraMetadata } from '@/features/gear/camera-metadata';
import { parseFilmMetadata } from '@/features/gear/film-metadata';
import { getGearDisplayName } from '@/features/gear/gear-utils';
import { parseLensMetadata } from '@/features/gear/lens-metadata';
import { useGearRegistry } from '@/features/gear/use-gear-registry';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { colors } from '@/theme/colors';
import type { GearRegistryItem, GearType } from '@/types/domain';

const gearTypes: GearType[] = ['camera', 'lens', 'film'];

type LensDraft = {
  name: string;
  focalLength: string;
  maxAperture: string;
  mount: string;
  serialOrNickname: string;
  notes: string;
};

type FilmDraft = {
  name: string;
  nativeIso: string;
  notes: string;
};

type CameraDraft = {
  name: string;
  nickname: string;
  notes: string;
};

function emptyLensDraft(): LensDraft {
  return {
    name: '',
    focalLength: '',
    maxAperture: '',
    mount: '',
    serialOrNickname: '',
    notes: '',
  };
}

function emptyFilmDraft(): FilmDraft {
  return {
    name: '',
    nativeIso: '',
    notes: '',
  };
}

function emptyCameraDraft(): CameraDraft {
  return {
    name: '',
    nickname: '',
    notes: '',
  };
}

function formatMaxApertureDraftValue(value: string | null) {
  if (!value) {
    return '';
  }

  return value.replace(/^f\/?/i, '');
}

function normalizeMaxApertureDraftValue(value: string) {
  const trimmed = value.trim().replace(/^f\/?/i, '');
  return trimmed ? `f/${trimmed}` : null;
}

function nextAutoFilledValue(
  currentValue: string,
  previousParsedValue: string | null,
  nextParsedValue: string | null,
) {
  if (!currentValue) {
    return nextParsedValue ?? '';
  }

  if (previousParsedValue && currentValue === previousParsedValue) {
    return nextParsedValue ?? '';
  }

  return currentValue;
}

function itemToLensDraft(item: GearRegistryItem): LensDraft {
  return {
    name: item.name,
    focalLength: item.focalLength ?? '',
    maxAperture: formatMaxApertureDraftValue(item.maxAperture),
    mount: item.mount ?? '',
    serialOrNickname: item.serialOrNickname ?? '',
    notes: item.notes ?? '',
  };
}

function itemToFilmDraft(item: GearRegistryItem): FilmDraft {
  return {
    name: item.name,
    nativeIso: item.nativeIso?.toString() ?? '',
    notes: item.notes ?? '',
  };
}

function itemToCameraDraft(item: GearRegistryItem): CameraDraft {
  return {
    name: item.name,
    nickname: item.nickname ?? '',
    notes: item.notes ?? '',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function GearRegistryScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const {
    handleFieldBlur,
    handleFieldFocus,
    handleScroll,
    handleViewportLayout,
    keyboardOffset,
    registerFieldLayout,
    scrollViewRef,
  } = useFocusedFieldVisibility();
  const initialType = gearTypes.includes(params.type as GearType) ? (params.type as GearType) : 'camera';
  const [activeType, setActiveType] = useState<GearType>(initialType);
  const [draftName, setDraftName] = useState('');
  const [cameraDraft, setCameraDraft] = useState<CameraDraft>(emptyCameraDraft);
  const [lensDraft, setLensDraft] = useState<LensDraft>(emptyLensDraft);
  const [filmDraft, setFilmDraft] = useState<FilmDraft>(emptyFilmDraft);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCameraDraft, setEditingCameraDraft] = useState<CameraDraft>(emptyCameraDraft);
  const [editingLensDraft, setEditingLensDraft] = useState<LensDraft>(emptyLensDraft);
  const [editingFilmDraft, setEditingFilmDraft] = useState<FilmDraft>(emptyFilmDraft);

  useEffect(() => {
    if (!gearTypes.includes(params.type as GearType)) {
      return;
    }

    setActiveType(params.type as GearType);
  }, [params.type]);

  useEffect(() => {
    setDraftName('');
    setCameraDraft(emptyCameraDraft());
    setLensDraft(emptyLensDraft());
    setFilmDraft(emptyFilmDraft());
    setEditingItemId(null);
    setEditingName('');
    setEditingCameraDraft(emptyCameraDraft());
    setEditingLensDraft(emptyLensDraft());
    setEditingFilmDraft(emptyFilmDraft());
  }, [activeType]);

  const { visibleItems, createItem, deleteItem, updateItem, error, loading } = useGearRegistry(activeType, '');

  const title = useMemo(() => {
    if (activeType === 'film') {
      return 'Film Stock';
    }

    return activeType.charAt(0).toUpperCase() + activeType.slice(1);
  }, [activeType]);

  const isLensType = activeType === 'lens';
  const isFilmType = activeType === 'film';
  const isCameraType = activeType === 'camera';

  const handleLensNameChange = (nextName: string, target: 'create' | 'edit') => {
    const parsed = parseLensMetadata(nextName);

    if (target === 'create') {
      setLensDraft((current) => ({
        ...current,
        name: nextName,
        ...(() => {
          const previousParsed = parseLensMetadata(current.name);
          return {
            focalLength: nextAutoFilledValue(
              current.focalLength,
              previousParsed.focalLength,
              parsed.focalLength,
            ),
            maxAperture: nextAutoFilledValue(
              current.maxAperture,
              formatMaxApertureDraftValue(previousParsed.maxAperture),
              formatMaxApertureDraftValue(parsed.maxAperture),
            ),
          };
        })(),
      }));
      return;
    }

    setEditingLensDraft((current) => ({
      ...current,
      name: nextName,
      ...(() => {
        const previousParsed = parseLensMetadata(current.name);
        return {
          focalLength: nextAutoFilledValue(
            current.focalLength,
            previousParsed.focalLength,
            parsed.focalLength,
          ),
          maxAperture: nextAutoFilledValue(
            current.maxAperture,
            formatMaxApertureDraftValue(previousParsed.maxAperture),
            formatMaxApertureDraftValue(parsed.maxAperture),
          ),
        };
      })(),
    }));
  };

  const handleFilmNameChange = (nextName: string, target: 'create' | 'edit') => {
    const parsed = parseFilmMetadata(nextName);

    if (target === 'create') {
      setFilmDraft((current) => {
        const previousParsed = parseFilmMetadata(current.name);
        return {
          ...current,
          name: nextName,
          nativeIso: nextAutoFilledValue(
            current.nativeIso,
            previousParsed.nativeIso?.toString() ?? null,
            parsed.nativeIso?.toString() ?? null,
          ),
        };
      });
      return;
    }

    setEditingFilmDraft((current) => {
      const previousParsed = parseFilmMetadata(current.name);
      return {
        ...current,
        name: nextName,
        nativeIso: nextAutoFilledValue(
          current.nativeIso,
          previousParsed.nativeIso?.toString() ?? null,
          parsed.nativeIso?.toString() ?? null,
        ),
      };
    });
  };

  const handleCameraNameChange = (nextValue: string, target: 'create' | 'edit') => {
    const parsed = parseCameraMetadata(nextValue);

    if (target === 'create') {
      setCameraDraft((current) => ({
        ...current,
        name: parsed.name,
        nickname:
          current.nickname ||
          parsed.nickname ||
          '',
      }));
      return;
    }

    setEditingCameraDraft((current) => ({
      ...current,
      name: parsed.name,
      nickname:
        current.nickname ||
        parsed.nickname ||
        '',
    }));
  };

  const handleCreate = async () => {
    if (isLensType) {
      if (!lensDraft.name.trim()) {
        return;
      }

      await createItem({
        name: lensDraft.name,
        nativeIso: null,
        focalLength: normalizeOptionalText(lensDraft.focalLength),
        maxAperture: normalizeMaxApertureDraftValue(lensDraft.maxAperture),
        mount: normalizeOptionalText(lensDraft.mount),
        serialOrNickname: normalizeOptionalText(lensDraft.serialOrNickname),
        notes: normalizeOptionalText(lensDraft.notes),
      });
      setLensDraft(emptyLensDraft());
      return;
    }

    if (isCameraType) {
      if (!cameraDraft.name.trim()) {
        return;
      }

      await createItem({
        name: cameraDraft.name,
        nickname: normalizeOptionalText(cameraDraft.nickname),
        nativeIso: null,
        focalLength: null,
        maxAperture: null,
        mount: null,
        serialOrNickname: null,
        notes: normalizeOptionalText(cameraDraft.notes),
      });
      setCameraDraft(emptyCameraDraft());
      return;
    }

    if (isFilmType) {
      if (!filmDraft.name.trim()) {
        return;
      }

      await createItem({
        name: filmDraft.name,
        nativeIso: normalizeOptionalInteger(filmDraft.nativeIso),
        focalLength: null,
        maxAperture: null,
        mount: null,
        serialOrNickname: null,
        notes: normalizeOptionalText(filmDraft.notes),
      });
      setFilmDraft(emptyFilmDraft());
      return;
    }

    if (!draftName.trim()) {
      return;
    }

    await createItem(draftName);
    setDraftName('');
  };

  const startEditing = (item: GearRegistryItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
    if (item.type === 'camera') {
      setEditingCameraDraft(itemToCameraDraft(item));
      return;
    }
    if (item.type === 'lens') {
      setEditingLensDraft(itemToLensDraft(item));
      return;
    }
    if (item.type === 'film') {
      setEditingFilmDraft(itemToFilmDraft(item));
    }
  };

  const handleSave = async () => {
    if (!editingItemId) {
      return;
    }

    if (isLensType) {
      if (!editingLensDraft.name.trim()) {
        return;
      }

      await updateItem(editingItemId, {
        name: editingLensDraft.name,
        focalLength: normalizeOptionalText(editingLensDraft.focalLength),
        maxAperture: normalizeMaxApertureDraftValue(editingLensDraft.maxAperture),
        mount: normalizeOptionalText(editingLensDraft.mount),
        serialOrNickname: normalizeOptionalText(editingLensDraft.serialOrNickname),
        notes: normalizeOptionalText(editingLensDraft.notes),
      });
      setEditingItemId(null);
      setEditingName('');
      setEditingLensDraft(emptyLensDraft());
      return;
    }

    if (isCameraType) {
      if (!editingCameraDraft.name.trim()) {
        return;
      }

      await updateItem(editingItemId, {
        name: editingCameraDraft.name,
        nickname: normalizeOptionalText(editingCameraDraft.nickname),
        notes: normalizeOptionalText(editingCameraDraft.notes),
      });
      setEditingItemId(null);
      setEditingName('');
      setEditingCameraDraft(emptyCameraDraft());
      return;
    }

    if (isFilmType) {
      if (!editingFilmDraft.name.trim()) {
        return;
      }

      await updateItem(editingItemId, {
        name: editingFilmDraft.name,
        nativeIso: normalizeOptionalInteger(editingFilmDraft.nativeIso),
        notes: normalizeOptionalText(editingFilmDraft.notes),
      });
      setEditingItemId(null);
      setEditingName('');
      setEditingFilmDraft(emptyFilmDraft());
      return;
    }

    if (!editingName.trim()) {
      return;
    }

    await updateItem(editingItemId, editingName);
    setEditingItemId(null);
    setEditingName('');
  };

  const renderCameraFields = (
    draft: CameraDraft,
    setDraft: Dispatch<SetStateAction<CameraDraft>>,
    prefix: string,
  ) => (
    <View style={styles.lensFields}>
      <TextInput
        onChangeText={(value) => handleCameraNameChange(value, prefix === 'create' ? 'create' : 'edit')}
        onBlur={() => handleFieldBlur(`${prefix}-camera-name`)}
        onFocus={() => handleFieldFocus(`${prefix}-camera-name`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-camera-name`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Camera name"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.name}
      />
      <TextInput
        onChangeText={(value) => setDraft((current) => ({ ...current, nickname: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-camera-nickname`)}
        onFocus={() => handleFieldFocus(`${prefix}-camera-nickname`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-camera-nickname`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Nickname"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.nickname}
      />
      <TextInput
        multiline
        onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-camera-notes`)}
        onFocus={() => handleFieldFocus(`${prefix}-camera-notes`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-camera-notes`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Notes"
        placeholderTextColor={colors.text.muted}
        style={[styles.input, styles.notesInput]}
        value={draft.notes}
      />
    </View>
  );

  const renderFilmFields = (
    draft: FilmDraft,
    setDraft: Dispatch<SetStateAction<FilmDraft>>,
    prefix: string,
  ) => (
    <View style={styles.lensFields}>
      <TextInput
        onChangeText={(value) => handleFilmNameChange(value, prefix === 'create' ? 'create' : 'edit')}
        onBlur={() => handleFieldBlur(`${prefix}-film-name`)}
        onFocus={() => handleFieldFocus(`${prefix}-film-name`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-film-name`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Film stock name"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.name}
      />
      <TextInput
        keyboardType="number-pad"
        onChangeText={(value) => setDraft((current) => ({ ...current, nativeIso: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-film-nativeIso`)}
        onFocus={() => handleFieldFocus(`${prefix}-film-nativeIso`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-film-nativeIso`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Native ISO"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.nativeIso}
      />
      <TextInput
        multiline
        onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-film-notes`)}
        onFocus={() => handleFieldFocus(`${prefix}-film-notes`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-film-notes`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Notes"
        placeholderTextColor={colors.text.muted}
        style={[styles.input, styles.notesInput]}
        value={draft.notes}
      />
    </View>
  );

  const renderLensFields = (
    draft: LensDraft,
    setDraft: Dispatch<SetStateAction<LensDraft>>,
    prefix: string,
  ) => (
    <View style={styles.lensFields}>
      <TextInput
        onChangeText={(value) => handleLensNameChange(value, prefix === 'create' ? 'create' : 'edit')}
        onBlur={() => handleFieldBlur(`${prefix}-name`)}
        onFocus={() => handleFieldFocus(`${prefix}-name`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-name`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Lens name"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.name}
      />
      <View style={styles.dualFieldRow}>
        <TextInput
          onChangeText={(value) => setDraft((current) => ({ ...current, focalLength: value }))}
          onBlur={() => handleFieldBlur(`${prefix}-focalLength`)}
          onFocus={() => handleFieldFocus(`${prefix}-focalLength`)}
          onLayout={(event) =>
            registerFieldLayout(`${prefix}-focalLength`, {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          placeholder="Focal length"
          placeholderTextColor={colors.text.muted}
          style={[styles.input, styles.dualField]}
          value={draft.focalLength}
        />
        <View
          onLayout={(event) =>
            registerFieldLayout(`${prefix}-maxAperture`, {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          style={[styles.prefixedInput, styles.dualField]}
        >
          <Text style={styles.prefixedInputPrefix}>f/</Text>
          <TextInput
            onChangeText={(value) => setDraft((current) => ({ ...current, maxAperture: value }))}
            onBlur={() => handleFieldBlur(`${prefix}-maxAperture`)}
            onFocus={() => handleFieldFocus(`${prefix}-maxAperture`)}
            placeholder="2.8"
            placeholderTextColor={colors.text.muted}
            style={styles.prefixedInputField}
            value={draft.maxAperture}
          />
        </View>
      </View>
      <TextInput
        onChangeText={(value) => setDraft((current) => ({ ...current, mount: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-mount`)}
        onFocus={() => handleFieldFocus(`${prefix}-mount`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-mount`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Mount"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.mount}
      />
      <TextInput
        onChangeText={(value) => setDraft((current) => ({ ...current, serialOrNickname: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-serial`)}
        onFocus={() => handleFieldFocus(`${prefix}-serial`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-serial`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Serial or nickname"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={draft.serialOrNickname}
      />
      <TextInput
        multiline
        onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))}
        onBlur={() => handleFieldBlur(`${prefix}-notes`)}
        onFocus={() => handleFieldFocus(`${prefix}-notes`)}
        onLayout={(event) =>
          registerFieldLayout(`${prefix}-notes`, {
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          })
        }
        placeholder="Notes"
        placeholderTextColor={colors.text.muted}
        style={[styles.input, styles.notesInput]}
        value={draft.notes}
      />
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom + Math.max(keyboardOffset - insets.bottom, 0),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      onLayout={handleViewportLayout}
      onScroll={handleScroll}
      ref={scrollViewRef}
      scrollEventThrottle={16}
    >
      <Text style={styles.heading}>Gear Registry</Text>
      <Text style={styles.subheading}>
        Manage reusable {title.toLowerCase()} entries separately from the quick-select overlays.
      </Text>

      <View style={styles.typeTabs}>
        {gearTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setActiveType(type)}
            style={[styles.typeTab, activeType === type ? styles.typeTabActive : null]}
          >
            <Text style={activeType === type ? styles.typeTabTextActive : styles.typeTabText}>
              {type === 'film' ? 'Film' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add {title}</Text>
        {isLensType ? (
          <>
            {renderLensFields(lensDraft, setLensDraft, 'create')}
            <Text style={styles.metaText}>
              Focal length and max aperture auto-fill from the name when possible.
            </Text>
          </>
        ) : isCameraType ? (
          <>
            {renderCameraFields(cameraDraft, setCameraDraft, 'create')}
            <Text style={styles.metaText}>
              If typed as nickname (name), the camera nickname is parsed automatically.
            </Text>
          </>
        ) : isFilmType ? (
          <>
            {renderFilmFields(filmDraft, setFilmDraft, 'create')}
            <Text style={styles.metaText}>Native ISO auto-fills from the name when possible.</Text>
          </>
        ) : (
          <TextInput
            onChangeText={setDraftName}
            onBlur={() => handleFieldBlur('draftName')}
            onFocus={() => handleFieldFocus('draftName')}
            onLayout={(event) =>
              registerFieldLayout('draftName', {
                y: event.nativeEvent.layout.y,
                height: event.nativeEvent.layout.height,
              })
            }
            placeholder={`New ${title.toLowerCase()}`}
            placeholderTextColor={colors.text.muted}
            style={styles.input}
            value={draftName}
          />
        )}
        <Pressable
          onPress={() => void handleCreate()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Save {title}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{title} Items</Text>
        {loading ? <Text style={styles.metaText}>Loading...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {visibleItems.length === 0 && !loading ? <Text style={styles.metaText}>No items yet.</Text> : null}

        <View style={styles.list}>
          {visibleItems.map((item) => (
            <View
              key={item.id}
              style={styles.listItem}
            >
              {editingItemId === item.id ? (
                <>
                  {item.type === 'lens'
                    ? renderLensFields(editingLensDraft, setEditingLensDraft, `edit-${item.id}`)
                    : item.type === 'camera'
                      ? renderCameraFields(editingCameraDraft, setEditingCameraDraft, `edit-${item.id}`)
                    : item.type === 'film'
                      ? renderFilmFields(editingFilmDraft, setEditingFilmDraft, `edit-${item.id}`)
                    : (
                      <TextInput
                        onChangeText={setEditingName}
                        onBlur={() => handleFieldBlur(`edit-${item.id}`)}
                        onFocus={() => handleFieldFocus(`edit-${item.id}`)}
                        onLayout={(event) =>
                          registerFieldLayout(`edit-${item.id}`, {
                            y: event.nativeEvent.layout.y,
                            height: event.nativeEvent.layout.height,
                          })
                        }
                        placeholder="Rename item"
                        placeholderTextColor={colors.text.muted}
                        style={styles.input}
                        value={editingName}
                      />
                    )}
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => {
                        setEditingItemId(null);
                        setEditingName('');
                        setEditingCameraDraft(emptyCameraDraft());
                        setEditingLensDraft(emptyLensDraft());
                        setEditingFilmDraft(emptyFilmDraft());
                      }}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleSave()}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.itemName}>{getGearDisplayName(item)}</Text>
                  {item.type === 'camera' ? (
                    <View style={styles.metadataStack}>
                      {item.notes ? <Text style={styles.itemMeta}>Notes: {item.notes}</Text> : null}
                    </View>
                  ) : item.type === 'lens' ? (
                    <View style={styles.metadataStack}>
                      {item.focalLength ? <Text style={styles.itemMeta}>Focal length: {item.focalLength}</Text> : null}
                      {item.maxAperture ? <Text style={styles.itemMeta}>Max aperture: {item.maxAperture}</Text> : null}
                      {item.mount ? <Text style={styles.itemMeta}>Mount: {item.mount}</Text> : null}
                      {item.serialOrNickname ? (
                        <Text style={styles.itemMeta}>Serial / nickname: {item.serialOrNickname}</Text>
                      ) : null}
                      {item.notes ? <Text style={styles.itemMeta}>Notes: {item.notes}</Text> : null}
                    </View>
                  ) : item.type === 'film' ? (
                    <View style={styles.metadataStack}>
                      {item.nativeIso ? <Text style={styles.itemMeta}>Native ISO: {item.nativeIso}</Text> : null}
                      {item.notes ? <Text style={styles.itemMeta}>Notes: {item.notes}</Text> : null}
                    </View>
                  ) : null}
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => startEditing(item)}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          `Delete ${title.toLowerCase()}?`,
                          `"${getGearDisplayName(item)}" will be permanently removed from the gear registry.`,
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => void deleteItem(item.id),
                            },
                          ],
                        );
                      }}
                      style={styles.destructiveButton}
                    >
                      <Text style={styles.destructiveButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background.surface,
  },
  typeTabActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  typeTabText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    gap: 12,
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  lensFields: {
    gap: 10,
  },
  dualFieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dualField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prefixedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    backgroundColor: colors.background.canvas,
    paddingLeft: 14,
    paddingRight: 12,
  },
  prefixedInputPrefix: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '700',
  },
  prefixedInputField: {
    flex: 1,
    color: colors.text.primary,
    paddingLeft: 4,
    paddingVertical: 12,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  listItem: {
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 14,
    backgroundColor: colors.background.canvas,
  },
  itemName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  itemMeta: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  metadataStack: {
    gap: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.surface,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveButton: {
    borderRadius: 12,
    backgroundColor: colors.text.destructive,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  destructiveButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
