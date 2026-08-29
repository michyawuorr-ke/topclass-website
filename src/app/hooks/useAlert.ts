import { useState } from 'react';

export function useAlert() {
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const alert = (msg: string) => { setSystemAlert(msg); setTimeout(() => setSystemAlert(null), 3000); };
  return { systemAlert, alert };
}

