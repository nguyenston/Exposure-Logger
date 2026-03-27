type ParsedCameraMetadata = {
  name: string;
  nickname: string | null;
};

export function parseCameraMetadata(value: string): ParsedCameraMetadata {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      name: '',
      nickname: null,
    };
  }

  const match = trimmed.match(/^(.*)\((.*)\)\s*$/);
  if (!match) {
    return {
      name: trimmed,
      nickname: null,
    };
  }

  const nickname = match[1]?.trim() ?? '';
  const name = match[2]?.trim() ?? '';

  if (!nickname || !name) {
    return {
      name: trimmed,
      nickname: null,
    };
  }

  return {
    name,
    nickname,
  };
}
