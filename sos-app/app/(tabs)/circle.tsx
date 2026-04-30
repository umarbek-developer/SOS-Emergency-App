import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContactCard } from "@/components/ContactCard";
import { ContactFormSheet } from "@/components/ContactFormSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Section } from "@/components/Section";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Contact } from "@/types";

export default function CircleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts, upsertContact, removeContact } = useApp();
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const personal = useMemo(
    () => contacts.filter((c) => !c.isService),
    [contacts],
  );
  const services = useMemo(
    () => contacts.filter((c) => c.isService),
    [contacts],
  );
  const ready = personal.filter((c) => c.phone.trim().length > 0).length;

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setSheetOpen(true);
  };

  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="My Circle"
          subtitle={`${ready} of ${personal.length} contacts ready to be alerted`}
          right={
            <Pressable
              onPress={openAdd}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          }
        />

        <Section
          title="Trusted contacts"
          hint="They appear in the emergency screen so you can call them with one tap."
        >
          {personal.length === 0 ? (
            <EmptyHint text="Add the people you'd want by your side in an emergency." />
          ) : (
            personal.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onEdit={openEdit}
                onDelete={(target) => removeContact(target.id)}
              />
            ))
          )}
        </Section>

        <Section
          title="Emergency services"
          hint="Tap to call directly. Defaults work in most countries."
        >
          {services.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={openEdit}
              onDelete={(target) => removeContact(target.id)}
            />
          ))}
        </Section>
      </ScrollView>

      <ContactFormSheet
        visible={sheetOpen}
        initial={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={upsertContact}
      />
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.empty,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Feather name="user-plus" size={20} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 24,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  empty: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
});
