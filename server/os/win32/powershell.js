export function buildForegroundWindowPowerShell(mode) {
  if (mode === 'toggle') {
    return `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
$hwnd = [NativeWin]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { exit 1 }
if ([NativeWin]::IsZoomed($hwnd)) {
  [void][NativeWin]::ShowWindow($hwnd, 9)
} else {
  [void][NativeWin]::ShowWindow($hwnd, 3)
}
`.trim();
  }

  return `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
}
"@
$hwnd = [NativeWin]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { exit 1 }
[void][NativeWin]::PostMessage($hwnd, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
`.trim();
}

export function buildTitleActivationPowerShell(titles = []) {
  const clauses = titles
    .map((title) => String(title).replace(/"/g, '\\"'))
    .map((title) => `if ($ws.AppActivate("${title}")) { "true"; exit 0 }`)
    .join('; ');

  return `$ws = New-Object -ComObject WScript.Shell; ${clauses}; exit 1`;
}

export function buildQrOverlayPowerShellScript({qrPath, size, posX, posY}) {
  const escapedQrPath = String(qrPath).replace(/\\/g, '\\\\');
  return [
    'Add-Type -AssemblyName System.Windows.Forms',
    'Add-Type -AssemblyName System.Drawing',
    '$form = New-Object Windows.Forms.Form',
    "$form.StartPosition = 'Manual'",
    '$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None',
    '$form.TopMost = $true',
    '$form.ShowInTaskbar = $false',
    `$form.Width = ${size}`,
    `$form.Height = ${size}`,
    `$form.Left = ${posX}`,
    `$form.Top = ${posY}`,
    '$picture = New-Object Windows.Forms.PictureBox',
    '$picture.Dock = [System.Windows.Forms.DockStyle]::Fill',
    '$picture.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::StretchImage',
    `$picture.Image = [System.Drawing.Image]::FromFile("${escapedQrPath}")`,
    '$form.Controls.Add($picture)',
    '[System.Windows.Forms.Application]::Run($form)',
  ].join('\n');
}
