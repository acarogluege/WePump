import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useExercises } from '@/hooks/use-exercises';
import { useWorkoutStore } from '@/stores/workout-store';
import { Exercise, MuscleGroup } from '@/types/database';

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: '🫁 Chest',
  back: '🔙 Back',
  shoulders: '🪨 Shoulders',
  biceps: '💪 Biceps',
  triceps: '🦾 Triceps',
  legs: '🦵 Legs',
  core: '🧱 Core',
  cardio: '🏃 Cardio',
  full_body: '🔥 Full Body',
};

const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
  'full_body',
];

export default function ExercisePickerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { data: exercises, isPending, error } = useExercises();
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const activeExercises = useWorkoutStore((s) => s.exercises);
  const pickedIds = useMemo(
    () => activeExercises.map((e) => e.exercise.id),
    [activeExercises]
  );
  const [search, setSearch] = useState('');

  const sections = useMemo(() => {
    if (!exercises) return [];
    const query = search.trim().toLowerCase();
    const filtered = query
      ? exercises.filter((e) => e.name.toLowerCase().includes(query))
      : exercises;

    return MUSCLE_GROUP_ORDER.map((group) => ({
      title: MUSCLE_GROUP_LABELS[group],
      data: filtered.filter((e) => e.muscle_group === group),
    })).filter((section) => section.data.length > 0);
  }, [exercises, search]);

  function handlePick(exercise: Exercise) {
    addExercise(exercise);
    router.back();
  }

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load exercises.</Text>
        <Text style={{ color: colors.textSecondary }}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.search,
          { backgroundColor: colors.backgroundElement, color: colors.text },
        ]}
        placeholder="Search exercises…"
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const alreadyPicked = pickedIds.includes(item.id);
          return (
            <Pressable
              style={[
                styles.row,
                { backgroundColor: colors.backgroundElement },
                alreadyPicked && styles.rowDisabled,
              ]}
              disabled={alreadyPicked}
              onPress={() => handlePick(item)}
            >
              <Text style={[styles.rowName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.rowEquipment, { color: colors.textSecondary }]}>
                {alreadyPicked ? 'Added ✓' : item.equipment ?? ''}
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  search: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  list: {
    paddingBottom: Spacing.six,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.one,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  rowEquipment: {
    fontSize: 13,
  },
});
