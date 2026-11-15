// These setters run from the animation loop. Only write to DOM nodes on a state change.
export function setHidden(element, hidden) {
  if (element.hidden !== hidden) element.hidden = hidden;
}

export function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

export function setDisabled(element, disabled) {
  if (element.disabled !== disabled) element.disabled = disabled;
}
