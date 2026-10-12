// The predev hook rebuilds native components. Tell their resolver to use those
// checkout-local outputs instead of potentially stale packaged prebuilds.
process.env.REMOTE_MOUSE_NATIVE_ARTIFACT_SOURCE = 'local';
await import('../index.js');
