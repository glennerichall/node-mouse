import {execFileAsync} from '../../../utils/process.js';
import {commandExists} from '../process.js';

export function detectLinuxDisplayServer(env = process.env) {
  const sessionType = String(env.XDG_SESSION_TYPE || '').trim().toLowerCase();
  if (sessionType === 'wayland') return 'wayland';
  if (sessionType === 'x11') return 'x11';
  return 'unknown';
}

export function detectWaylandCompositor(env = process.env) {
  const desktop = String(env.XDG_CURRENT_DESKTOP || env.DESKTOP_SESSION || '').toLowerCase();
  if (env.SWAYSOCK || desktop.includes('sway')) return 'sway';
  if (env.HYPRLAND_INSTANCE_SIGNATURE || desktop.includes('hyprland')) return 'hyprland';
  if (desktop.includes('kde') || desktop.includes('plasma')) return 'kwin';
  if (desktop.includes('gnome') || desktop.includes('ubuntu')) return 'mutter';
  return 'unknown';
}

function matchesWindow(value, patterns) {
  const normalizedValue = String(value || '').toLowerCase();
  return patterns.some((pattern) => normalizedValue.includes(String(pattern).toLowerCase()));
}

function matchesSwayNode(node, query) {
  const classes = query.classes || [];
  const names = query.names || [];
  const classValues = [
    node.app_id,
    node.window_properties?.class,
    node.window_properties?.instance,
  ];
  return classValues.some((value) => matchesWindow(value, classes))
    || matchesWindow(node.name, names);
}

function findSwayNode(nodes, query) {
  for (const node of nodes || []) {
    if (matchesSwayNode(node, query)) return node;
    const child = findSwayNode([...(node.nodes || []), ...(node.floating_nodes || [])], query);
    if (child) return child;
  }
  return null;
}

async function focusSwayWindow(query) {
  if (!await commandExists('swaymsg')) return false;
  const tree = await execFileAsync('swaymsg', ['-t', 'get_tree']);
  if (!tree.ok) return false;

  let root;
  try {
    root = JSON.parse(tree.stdout);
  } catch {
    return false;
  }

  const node = findSwayNode([root], query);
  if (!node?.id) return false;
  return (await execFileAsync('swaymsg', [`[con_id="${node.id}"]`, 'focus'])).ok;
}

function matchesHyprlandClient(client, query) {
  const classes = query.classes || [];
  const names = query.names || [];
  return [client.class, client.initialClass].some((value) => matchesWindow(value, classes))
    || matchesWindow(client.title, names);
}

async function focusHyprlandWindow(query) {
  if (!await commandExists('hyprctl')) return false;
  const clients = await execFileAsync('hyprctl', ['-j', 'clients']);
  if (!clients.ok) return false;

  let windows;
  try {
    windows = JSON.parse(clients.stdout);
  } catch {
    return false;
  }

  const client = windows.find((entry) => matchesHyprlandClient(entry, query));
  if (!client?.address) return false;
  return (await execFileAsync('hyprctl', ['dispatch', 'focuswindow', `address:${client.address}`])).ok;
}

export async function focusWaylandWindow(query, env = process.env) {
  const compositor = detectWaylandCompositor(env);
  if (compositor === 'sway') return focusSwayWindow(query);
  if (compositor === 'hyprland') return focusHyprlandWindow(query);
  return false;
}
