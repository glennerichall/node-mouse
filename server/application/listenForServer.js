export function listenForServer(server, {port, host}) {
  return new Promise((resolve, reject) => {
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    const onError = (error) => {
      server.removeListener('listening', onListening);
      const address = host ? `${host}:${port}` : `port ${port}`;
      const message = error.code === 'EADDRINUSE'
        ? `Cannot start server: ${address} is already in use`
        : `Cannot start server on ${address}: ${error.message}`;
      const startupError = new Error(message, {cause: error});
      startupError.code = error.code;
      reject(startupError);
    };

    server.once('error', onError);
    if (host) {
      server.listen(port, host, onListening);
      return;
    }
    server.listen(port, onListening);
  });
}
