import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { fonts } from '../theme/tokens';
import { timeAgo } from '../lib/timeAgo';
import * as haptics from '../lib/haptics';

export interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  user_name: string | null;
  user_handle: string | null;
}

interface Props {
  logId: string | null;
  logTitle: string;
  onClose: () => void;
  onCountChange?: (logId: string, count: number) => void;
}


export default function CommentSheet({ logId, logTitle, onClose, onCountChange }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const fetchComments = useCallback(async () => {
    if (!logId) return;
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select(`id, user_id, body, created_at, users!inner(name, handle)`)
      .eq('log_id', logId)
      .order('created_at', { ascending: true });

    const mapped: Comment[] = (data ?? []).map((c: any) => ({
      id:          c.id,
      user_id:     c.user_id,
      body:        c.body,
      created_at:  c.created_at,
      user_name:   c.users?.name ?? null,
      user_handle: c.users?.handle ?? null,
    }));
    setComments(mapped);
    setLoading(false);
    onCountChange?.(logId, mapped.length);
  }, [logId, onCountChange]);

  useEffect(() => {
    if (logId) {
      setComments([]);
      setBody('');
      fetchComments();
    }
  }, [logId]);

  const handlePost = async () => {
    if (!user || !logId || !body.trim()) return;
    setPosting(true);
    setPostError(null);
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, log_id: logId, body: body.trim() })
      .select(`id, user_id, body, created_at, users!inner(name, handle)`)
      .single();

    if (!error && data) {
      const newComment: Comment = {
        id:          data.id,
        user_id:     data.user_id,
        body:        data.body,
        created_at:  data.created_at,
        user_name:   (data.users as any)?.[0]?.name ?? null,
        user_handle: (data.users as any)?.[0]?.handle ?? null,
      };
      const updated = [...comments, newComment];
      setComments(updated);
      onCountChange?.(logId, updated.length);
      setBody('');
      haptics.success();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else if (error) {
      haptics.warn();
      setPostError('Failed to post. Try again.');
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    const previous = comments;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    if (logId) onCountChange?.(logId, updated.length);
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      setComments(previous);
      if (logId) onCountChange?.(logId, previous.length);
      haptics.warn();
    } else {
      haptics.tapHeavy();
    }
  };

  return (
    <Modal
      visible={!!logId}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[sheet.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[sheet.header, { borderBottomColor: colors.border }]}>
          <View style={sheet.headerText}>
            <Text style={[sheet.heading, { color: colors.ink, fontFamily: fonts.display }]}>COMMENTS</Text>
            <Text style={[sheet.subheading, { color: colors.ink3, fontFamily: fonts.body }]} numberOfLines={1}>
              {logTitle}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
            <Text style={[sheet.closeBtnText, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Comments list */}
          <ScrollView
            ref={scrollRef}
            style={sheet.list}
            contentContainerStyle={sheet.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
            ) : comments.length === 0 ? (
              <View style={sheet.empty}>
                <Text style={[sheet.emptyTitle, { color: colors.ink, fontFamily: fonts.display }]}>
                  NO COMMENTS YET
                </Text>
                <Text style={[sheet.emptySub, { color: colors.ink3, fontFamily: fonts.body }]}>
                  Be the first to say something.
                </Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={[sheet.commentRow, { borderBottomColor: colors.border }]}>
                  <View style={[sheet.commentAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={[sheet.commentAvatarText, { color: colors.bg, fontFamily: fonts.display }]}>
                      {(c.user_name ?? c.user_handle ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={sheet.commentContent}>
                    <View style={sheet.commentMeta}>
                      <Text style={[sheet.commentHandle, { color: colors.ink3, fontFamily: fonts.mono }]}>
                        {c.user_id === user?.id ? 'YOU' : `@${c.user_handle ?? c.user_name ?? 'unknown'}`}
                      </Text>
                      <Text style={[sheet.commentTime, { color: colors.ink3, fontFamily: fonts.mono }]}>
                        {timeAgo(c.created_at)}
                      </Text>
                    </View>
                    <Text style={[sheet.commentBody, { color: colors.ink, fontFamily: fonts.bodyRoman }]}>
                      {c.body}
                    </Text>
                    {c.user_id === user?.id && (
                      <TouchableOpacity onPress={() => Alert.alert(
                        'Delete comment',
                        'Remove this comment?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(c.id) },
                        ],
                      )}>
                        <Text style={[sheet.deleteText, { color: colors.ink3, fontFamily: fonts.mono }]}>DELETE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Post error */}
          {postError && (
            <Text style={[sheet.postError, { color: colors.terra, fontFamily: fonts.mono }]}>
              {postError}
            </Text>
          )}

          {/* Input bar */}
          <View style={[sheet.inputBar, { borderTopColor: colors.border, backgroundColor: colors.bg2 }]}>
            <TextInput
              style={[sheet.input, { color: colors.ink, fontFamily: fonts.ui, borderColor: colors.border2 }]}
              value={body}
              onChangeText={setBody}
              placeholder="Add a comment…"
              placeholderTextColor={colors.ink3}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[sheet.postBtn, { backgroundColor: body.trim() ? colors.accent : colors.border2 }]}
              onPress={handlePost}
              disabled={!body.trim() || posting}
              activeOpacity={0.8}
            >
              {posting
                ? <ActivityIndicator size="small" color={colors.bg} />
                : <Text style={[sheet.postBtnText, { color: colors.bg, fontFamily: fonts.mono }]}>POST</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerText: { flex: 1, gap: 2 },
  heading: { fontSize: 22, letterSpacing: 4 },
  subheading: { fontSize: 13, fontStyle: 'italic' },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 16 },

  list: { flex: 1 },
  listContent: { paddingVertical: 8 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, letterSpacing: 3 },
  emptySub: { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },

  commentRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 24,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  commentAvatarText: { fontSize: 13 },
  commentContent: { flex: 1, gap: 4 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentHandle: { fontSize: 10, letterSpacing: 1 },
  commentTime: { fontSize: 9, letterSpacing: 0.5 },
  commentBody: { fontSize: 15, lineHeight: 21 },
  deleteText: { fontSize: 8, letterSpacing: 1.5, marginTop: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 2,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, maxHeight: 100, minHeight: 42,
  },
  postBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  postBtnText: { fontSize: 11, letterSpacing: 2 },
  postError: { fontSize: 9, letterSpacing: 1, paddingHorizontal: 16, paddingBottom: 6 },
});
