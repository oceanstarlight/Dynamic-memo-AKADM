// Firebase Storage 없이 메모 문서에 바로 넣을 수 있게 이미지를 줄여 data URL로 만든다
// (Firestore 문서 한도 1MB를 고려해 장당 대략 250KB 이하로)
const MAX_SIDE = 1400;
const TARGET_BYTES = 250 * 1024;

export async function fileToCompressedDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  let side = MAX_SIDE;
  let quality = 0.82;
  let dataUrl = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL('image/webp', quality);
    if (dataUrl.length * 0.75 <= TARGET_BYTES) break;
    side = Math.round(side * 0.8);
    quality = Math.max(0.5, quality - 0.08);
  }
  bitmap.close?.();
  return dataUrl;
}
