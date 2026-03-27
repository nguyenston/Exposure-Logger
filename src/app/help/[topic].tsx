import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type HelpTopic = 'roll-detail' | 'new-exposure' | 'edit-exposure' | 'gear-registry';

type HelpSection = {
  title: string;
  bullets: string[];
};

type HelpContent = {
  title: string;
  sections: HelpSection[];
};

const HELP_CONTENT: Record<HelpTopic, HelpContent> = {
  'roll-detail': {
    title: 'Roll Detail Help',
    sections: [
      {
        title: 'Key actions',
        bullets: [
          'Use the add controls to open quick add or voice-first quick add.',
          'Use the share button to export the current roll as CSV or PDF.',
          'Use Show All to expand from the compact preview into the full exposure list.',
        ],
      },
      {
        title: 'Shortcuts',
        bullets: [
          'Swipe the collapsed exposure preview left or right to browse frames.',
          'The page badge shows which frame preview you are currently looking at.',
          'Hardware volume up opens New Exposure and starts voice recording automatically.',
        ],
      },
    ],
  },
  'new-exposure': {
    title: 'New Exposure Help',
    sections: [
      {
        title: 'Key actions',
        bullets: [
          'The main button is the only save action.',
        ],
      },
      {
        title: 'Voice and hardware',
        bullets: [
          'Voice dictation can fill f-stop, shutter, lens, notes, and frame target.',
          'Volume up toggles voice recording on this screen.',
          'Volume down saves using the currently selected target frame.',
        ],
      },
      {
        title: 'Dictation examples',
        bullets: [
          'Use "f 4" for aperture.',
          'Use "shutter 500" or "at 500" for shutter speed.',
          'Use "lens lens name" to set the lens. The spoken lens name is matched to the closest registered lens.',
          'Use "frame frame number" to set the target frame before saving.',
          'Use "notes note text" to append to notes.',
          'Use "notes replace note text" to overwrite notes.',
          'You can chain these phrases together, but notes must come last. Everything after "notes" is captured verbatim.',
        ],
      },
    ],
  },
  'edit-exposure': {
    title: 'Edit Exposure Help',
    sections: [
      {
        title: 'Key actions',
        bullets: [
          'Adjust exposure values, timestamp, location, and notes, then save.',
        ],
      },
      {
        title: 'Voice and hardware',
        bullets: [
          'Voice dictation can update exposure fields on the edit screen.',
          'Volume up toggles voice recording.',
          'Volume down saves the current edit.',
        ],
      },
      {
        title: 'Dictation examples',
        bullets: [
          'Use "f 4" for aperture.',
          'Use "shutter 500" or "at 500" for shutter speed.',
          'Use "lens lens name" to set the lens. The spoken lens name is matched to the closest registered lens.',
          'Use "notes note text" to append to notes.',
          'Use "notes replace note text" to overwrite notes.',
          'You can chain these phrases together, but notes must come last. Everything after "notes" is captured verbatim.',
          'Spoken "frame" commands are ignored on edit and only affect New Exposure.',
        ],
      },
    ],
  },
  'gear-registry': {
    title: 'Gear Registry Help',
    sections: [
      {
        title: 'Key actions',
        bullets: [
          'Use the registry to edit, rename, or delete stored gear entries.',
          'Selectors elsewhere in the app stay focused on search, selection, and quick create.',
          'Lens and film entries support richer metadata than camera entries.',
        ],
      },
      {
        title: 'Metadata',
        bullets: [
          'Lens name is the main display label, with focal length and max aperture auto-filled when possible.',
          'Film stock name is the main display label, with native ISO auto-filled when possible.',
          'Mount, serial or nickname, and notes are optional registry-only details.',
        ],
      },
    ],
  },
};

export default function HelpTopicScreen() {
  const insets = useSafeAreaInsets();
  const { topic } = useLocalSearchParams<{ topic?: string }>();

  const content = useMemo(() => {
    if (!topic) {
      return null;
    }

    return HELP_CONTENT[topic as HelpTopic] ?? null;
  }, [topic]);

  if (!content) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.errorText}>Help page not found.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom,
        },
      ]}
    >
      <Text style={styles.heading}>{content.title}</Text>

      {content.sections.map((section) => (
        <View
          key={section.title}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>{section.title}</Text>
          <View style={styles.list}>
            {section.bullets.map((bullet) => (
              <View
                key={bullet}
                style={styles.listRow}
              >
                <Text style={styles.listBullet}>-</Text>
                <Text style={styles.listText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
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
  card: {
    gap: 12,
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  listBullet: {
    color: colors.text.accent,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 15,
    lineHeight: 22,
  },
});
