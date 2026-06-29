export function extractMessageText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (block.type === 'text') {
          return block.text;
        } else if (block.type === 'tool_use') {
          return `[Tool Use: ${block.name}]\nInput: ${JSON.stringify(block.input, null, 2)}`;
        }
        return '';
      })
      .filter(text => text.length > 0)
      .join('\n\n');
  }
  return '';
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export function getImageMediaType(file) {
  const mimeType = file.type;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/gif') return 'image/gif';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg'; // default
}
