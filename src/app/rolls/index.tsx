import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons/close-icon';
import { FilmRollIcon } from '@/components/icons/film-roll-icon';
import {
  buildRollFilterChips,
  filterRolls,
  getRollFilterOptions,
  hasActiveRollFilters,
  removeRollFilterChip,
  type RollSearchCriteria,
} from '@/features/rolls/roll-search';
import { useKeyboardOffset } from '@/lib/use-keyboard-offset';
import { useRolls } from '@/features/rolls/use-rolls';
import { useRollSearchStore } from '@/store/roll-search-store';
import { colors } from '@/theme/colors';
import type { Roll, RollStatus } from '@/types/domain';

type ActiveDateFilterField = 'startedFrom' | 'startedTo' | 'finishedFrom' | 'finishedTo' | null;
type ActiveFilterPicker = 'camera' | 'filmStock' | null;

function sortRolls(rolls: Roll[]) {
  return [...rolls].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function RollSection({
  title,
  subtitle,
  rolls,
}: {
  title: string;
  subtitle: string;
  rolls: Roll[];
}) {
  if (rolls.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{rolls.length}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {sortRolls(rolls).map((roll) => (
        <Link
          asChild
          key={roll.id}
          href={`/rolls/${roll.id}`}
        >
          <Pressable style={styles.rollCard}>
            <View style={styles.rollGlyph}>
              <FilmRollIcon size={30} />
            </View>
            <View style={styles.rollCopy}>
              <Text style={styles.rollNickname}>{roll.nickname ?? 'Untitled Roll'}</Text>
              <View style={styles.rollMetaBlock}>
                <Text style={styles.rollMetaLine}>{roll.filmStock}</Text>
                <Text style={styles.rollMetaLine}>{roll.camera}</Text>
              </View>
            </View>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

function toggleSelection(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

function parseDateOnlyValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnlyValue(value: string) {
  const parsed = parseDateOnlyValue(value);
  if (!parsed) {
    return '';
  }

  return parsed.toLocaleDateString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function FilterToggleRow({
  label,
  values,
  selectedValues,
  onToggle,
}: {
  label: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{label}</Text>
      <View style={styles.filterChipRow}>
        {values.map((value) => {
          const selected = selectedValues.includes(value);
          return (
            <Pressable
              key={value}
              onPress={() => onToggle(value)}
              style={[styles.filterToggleChip, selected ? styles.filterToggleChipActive : null]}
            >
              <Text
                style={selected ? styles.filterToggleChipTextActive : styles.filterToggleChipText}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SearchableMultiSelectField({
  label,
  placeholder,
  selectedValues,
  onPress,
}: {
  label: string;
  placeholder: string;
  selectedValues: string[];
  onPress: () => void;
}) {
  const displayValue =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} selected`;

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[styles.input, styles.selectFieldButton]}
      >
        <Text style={selectedValues.length > 0 ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
          {displayValue}
        </Text>
      </Pressable>
    </View>
  );
}

function DateRangeFields({
  label,
  fromValue,
  toValue,
  onPick,
  onClear,
}: {
  label: string;
  fromValue: string;
  toValue: string;
  onPick: (field: 'from' | 'to') => void;
  onClear: (field: 'from' | 'to') => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{label}</Text>
      <View style={styles.dualInputRow}>
        <View style={styles.dateFieldWrapper}>
          <View style={[styles.input, styles.dualInput, styles.dateFieldButton]}>
            <Pressable
              onPress={() => onPick('from')}
              style={styles.dateFieldPressable}
            >
              <Text style={fromValue ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
                {fromValue ? formatDateOnlyValue(fromValue) : 'From date'}
              </Text>
            </Pressable>
            {fromValue ? (
              <Pressable
                onPress={() => onClear('from')}
                style={styles.dateFieldInlineClear}
              >
                <CloseIcon />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.dateFieldWrapper}>
          <View style={[styles.input, styles.dualInput, styles.dateFieldButton]}>
            <Pressable
              onPress={() => onPick('to')}
              style={styles.dateFieldPressable}
            >
              <Text style={toValue ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
                {toValue ? formatDateOnlyValue(toValue) : 'To date'}
              </Text>
            </Pressable>
            {toValue ? (
              <Pressable
                onPress={() => onClear('to')}
                style={styles.dateFieldInlineClear}
              >
                <CloseIcon />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RollsScreen() {
  const insets = useSafeAreaInsets();
  const keyboardOffset = useKeyboardOffset();
  const { rolls, loading, error } = useRolls();
  const criteria = useRollSearchStore((state) => state.criteria);
  const setCriteria = useRollSearchStore((state) => state.setCriteria);
  const updateCriteria = useRollSearchStore((state) => state.updateCriteria);
  const clearCriteria = useRollSearchStore((state) => state.clearCriteria);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDateFilterField, setActiveDateFilterField] = useState<ActiveDateFilterField>(null);
  const [activeFilterPicker, setActiveFilterPicker] = useState<ActiveFilterPicker>(null);
  const [filterOptionQuery, setFilterOptionQuery] = useState('');

  const filteredRolls = useMemo(() => filterRolls(rolls, criteria), [criteria, rolls]);
  const groupedFilteredRolls = useMemo(
    () => ({
      active: filteredRolls.filter((roll) => roll.status === 'active'),
      finished: filteredRolls.filter((roll) => roll.status === 'finished'),
      archived: filteredRolls.filter((roll) => roll.status === 'archived'),
    }),
    [filteredRolls],
  );
  const filterOptions = useMemo(() => getRollFilterOptions(rolls), [rolls]);
  const activeChips = useMemo(() => buildRollFilterChips(criteria), [criteria]);
  const hasFilters = hasActiveRollFilters(criteria);
  const modalBottomOffset = Math.max(keyboardOffset - insets.bottom, 0);
  const filterPickerOptions = useMemo(() => {
    const source =
      activeFilterPicker === 'camera'
        ? filterOptions.cameras
        : activeFilterPicker === 'filmStock'
          ? filterOptions.filmStocks
          : [];
    const normalizedQuery = filterOptionQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return source;
    }

    return source.filter((value) => value.toLowerCase().includes(normalizedQuery));
  }, [activeFilterPicker, filterOptionQuery, filterOptions.cameras, filterOptions.filmStocks]);

  const handleDateFilterChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !activeDateFilterField || !selectedDate) {
      setActiveDateFilterField(null);
      return;
    }

    const nextValue = selectedDate.toISOString().slice(0, 10);
    updateCriteria({
      [activeDateFilterField]: nextValue,
    } as Partial<RollSearchCriteria>);
    setActiveDateFilterField(null);
  };

  const handleCloseFilterPicker = () => {
    setActiveFilterPicker(null);
    setFilterOptionQuery('');
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.heading}>Rolls</Text>
            <Text style={styles.subheading}>Active, finished, and archived rolls live here.</Text>
          </View>
          <Link
            href="/rolls/new"
            style={styles.createLink}
          >
            New Roll
          </Link>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => updateCriteria({ query: value })}
            placeholder="Search rolls"
            placeholderTextColor={colors.text.muted}
            style={[styles.input, styles.searchInput]}
            value={criteria.query}
          />
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={[styles.filterButton, hasFilters ? styles.filterButtonActive : null]}
          >
            <Text style={hasFilters ? styles.filterButtonTextActive : styles.filterButtonText}>
              Filter
            </Text>
          </Pressable>
        </View>

        {activeChips.length > 0 ? (
          <View style={styles.activeChipsRow}>
            {activeChips.map((chip) => (
              <Pressable
                key={chip.key}
                onPress={() => setCriteria(removeRollFilterChip(criteria, chip.key))}
                style={styles.activeChip}
              >
                <Text style={styles.activeChipText}>{chip.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={clearCriteria}
              style={styles.clearChip}
            >
              <Text style={styles.clearChipText}>Clear all</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? <Text style={styles.metaText}>Loading rolls...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && rolls.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No rolls yet</Text>
            <Text style={styles.emptyText}>Create your first roll to start organizing exposures.</Text>
          </View>
        ) : null}
        {!loading && rolls.length > 0 && filteredRolls.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching rolls</Text>
            <Text style={styles.emptyText}>Try a broader search or clear the active filters.</Text>
            <Pressable
              onPress={clearCriteria}
              style={styles.emptyAction}
            >
              <Text style={styles.emptyActionText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : null}

        <RollSection
          title="Active"
          subtitle="Rolls you are currently shooting."
          rolls={groupedFilteredRolls.active}
        />
        <RollSection
          title="Finished"
          subtitle="Completed rolls waiting for reference or export."
          rolls={groupedFilteredRolls.finished}
        />
        <RollSection
          title="Archived"
          subtitle="Older rolls kept for long-term browsing."
          rolls={groupedFilteredRolls.archived}
        />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={filterOpen}
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          onPress={() => setFilterOpen(false)}
          style={styles.modalRoot}
        >
          <View style={styles.modalBackdrop} />
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.modalCard,
              {
                marginBottom: modalBottomOffset,
              },
            ]}
          >
            <ScrollView
              bounces={false}
              contentContainerStyle={[
                styles.modalContent,
                {
                  paddingBottom: 5 + insets.bottom,
                },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Roll Filters</Text>

              <FilterToggleRow
                label="Status"
                values={['active', 'finished', 'archived']}
                selectedValues={criteria.status}
                onToggle={(value) =>
                  updateCriteria({
                    status: toggleSelection(criteria.status, value as RollStatus) as RollStatus[],
                  })
                }
              />

              <SearchableMultiSelectField
                label="Camera"
                placeholder="Select cameras"
                selectedValues={criteria.camera}
                onPress={() => setActiveFilterPicker('camera')}
              />

              <SearchableMultiSelectField
                label="Film Stock"
                placeholder="Select film stocks"
                selectedValues={criteria.filmStock}
                onPress={() => setActiveFilterPicker('filmStock')}
              />

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Shot ISO</Text>
                <View style={styles.dualInputRow}>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateCriteria({ shotIsoMin: value })}
                    placeholder="Min shot ISO"
                    placeholderTextColor={colors.text.muted}
                    style={[styles.input, styles.dualInput]}
                    value={criteria.shotIsoMin}
                  />
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateCriteria({ shotIsoMax: value })}
                    placeholder="Max shot ISO"
                    placeholderTextColor={colors.text.muted}
                    style={[styles.input, styles.dualInput]}
                    value={criteria.shotIsoMax}
                  />
                </View>
              </View>

              <DateRangeFields
                label="Started"
                fromValue={criteria.startedFrom}
                toValue={criteria.startedTo}
                onPick={(field) => setActiveDateFilterField(field === 'from' ? 'startedFrom' : 'startedTo')}
                onClear={(field) =>
                  updateCriteria(field === 'from' ? { startedFrom: '' } : { startedTo: '' })
                }
              />

              <DateRangeFields
                label="Finished"
                fromValue={criteria.finishedFrom}
                toValue={criteria.finishedTo}
                onPick={(field) => setActiveDateFilterField(field === 'from' ? 'finishedFrom' : 'finishedTo')}
                onClear={(field) =>
                  updateCriteria(field === 'from' ? { finishedFrom: '' } : { finishedTo: '' })
                }
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={clearCriteria}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Clear all</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterOpen(false)}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {activeDateFilterField ? (
        <DateTimePicker
          mode="date"
          value={parseDateOnlyValue(criteria[activeDateFilterField]) ?? new Date()}
          onChange={handleDateFilterChange}
        />
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={activeFilterPicker !== null}
        onRequestClose={handleCloseFilterPicker}
      >
        <Pressable
          onPress={handleCloseFilterPicker}
          style={styles.modalRoot}
        >
          <View style={styles.modalBackdrop} />
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.optionPickerCard,
              {
                marginBottom: modalBottomOffset,
                paddingBottom: 5 + insets.bottom,
              },
            ]}
          >
            <Text style={styles.modalTitle}>
              {activeFilterPicker === 'camera' ? 'Camera Filter' : 'Film Stock Filter'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setFilterOptionQuery}
              placeholder={
                activeFilterPicker === 'camera' ? 'Search cameras' : 'Search film stocks'
              }
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              value={filterOptionQuery}
            />
            <ScrollView
              bounces={false}
              contentContainerStyle={[
                styles.optionPickerList,
                {
                  paddingBottom: 5,
                },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              {filterPickerOptions.map((value) => {
                const selected =
                  activeFilterPicker === 'camera'
                    ? criteria.camera.includes(value)
                    : criteria.filmStock.includes(value);

                return (
                  <Pressable
                    key={value}
                    onPress={() =>
                      updateCriteria(
                        activeFilterPicker === 'camera'
                          ? { camera: toggleSelection(criteria.camera, value) }
                          : { filmStock: toggleSelection(criteria.filmStock, value) },
                      )
                    }
                    style={[styles.optionPickerItem, selected ? styles.optionPickerItemActive : null]}
                  >
                    <Text
                      style={selected ? styles.optionPickerItemTextActive : styles.optionPickerItemText}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
              {filterPickerOptions.length === 0 ? (
                <Text style={styles.metaText}>
                  {filterOptionQuery.trim() ? 'No matches for this search.' : 'No options available yet.'}
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() =>
                  updateCriteria(activeFilterPicker === 'camera' ? { camera: [] } : { filmStock: [] })
                }
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={handleCloseFilterPicker}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  createLink: {
    color: colors.background.surface,
    backgroundColor: colors.text.accent,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  searchInput: {
    flex: 1,
  },
  filterButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterButtonActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  filterButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  activeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeChipText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  clearChip: {
    borderRadius: 999,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearChipText: {
    color: colors.background.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCount: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  rollCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    padding: 16,
  },
  rollGlyph: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rollCopy: {
    flex: 1,
    gap: 4,
  },
  rollNickname: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  rollMetaBlock: {
    gap: 2,
    paddingLeft: 8,
  },
  rollMetaLine: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 18,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyActionText: {
    color: colors.background.surface,
    fontSize: 13,
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  modalCard: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background.surface,
  },
  modalContent: {
    gap: 16,
    padding: 20,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  filterGroup: {
    gap: 10,
  },
  filterGroupTitle: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterToggleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterToggleChipActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  filterToggleChipText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterToggleChipTextActive: {
    color: colors.background.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  selectFieldButton: {
    minHeight: 48,
    justifyContent: 'center',
  },
  selectFieldValue: {
    color: colors.text.primary,
    fontSize: 14,
  },
  selectFieldPlaceholder: {
    color: colors.text.muted,
    fontSize: 14,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dualInput: {
    flex: 1,
  },
  dateFieldWrapper: {
    flex: 1,
    gap: 6,
  },
  dateFieldButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  dateFieldValue: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  dateFieldPlaceholder: {
    color: colors.text.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  dateFieldInlineClear: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  optionPickerCard: {
    maxHeight: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background.surface,
    padding: 20,
    gap: 16,
  },
  optionPickerList: {
    gap: 8,
  },
  optionPickerItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionPickerItemActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  optionPickerItemText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionPickerItemTextActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
