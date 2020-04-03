# Peer2Peer-Query

### How to start peer to peer network
1. Create different peer folders with differing images
2. Start p1 with the command node peer2peerDB.js -v <Version> -n <Max number of peers>
3. Build topology by connecting other peers using the command node peer2peerDB.js -p [IP]:[Port] -v [Version] -n [Max number of peers]
  
### How to query the network
1. Navigate to the client folder
2. Run the command node GetImage -s [IP]:[Port] -q [Imagename & File Extension] -v [Version]
  
