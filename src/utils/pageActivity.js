export const isPageActive = () => (
  document.visibilityState === 'visible' && document.hasFocus()
)
