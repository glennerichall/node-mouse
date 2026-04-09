export function buildAppWindowScript(appName, mode) {
  if (mode === 'toggle') {
    return `
tell application "${appName}" to activate
tell application "System Events"
  tell process "${appName}"
    if (count of windows) is 0 then return false
    set frontWindow to first window
    click (first button of frontWindow whose subrole is "AXZoomButton")
  end tell
end tell
return true
`.trim();
  }

  return `
tell application "${appName}" to activate
tell application "System Events"
  tell process "${appName}"
    if (count of windows) is 0 then return false
    click (first button of first window whose subrole is "AXCloseButton")
  end tell
end tell
return true
`.trim();
}

export function buildActiveWindowScript(mode) {
  if (mode === 'toggle') {
    return `
tell application "System Events"
  tell (first application process whose frontmost is true)
    if (count of windows) is 0 then return false
    set frontWindow to first window
    click (first button of frontWindow whose subrole is "AXZoomButton")
  end tell
end tell
return true
`.trim();
  }

  return `
tell application "System Events"
  tell (first application process whose frontmost is true)
    if (count of windows) is 0 then return false
    click (first button of first window whose subrole is "AXCloseButton")
  end tell
end tell
return true
`.trim();
}
