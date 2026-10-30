import { useEffect } from 'react';
import { useApp } from '../AppContext';
import { navigate, useRoute } from '../lib/router';

// 새 메모 ID를 먼저 발급하고 편집 화면으로 보낸다 (실제 문서는 내용이 생긴 뒤 저장)
export default function NewMemo() {
  const { store } = useApp();
  const { params } = useRoute();
  const category = params.get('c');
  useEffect(() => {
    const id = store.newMemoId();
    navigate(`/m/${id}?new=1${category ? `&c=${encodeURIComponent(category)}` : ''}`, { replace: true });
  }, [store, category]);
  return null;
}
