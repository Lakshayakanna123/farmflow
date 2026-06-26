export const COLORS = {
  background: '#FFF8E1',
  primary: '#2E7D32',
  secondaryGreen: '#81C784',
  lightGreen: '#A5D6A7',
  brown: '#8D6E63',
  white: '#FFFFFF',
  textMain: '#1A1A1A',
  textMuted: '#8D6E63',
  border: '#E0E0E0',
  surface: '#FFFFFF',
  cardAccent: '#F1F8ED',
  subtle: '#F5F5F3',
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700', color: COLORS.textMain, fontFamily: 'System' },
  h2: { fontSize: 22, fontWeight: '600', color: COLORS.textMain, fontFamily: 'System' },
  h3: { fontSize: 18, fontWeight: '600', color: COLORS.textMain, fontFamily: 'System' },
  body: { fontSize: 15, fontWeight: '400', color: COLORS.textMain, fontFamily: 'System' },
  bodyMedium: { fontSize: 14, fontWeight: '500', color: COLORS.textMain, fontFamily: 'System' },
  buttonText: { fontSize: 16, fontWeight: '600', color: COLORS.white, fontFamily: 'System' },
};

export const RADIUS = {
  card: 12,
  button: 8,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
};

export default { COLORS, TYPOGRAPHY, RADIUS, SHADOWS };
