import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useFinishWorkout } from '@/hooks/use-workouts';
import { ActiveExercise, useWorkoutStore } from '@/stores/workout-store';

function ExerciseCard({
  activeExercise,
  exerciseIndex,
}: {
  activeExercise: ActiveExercise;
  exerciseIndex: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { addSet, updateSet, removeSet, removeExercise } = useWorkoutStore();

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {activeExercise.exercise.name}
        </Text>
        <Pressable onPress={() => removeExercise(exerciseIndex)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.setHeaderRow}>
        <Text style={[styles.setHeaderCell, styles.setNumCol, { color: colors.textSecondary }]}>
          SET
        </Text>
        <Text style={[styles.setHeaderCell, styles.inputCol, { color: colors.textSecondary }]}>
          KG
        </Text>
        <Text style={[styles.setHeaderCell, styles.inputCol, { color: colors.textSecondary }]}>
          REPS
        </Text>
        <View style={styles.deleteCol} />
      </View>

      {activeExercise.sets.map((set, setIndex) => (
        <View key={setIndex} style={styles.setRow}>
          <Text style={[styles.setNum, styles.setNumCol, { color: colors.textSecondary }]}>
            {setIndex + 1}
          </Text>
          <TextInput
            style={[
              styles.setInput,
              styles.inputCol,
              { backgroundColor: colors.backgroundSelected, color: colors.text },
            ]}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={set.weightKg}
            onChangeText={(weightKg) => updateSet(exerciseIndex, setIndex, { weightKg })}
          />
          <TextInput
            style={[
              styles.setInput,
              styles.inputCol,
              { backgroundColor: colors.backgroundSelected, color: colors.text },
            ]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={set.reps}
            onChangeText={(reps) => updateSet(exerciseIndex, setIndex, { reps })}
          />
          <Pressable
            style={styles.deleteCol}
            onPress={() => removeSet(exerciseIndex, setIndex)}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.addSetButton} onPress={() => addSet(exerciseIndex)}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

export default function ActiveWorkoutScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { startedAt, exercises, reset } = useWorkoutStore();
  const finishWorkout = useFinishWorkout();

  const hasLoggedSets = exercises.some((e) =>
    e.sets.some((s) => parseInt(s.reps, 10) > 0)
  );

  function handleFinish() {
    if (!startedAt || !hasLoggedSets) return;

    finishWorkout.mutate(
      { startedAt, exercises },
      {
        onSuccess: ({ setCount }) => {
          reset();
          Alert.alert('Workout saved! 💪', `You logged ${setCount} sets. Keep it up!`);
          router.back();
        },
        onError: (error) => {
          Alert.alert('Could not save workout', error.message);
        },
      }
    );
  }

  function handleDiscard() {
    Alert.alert('Discard workout?', 'All logged sets will be lost.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {exercises.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first exercise to get started
            </Text>
          </View>
        )}

        {exercises.map((activeExercise, exerciseIndex) => (
          <ExerciseCard
            key={activeExercise.exercise.id}
            activeExercise={activeExercise}
            exerciseIndex={exerciseIndex}
          />
        ))}

        <Pressable
          style={[styles.addExerciseButton, { backgroundColor: colors.backgroundElement }]}
          onPress={() => router.push('/exercise-picker')}
        >
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </Pressable>
        <Pressable
          style={[
            styles.finishButton,
            (!hasLoggedSets || finishWorkout.isPending) && styles.buttonDisabled,
          ]}
          disabled={!hasLoggedSets || finishWorkout.isPending}
          onPress={handleFinish}
        >
          <Text style={styles.finishText}>
            {finishWorkout.isPending ? 'Saving…' : 'Finish Workout'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  setHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  setNumCol: {
    width: 32,
  },
  inputCol: {
    flex: 1,
  },
  deleteCol: {
    width: 24,
    alignItems: 'center',
  },
  setNum: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    borderRadius: 8,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 16,
    textAlign: 'center',
  },
  addSetButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  addSetText: {
    color: '#208AEF',
    fontWeight: '600',
    fontSize: 14,
  },
  addExerciseButton: {
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  addExerciseText: {
    color: '#208AEF',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  discardButton: {
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#E5484D',
    flex: 1,
  },
  discardText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  finishButton: {
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#30A46C',
    flex: 2,
  },
  finishText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
