import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { ClipboardCheck, Calendar, User, ShieldAlert, FileText, CheckCircle2, Circle } from 'lucide-react-native';
import { BottomSheet } from '../feedback/BottomSheet';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Task } from '../../types';

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  onToggleStatus: () => void;
  onReportIssue: () => void;
  onNotesSaved: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  task,
  onToggleStatus,
  onReportIssue,
  onNotesSaved,
}) => {
  const { colors, isDark } = useTheme();
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
    }
  }, [task]);

  if (!task) return null;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await StorageService.updateTaskDetails(task.id, {}, notes.trim());
      onNotesSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return { text: colors.danger, bg: colors.danger + '12' };
      case 'medium':
        return { text: colors.warning, bg: colors.warning + '12' };
      case 'low':
      default:
        return { text: colors.primary, bg: colors.primary + '12' };
    }
  };

  const priorityColors = getPriorityColor();
  const isCompleted = task.status === 'completed';

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Task Detail Specification">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="space-y-4">
        {/* Title and Status */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-4">
            <Text style={{ color: colors.text, fontFamily: 'Poppins_700Bold', fontSize: 18 }}>
              {task.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 }}>
              Category: {task.category.replace('_', ' ')} • {task.subcategory}
            </Text>
          </View>
          <View 
            style={{ 
              backgroundColor: isCompleted ? colors.success + '12' : colors.warning + '12',
            }}
            className="px-3 py-1.5 rounded-full flex-row items-center"
          >
            {isCompleted ? (
              <CheckCircle2 size={12} color={colors.success} className="mr-1" />
            ) : (
              <Circle size={12} color={colors.warning} className="mr-1" />
            )}
            <Text style={{ color: isCompleted ? colors.success : colors.warning, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
              {task.status}
            </Text>
          </View>
        </View>

        {/* Priority & Date Tags */}
        <View className="flex-row flex-wrap mb-2">
          {/* Priority */}
          <View 
            style={{ backgroundColor: priorityColors.bg, borderColor: priorityColors.text + '30', borderWidth: 1 }}
            className="px-2.5 py-1 rounded-full mr-2 mb-2"
          >
            <Text style={{ color: priorityColors.text, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
              {task.priority} Priority
            </Text>
          </View>

          {/* Due date if available */}
          <View 
            style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth: 1 }}
            className="px-2.5 py-1 rounded-full flex-row items-center mr-2 mb-2"
          >
            <Calendar size={10} color={colors.textSecondary} className="mr-1" />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10 }}>
              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}
            </Text>
          </View>
        </View>

        {/* Assignment & Status Info Box */}
        <View 
          style={{ 
            backgroundColor: colors.background,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
            borderWidth: 1 
          }}
          className="rounded-2xl p-4 space-y-3 mb-2"
        >
          {/* Assigned Worker */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <User size={16} color={colors.textSecondary} className="mr-2" />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                Assigned Employee
              </Text>
            </View>
            <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
              {task.assignedTo || 'Unassigned'}
            </Text>
          </View>

          {/* Completion status info */}
          {isCompleted && (
            <>
              <View className="h-[1px] bg-brown-200/5 dark:bg-white/5 my-2" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <ClipboardCheck size={16} color={colors.textSecondary} className="mr-2" />
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
                    Completed By
                  </Text>
                </View>
                <Text style={{ color: colors.text }} className="text-xs font-bold">
                  {task.completedBy || task.assignedTo}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <View className="flex-row items-center">
                  <Calendar size={16} color={colors.textSecondary} className="mr-2" />
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                    Completed At
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                  {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A'}
                </Text>
              </View>
            </>
          )}

          {/* Rescheduling metadata if present */}
          {task.rescheduledAt && (
            <>
              <View className="h-[1px] bg-brown-200/5 dark:bg-white/5 my-2" />
              <View className="space-y-1">
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: colors.warning }} className="text-[10px] font-black uppercase">
                    ⚠️ Rescheduled Task
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[10px]">
                    {new Date(task.rescheduledAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_400Regular', fontSize: 13, fontStyle: 'italic', marginTop: 6 }}>
                  "Rescheduled due to: {task.rescheduledReason}"
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Custom logged details if completed */}
        {isCompleted && task.details && Object.keys(task.details).length > 0 && (
          <View className="mb-2">
            <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
              Checklist Logged Parameters
            </Text>
            <View 
              style={{ 
                backgroundColor: colors.background, 
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1 
              }}
              className="rounded-2xl p-4 flex-row flex-wrap justify-between"
            >
              {Object.entries(task.details).map(([key, val]) => (
                <View key={key} className="w-[48%] mb-2">
                  <Text style={{ color: colors.textSecondary }} className="text-[10px] uppercase font-bold">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </Text>
                  <Text style={{ color: colors.text }} className="text-sm font-black mt-0.5">
                    {String(val)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Task Notes Section */}
        <View className="mb-2">
          <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>
            Task Notes
          </Text>
          <View className="flex-row items-end">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add observation notes for this task (e.g. animal condition, fuel log details)..."
              placeholderTextColor={colors.textSecondary + '70'}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
                flex: 1
              }}
              className="p-3 rounded-xl text-xs min-h-[50px] mr-2"
            />
            <Pressable
              onPress={handleSaveNotes}
              disabled={savingNotes}
              style={{ backgroundColor: colors.primary }}
              className="px-3.5 py-3.5 rounded-xl justify-center items-center active:scale-95 disabled:opacity-50"
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Save</Text>
            </Pressable>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 pt-2">
          {/* Toggle status */}
          <AppButton
            label={isCompleted ? 'Mark Pending' : 'Toggle Completed'}
            variant={isCompleted ? 'secondary' : 'primary'}
            onPress={onToggleStatus}
            className="flex-1"
          />

          {/* Report Issue button */}
          <AppButton
            label="Report Issue"
            variant="danger"
            icon={<ShieldAlert size={16} color="#FFFFFF" />}
            onPress={onReportIssue}
            className="flex-1 ml-3"
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};
