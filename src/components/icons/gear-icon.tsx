import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type GearIconProps = {
  size?: number;
  color?: string;
};

export function GearIcon({
  size = 20,
  color = colors.text.accent,
}: GearIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.48 7.48 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.49-.42H10.1a.5.5 0 00-.49.42l-.36 2.54c-.58.22-1.12.54-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.13.23.39.32.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.22 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58z"
        fill={color}
      />
      <Circle
        cx={12}
        cy={12}
        r={3.1}
        fill={colors.background.surface}
      />
    </Svg>
  );
}
