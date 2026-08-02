import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SPECIES_DISCLAIMER, type SpeciesGuide } from '../logs/species';
import { useTheme } from '../theme/ThemeProvider';
import { Badge, Body, Card, Label, Row, Title } from './ui';

/** Kartu panduan husbandry per spesies, tertutup secara default agar tidak berisik. */
export function SpeciesGuideCard({ guide }: { guide: SpeciesGuide }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Pressable onPress={() => setOpen(value => !value)}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ flex: 1 }}>
            <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Title style={{ fontSize: 15 }}>Panduan {guide.label}</Title>
              <Body muted style={{ fontSize: 12, fontStyle: 'italic' }}>
                {guide.scientific}
              </Body>
            </View>
          </Row>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textMuted}
          />
        </Row>
      </Pressable>

      {open ? (
        <View style={{ gap: 12, marginTop: 6 }}>
          <View style={{ gap: 6 }}>
            <GuideRow icon="thermometer-outline" label="Basking" value={guide.baskingC} />
            <GuideRow icon="partly-sunny-outline" label="Ambient" value={guide.ambientC} />
            <GuideRow icon="water-outline" label="Kelembapan" value={guide.humidity} />
            <GuideRow icon="sunny-outline" label="UVB" value={guide.uvb} />
            <GuideRow icon="nutrition-outline" label="Suplemen" value={guide.supplement} />
          </View>

          <View style={{ gap: 6 }}>
            <Label>Pakan utama</Label>
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {guide.staple.map(item => (
                <Badge key={item} tone="success" text={item} />
              ))}
            </Row>
          </View>

          <View style={{ gap: 6 }}>
            <Label>Hindari</Label>
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {guide.avoid.map(item => (
                <Badge key={item} tone="danger" text={item} />
              ))}
            </Row>
          </View>

          <Body style={{ fontSize: 13 }}>{guide.note}</Body>
          <Body muted style={{ fontSize: 11 }}>
            {SPECIES_DISCLAIMER}
          </Body>
        </View>
      ) : null}
    </Card>
  );
}

function GuideRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <Row style={{ gap: 10 }}>
      <Ionicons name={icon} size={15} color={theme.colors.textMuted} />
      <Body muted style={{ fontSize: 13, width: 92 }}>
        {label}
      </Body>
      <Body style={{ flex: 1, fontSize: 13 }}>{value}</Body>
    </Row>
  );
}
