// VND amounts in admin inputs read like prices do everywhere else:
// "3.000.000", grouped as they're typed. The form still submits plain
// digits (a hidden input next to the visible one), so actions parse the
// same numbers as before.

/** "3000000" → "3.000.000". Drops leading zeros, keeps a lone "0". */
export function groupDigits(digits: string): string {
  return digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Regroups what's in `input` after a keystroke and returns it, keeping the
 *  caret after the same digit (so editing the middle of "3.000.000" doesn't
 *  throw it to the end). */
export function regroupInput(input: HTMLInputElement): string {
  const caret = input.selectionStart ?? input.value.length;
  const digitsBefore = input.value.slice(0, caret).replace(/\D/g, "").length;
  const grouped = groupDigits(input.value.replace(/\D/g, ""));
  // After React has written the new value (and, when only a dot was
  // deleted and the digits didn't change, put the old value back) — both
  // move the caret to the end.
  setTimeout(() => {
    if (document.activeElement !== input) return;
    let pos = 0;
    for (let seen = 0; pos < grouped.length && seen < digitsBefore; pos++) {
      if (/\d/.test(grouped[pos])) seen++;
    }
    input.setSelectionRange(pos, pos);
  }, 0);
  return grouped;
}
