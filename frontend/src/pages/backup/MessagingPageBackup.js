import React, { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import axios from '../api/axios';
import { useUser } from './UserContext';

const MessagingPage = () => {
  const { currentUser } = useUser();
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistories, setChatHistories] = useState({});
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  // WebSocket setup for messaging and signaling
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    selectedUser ? `ws://localhost:8080` : null,
    {
      onOpen: () => {
        console.log('WebSocket connection opened');
        fetchChatHistory(selectedUser._id);
      },
      onClose: () => console.log('WebSocket connection closed'),
  onMessage: (message) => {
  console.log('Received message:', message);
  
  if (message.data instanceof Blob) {
    // If the data is a Blob, convert it to text
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        const messageData = JSON.parse(text);
        console.log('Parsed message data from Blob:', messageData);
        if (messageData.sender_id === selectedUser._id) {
          appendMessageToHistory(messageData.sender_id, messageData);
          console.log('Message appended to history:', messageData);
        } else {
          console.warn('Received message from a different user:', messageData.sender_id);
        }
      } catch (error) {
        console.error('Error parsing message from Blob:', error);
      }
    };
    reader.readAsText(message.data);
  } else if (typeof message.data === 'string') {
    try {
      const messageData = JSON.parse(message.data);
      console.log('Parsed message data:', messageData);
      if (messageData.sender_id === selectedUser._id) {
        appendMessageToHistory(messageData.sender_id, messageData);
        console.log('Message appended to history:', messageData);
      } else {
        console.warn('Received message from a different user:', messageData.sender_id);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
},


    }
  );

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Fetch friends list on component mount
  useEffect(() => {
    if (currentUser) {
      const fetchFriends = async () => {
        try {
          const response = await axios.post('/fetch-friends', { user_id: currentUser.user_id });
          setFriends(response.data.friends);
        } catch (error) {
          console.error('Error fetching friends:', error);
        }
      };
      fetchFriends();
    }
  }, [currentUser]);

  // Search for users by username
  const searchUsers = async () => {
    try {
      const response = await axios.post('/search-users', { username: searchUsername });
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Start a chat with the selected user
  const startChat = (user) => {
    console.log('start chat ->> currentuser:'+ currentUser.user_id);
    console.log('start chat ->> selected user: '+user._id);
    setSelectedUser(user);
    if (!chatHistories[user._id]) {
      fetchChatHistory(user._id);
    }
  };

  // Initiate a video call with the selected user
  const startVideoCall = async (user) => {
    setSelectedUser(user);
    setIsVideoCallActive(true);
  };

  useEffect(() => {
    if (isVideoCallActive) {
      setupVideoCall();
    }
  }, [isVideoCallActive]);

  // End the current video call
  const endVideoCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsVideoCallActive(false);
  };

  // Set up the WebRTC connection for video calls
  const setupVideoCall = async () => {
    const peerConnection = new RTCPeerConnection();
    peerConnectionRef.current = peerConnection;

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = localStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        sendMessage(JSON.stringify({ candidate: event.candidate }));
      }
    };

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendMessage(JSON.stringify({ offer: peerConnection.localDescription }));
    };
  };

  // Handle receiving an offer for WebRTC
  const handleOffer = async (offer) => {
    const peerConnection = peerConnectionRef.current;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendMessage(JSON.stringify({ answer: peerConnection.localDescription }));
  };

  // Handle receiving an answer for WebRTC
  const handleAnswer = async (answer) => {
    const peerConnection = peerConnectionRef.current;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // Handle receiving an ICE candidate for WebRTC
  const handleCandidate = async (candidate) => {
    const peerConnection = peerConnectionRef.current;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // Fetch chat history with a specific user
  const fetchChatHistory = async (userId) => {
    setChatHistories(prev => ({ ...prev, [userId]: [] }));
  };

  // Append a new message to the chat history
  const appendMessageToHistory = (userId, messageData) => {
    setChatHistories(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), messageData]
    }));
  };

  // Send a message to the WebSocket server
  const handleSendMessage = () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    console.log('handleSendMessage --> currentuser :'+currentUser.user_id);
    console.log('handleSendMessage --> selectedUser :'+selectedUser._id);
    const messageData = {
      sender_id: currentUser.user_id,
      receiver_id: selectedUser._id,
      message,
      sender: 'You'
    };

    console.log("handleSendMessage --> message data : sender_id="+currentUser.user_id+"receiver_id = "+ selectedUser._id);

    sendMessage(JSON.stringify(messageData));
    appendMessageToHistory(selectedUser._id, messageData);
    messageInput.value = '';
  };

  // Handle Blob data received via WebSocket (e.g., for video streams)
  const handleBlobData = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    console.log('Received binary data:', arrayBuffer);
  };

  // Connection status for the WebSocket
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* First Column: Search and Friends List */}
      <div className="w-1/3 p-4 bg-gray-100">
        {/* Search Users Section */}
        <div className="mb-6">
          <h2 className="text-2xl mb-4">Search Users</h2>
          <div className="flex mb-4">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username"
              className="flex-grow p-2 border rounded"
            />
            <button onClick={searchUsers} className="bg-blue-600 text-white px-4 py-2 rounded ml-2">Search</button>
          </div>
          {searchResults.length > 0 && (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Username</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(user => (
                  <tr key={user.user_id}>
                    <td className="py-2 px-4 border-b">{user.user_name}</td>
                    <td className="py-2 px-4 border-b flex space-x-2">
                      <button
                        onClick={() => startChat(user)}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => startVideoCall(user)}
                        className="bg-green-500 text-white px-3 py-1 rounded"
                      >
                        Video Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Friends List Section */}
        <div>
          <h2 className="text-2xl mb-4">Friends</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Username</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {friends.map(friend => (
                <tr key={friend.user_id}>
                  <td className="py-2 px-4 border-b">{friend.user_name}</td>
                  <td className="py-2 px-4 border-b flex space-x-2">
                    <button
                      onClick={() => startChat(friend)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => startVideoCall(friend)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Video Call
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Second Column: Chat Area */}
      <div className="w-2/3 p-4">
        {selectedUser ? (
          <div>
            <h2 className="text-2xl mb-4">Chat with {selectedUser.user_name}</h2>
            <div className="border p-4 h-full">
              {/* Chat content */}
              <div>
  {(chatHistories[selectedUser._id] || []).map((msg, index) => (
    <p key={`${msg.sender_id}-${index}`}>
      {msg.sender_id === currentUser.user_id ? 'You' : selectedUser.user_name}: {msg.message}
    </p>
  ))}
</div>


              <input type="text" id="messageInput" placeholder="Type your message" className="p-2 border rounded w-full mb-2" />
              <button onClick={handleSendMessage} className="bg-blue-500 text-white px-3 py-1 rounded">Send</button>
            </div>
            {isVideoCallActive && (
              <div className="mt-4">
                <h2 className="text-xl mb-2">Video Call</h2>
                <div className="flex space-x-4">
                  <video ref={localVideoRef} autoPlay playsInline className="w-1/2 border" />
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border" />
                </div>
                <button onClick={endVideoCall} className="bg-red-500 text-white px-3 py-1 rounded mt-2">End Call</button>
              </div>
            )}
          </div>
        ) : (
          <p>Select a user to start chatting</p>
        )}
        <div>
          Connection status: {connectionStatus}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
