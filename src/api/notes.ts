export function createNoteId() {
  return (
    new Date().valueOf().toString(36) +
    Math.random()
      .toString(36)
      .substr(2)
  );
}
