// Asking the iPhone to keep the website app's data, and whether we run from the Home Screen icon.
let saidYes = false;

export async function requestPersist(): Promise<boolean> {
  saidYes = (await navigator.storage?.persist?.()) ?? false;
  return saidYes;
}

// Spike 1: persisted() can still say false on the first open right after persist() said yes.
export async function isProtected(): Promise<boolean> {
  return saidYes || ((await navigator.storage?.persisted?.()) ?? false);
}

export function isStandalone(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}
