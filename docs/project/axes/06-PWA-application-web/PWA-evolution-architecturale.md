## Évolution d'architecture applicative

Le frontend dépend actuellement de Socket.IO et de routes servies par le même
serveur. Pour permettre une PWA statique publique et un transport WebRTC local,
la logique doit être séparée en couches.

### Contrat de transport client

Créer une abstraction minimale commune :

```text
Transport
├── connect(pairing)
├── disconnect()
├── send(event, payload)
├── request(action, payload)
├── subscribe(event, listener)
└── connectionState
```

Implémentations envisagées :

- `SocketIoTransport` pour le mode local, le proxy VPN et HTTPS/WSS local ;
- `WebRtcTransport` pour le service PWA gratuit ou auto-hébergé.

La sélection doit venir de la configuration ou des capacités annoncées pendant
l'association, sans condition dispersée dans l'interface.

Les flux de prévisualisation réutilisent ce contrat : le helper natif Wayland
ou l'adaptateur de capture de la plateforme publie des frames binaires avec
métadonnées et séquence, tandis que le canal
choisi applique ses propres règles de backpressure et d'abandon des frames
obsolètes. Aucun backend PipeWire ne doit imposer Socket.IO ou WebRTC au code de
capture.

### Contrat de déploiement public

Les composants publics doivent également être découplés :

- artefact PWA statique ;
- service de signalisation WebRTC optionnel ;
- configuration STUN/TURN optionnelle ;
- exemple de reverse proxy VPN optionnel ;
- service de relais WebSocket et agent de reverse tunnel optionnels ;
- manifeste de capacités permettant au client de choisir le transport.

Le service public gratuit et les déploiements sur VPS personnel doivent
réutiliser les mêmes artefacts et formats de configuration. Le relais custom ne
doit pas introduire une deuxième implémentation de la logique métier : il
transporte les échanges vers le serveur HTTP/Socket.IO existant.

### Contrat du reverse tunnel applicatif

Le protocole du relais doit rester indépendant des commandes Remote Mouse et
modéliser des flux génériques :

```text
TunnelMessage
├── open(streamId, method, path, headers)
├── data(streamId, binaryChunk)
├── end(streamId)
├── cancel(streamId, reason)
├── response(streamId, status, headers)
└── windowUpdate(streamId, availableBytes)
```

Un adaptateur VPS convertit HTTPS/WSS vers ces messages. Un adaptateur
on-premise les convertit vers le serveur Express/Socket.IO local. Le protocole
doit être versionné et testé indépendamment des deux adaptateurs.

### Partage de la logique serveur

Les actions souris, clavier, navigateur, VLC, TV et administration ne doivent
pas être réécrites dans le gateway WebRTC. Les handlers Socket.IO actuels
doivent appeler des services ou un dispatcher de commandes partagé par les
deux transports.

### Canaux WebRTC

Un prototype doit évaluer au minimum deux canaux :

- canal fiable et ordonné pour clics, clavier, configuration et administration ;
- canal non ordonné, à retransmission limitée, pour mouvements de souris et
  données rapidement périmées.

La prévisualisation doit être testée séparément afin de choisir entre
DataChannel, piste vidéo WebRTC ou désactivation lorsque la bande passante est
insuffisante.
