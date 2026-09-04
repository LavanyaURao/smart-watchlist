/**
 * NSE market hours awareness (IST).
 * Regular session: 09:15 – 15:30 IST, Mon–Fri.
 * We freeze the last session after close — no fake 11pm "live" prints.
 */

export function isMarketOpen(now: Date = new Date()): boolean {
  // Convert to IST (UTC+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffsetMs);
  // Use UTC getters on the shifted date to read IST components
  const day = ist.getUTCDay(); // 0=Sun … 6=Sat
  if (day === 0 || day === 6) return false;

  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMins = hours * 60 + minutes;

  const openMins = 9 * 60 + 15; // 09:15
  const closeMins = 15 * 60 + 30; // 15:30

  return totalMins >= openMins && totalMins < closeMins;
}

export function getMarketStatusLabel(now: Date = new Date()): string {
  if (isMarketOpen(now)) {
    return "NSE open · live session";
  }
  // Weekend
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffsetMs);
  const day = ist.getUTCDay();
  if (day === 0 || day === 6) {
    return "Weekend · last session frozen";
  }
  return "After hours · last session frozen";
}

export function getISTTimeString(now: Date = new Date()): string {
  return now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
