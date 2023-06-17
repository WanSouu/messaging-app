import { Button, Center, Container, Group, Paper, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { ThemeProvider } from './ThemeProvider';

import { initializeApp } from "firebase/app";
import { useEffect, useState, useRef, useImperativeHandle } from 'react';

import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { getDatabase, onValue, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCyA3FjCn9jNCZCvd_HIr6TmR9DuHhC3lo",
  authDomain: "messaging-app-90cb2.firebaseapp.com",
  projectId: "messaging-app-90cb2",
  storageBucket: "messaging-app-90cb2.appspot.com",
  messagingSenderId: "335814736566",
  databaseURL: "https://messaging-app-90cb2-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:335814736566:web:eb13f6ad1c1c93d3884417"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();
const messagesRef = ref(database, 'messages');


function googleSignIn() { signInWithPopup(auth, provider) }
function googleSignOut() { signOut(auth) }   

let messageUpdate = 0;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('')
  const chatboxRef = useRef();

  function detectMessageChange(data:Array<messagesInterface>) {
    if (data.length != messages.length) { console.log("diff len"); return true; }
    for(let i = 0; i < data.length; i++) {
      if (data[i].message != data[i].message) {
        console.log("msg no match")
        return true; 
      } 
    }
    return false;
  }
  useEffect(() => {
    onAuthStateChanged(auth,(user) => {
      if (user) {
        setUsername(user.displayName as string)
      }else if (user!='') {
        setUsername('')
      }
    })

    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      console.log(1, data);
      if (detectMessageChange(data)==true) {
        setMessages(data)
        messageUpdate++;
        console.log(2)
      }
      console.log(3);
    });
  },[])
  

  return (
    <ThemeProvider>
     <Chatbox messageUpdate={messageUpdate} username={username} googleSignIn={googleSignIn} googleSignOut={googleSignOut} messages={messages} /> 
    </ThemeProvider>
  );
}
interface messagesInterface {
  user: string;
  message: string;
}
function Chatbox({messageUpdate, messages, googleSignIn, googleSignOut, username}:{messageUpdate:number, messages: Array<messagesInterface>, googleSignIn: () => void, googleSignOut: () => void, username: string}) {
  const [currentMessage, setCurrentMessage] = useState("");
  const chatViewport = useRef<HTMLDivElement>(null);

  function sendMessage(data:messagesInterface) {
    set(ref(database, 'messages/'+messages.length), {
      message: data.message,
      user: data.user  
    });
    setCurrentMessage('')
  }

  useEffect(() => {
    chatViewport.current?.scrollTo({top: chatViewport.current?.scrollHeight, behavior: (messageUpdate==1) ? 'instant' : 'smooth'})
  },[messageUpdate])

  return (
    <Stack h="100vh">
      {
      username=='' ?
      <Button mx="md" mt="md" onClick={googleSignIn}>Sign in</Button> :
      <Button mx="md" mt="md" onClick={googleSignOut}>Sign out</Button>
      }
    <ScrollArea viewportRef={chatViewport} h="100%" px="md">
      {messages.map((currentMessageData:messagesInterface, messageIndex:number) => 
      <Paper key={messageIndex} shadow="md" mt="md" p="sm" withBorder>
        <Stack spacing="0">
          <Text size="sm" c="dimmed">{currentMessageData.user}</Text>
          <Text size="md">{currentMessageData.message}</Text>
        </Stack> 
      </Paper>
      )}
    </ScrollArea>
      <Group p="md" align='flex-end' noWrap>
        <TextInput label={username=='' ? "Guest" : username} w="90%" placeholder="Message" value={currentMessage} onChange={(message) => {setCurrentMessage(message.currentTarget.value)}}></TextInput>
        <Button w="20%" disabled={currentMessage==''} onClick={() => sendMessage({message: currentMessage, user: username})}>Send</Button>
      </Group>
    </Stack>
  )
}